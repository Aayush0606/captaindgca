-- Supabase Database Schema - Simplified Structure
-- Structure: Section (Type) → Subtype (optional) → Category → Topic → Question
-- Navigation is auto-generated from content hierarchy (no separate navigation tables)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USER & AUTH TABLES
-- ============================================================================

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  phone_number TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CONTENT HIERARCHY TABLES
-- ============================================================================

-- Sections table (references hardcoded sections: dgca_questions, books, aircrafts, airlines)
-- This table stores metadata for sections, but sections themselves are hardcoded in the app
CREATE TABLE IF NOT EXISTS public.sections (
  type TEXT PRIMARY KEY CHECK (type IN ('dgca_questions', 'books', 'aircrafts', 'airlines')),
  name TEXT NOT NULL,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subtypes table (optional grouping between Section and Category)
-- Examples: "Navigation", "Instruments" under "D.G.C.A. Questions"
CREATE TABLE IF NOT EXISTS public.subtypes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_type TEXT REFERENCES public.sections(type) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(section_type, slug)
);

-- Categories table
-- Can be directly under a Section OR under a Subtype (not both)
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_type TEXT REFERENCES public.sections(type) ON DELETE CASCADE,
  subtype_id UUID REFERENCES public.subtypes ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Constraint: Either section_type OR subtype_id must be set (not both, not neither)
  CONSTRAINT category_parent_check CHECK (
    (section_type IS NOT NULL AND subtype_id IS NULL) OR
    (section_type IS NULL AND subtype_id IS NOT NULL)
  ),
  -- Unique slug within parent (section or subtype)
  UNIQUE(section_type, slug),
  UNIQUE(subtype_id, slug)
);

-- Topics table (under categories)
-- Note: category_id is nullable - topics can be created without categories and linked later
CREATE TABLE IF NOT EXISTS public.topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.categories ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Unique slug per category (or globally if category_id is null)
  UNIQUE(category_id, slug)
);

-- Topic-Categories junction table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS public.topic_categories (
  topic_id UUID REFERENCES public.topics ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.categories ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (topic_id, category_id)
);

-- Migration: Populate topic_categories from existing topics.category_id
-- This should be run once after creating the junction table
INSERT INTO public.topic_categories (topic_id, category_id)
SELECT id, category_id
FROM public.topics
WHERE category_id IS NOT NULL
ON CONFLICT (topic_id, category_id) DO NOTHING;

-- Questions table (under topics)
-- Only topics can have questions (e.g., "Radio Communication" topic under "Communication" category)
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID REFERENCES public.topics ON DELETE CASCADE NOT NULL,
  question TEXT NOT NULL,
  options TEXT[] NOT NULL,
  correct_answer INTEGER NOT NULL,
  explanation TEXT,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users
);

-- ============================================================================
-- USER PROGRESS & TEST TABLES
-- ============================================================================

-- Test results table
CREATE TABLE IF NOT EXISTS public.test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  topic_id UUID REFERENCES public.topics,
  category_id UUID REFERENCES public.categories,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  time_taken INTEGER NOT NULL, -- in seconds
  answers JSONB NOT NULL, -- Array of {questionId, selectedAnswer, isCorrect, timeTaken}
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User progress table (aggregated statistics)
CREATE TABLE IF NOT EXISTS public.user_progress (
  user_id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  total_tests_taken INTEGER DEFAULT 0,
  total_questions_attempted INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  streak INTEGER DEFAULT 0,
  last_active_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Category progress table
CREATE TABLE IF NOT EXISTS public.category_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.categories ON DELETE CASCADE NOT NULL,
  questions_attempted INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  last_attempted TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, category_id)
);

-- Topic progress table
CREATE TABLE IF NOT EXISTS public.topic_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  topic_id UUID REFERENCES public.topics ON DELETE CASCADE NOT NULL,
  questions_attempted INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  last_attempted TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, topic_id)
);

-- Bookmarks table
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES public.questions ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, question_id)
);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subtypes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Sections policies (public read, admin write)
CREATE POLICY "Sections are viewable by everyone"
  ON public.sections FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert sections"
  ON public.sections FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
    )
  );

CREATE POLICY "Admins can update sections"
  ON public.sections FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
    )
  );

CREATE POLICY "Admins can delete sections"
  ON public.sections FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
    )
  );

-- Subtypes policies (public read, admin write)
CREATE POLICY "Subtypes are viewable by everyone"
  ON public.subtypes FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert subtypes"
  ON public.subtypes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
    )
  );

CREATE POLICY "Admins can update subtypes"
  ON public.subtypes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
    )
  );

CREATE POLICY "Admins can delete subtypes"
  ON public.subtypes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
    )
  );

-- Categories policies (public read, admin write)
CREATE POLICY "Categories are viewable by everyone"
  ON public.categories FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert categories"
  ON public.categories FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
    )
  );

CREATE POLICY "Admins can update categories"
  ON public.categories FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
    )
  );

CREATE POLICY "Admins can delete categories"
  ON public.categories FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
    )
  );

-- Topics policies (public read, admin write)
CREATE POLICY "Topics are viewable by everyone"
  ON public.topics FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert topics"
  ON public.topics FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
    )
  );

CREATE POLICY "Admins can update topics"
  ON public.topics FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
    )
  );

CREATE POLICY "Admins can delete topics"
  ON public.topics FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
    )
  );

-- Questions policies (public read, admin write)
CREATE POLICY "Questions are viewable by everyone"
  ON public.questions FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert questions"
  ON public.questions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
    )
  );

CREATE POLICY "Admins can update questions"
  ON public.questions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
    )
  );

CREATE POLICY "Admins can delete questions"
  ON public.questions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
    )
  );

-- Test results policies
CREATE POLICY "Users can view their own test results"
  ON public.test_results FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own test results"
  ON public.test_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- User progress policies
CREATE POLICY "Users can view their own progress"
  ON public.user_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
  ON public.user_progress FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
  ON public.user_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Category progress policies
CREATE POLICY "Users can view their own category progress"
  ON public.category_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own category progress"
  ON public.category_progress FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own category progress"
  ON public.category_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Topic progress policies
CREATE POLICY "Users can view their own topic progress"
  ON public.topic_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own topic progress"
  ON public.topic_progress FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own topic progress"
  ON public.topic_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Bookmarks policies
CREATE POLICY "Users can view their own bookmarks"
  ON public.bookmarks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bookmarks"
  ON public.bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookmarks"
  ON public.bookmarks FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Subtypes indexes
CREATE INDEX IF NOT EXISTS idx_subtypes_section_type ON public.subtypes(section_type);
CREATE INDEX IF NOT EXISTS idx_subtypes_slug ON public.subtypes(slug);

-- Categories indexes
CREATE INDEX IF NOT EXISTS idx_categories_section_type ON public.categories(section_type);
CREATE INDEX IF NOT EXISTS idx_categories_subtype_id ON public.categories(subtype_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);

-- Topics indexes
CREATE INDEX IF NOT EXISTS idx_topics_category_id ON public.topics(category_id);
CREATE INDEX IF NOT EXISTS idx_topics_slug ON public.topics(slug);

-- Topic-Categories junction table indexes
CREATE INDEX IF NOT EXISTS idx_topic_categories_topic_id ON public.topic_categories(topic_id);
CREATE INDEX IF NOT EXISTS idx_topic_categories_category_id ON public.topic_categories(category_id);

-- Questions indexes
CREATE INDEX IF NOT EXISTS idx_questions_topic_id ON public.questions(topic_id);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON public.questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_created_at ON public.questions(created_at DESC);

-- Test results indexes
CREATE INDEX IF NOT EXISTS idx_test_results_user_id ON public.test_results(user_id);
CREATE INDEX IF NOT EXISTS idx_test_results_topic_id ON public.test_results(topic_id);
CREATE INDEX IF NOT EXISTS idx_test_results_category_id ON public.test_results(category_id);
CREATE INDEX IF NOT EXISTS idx_test_results_created_at ON public.test_results(created_at DESC);

-- Progress indexes
CREATE INDEX IF NOT EXISTS idx_category_progress_user_id ON public.category_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_category_progress_category_id ON public.category_progress(category_id);
CREATE INDEX IF NOT EXISTS idx_topic_progress_user_id ON public.topic_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_topic_progress_topic_id ON public.topic_progress(topic_id);

-- Bookmarks indexes
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON public.bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_question_id ON public.bookmarks(question_id);

-- ============================================================================
-- TRIGGERS & FUNCTIONS
-- ============================================================================

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone_number)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'phone_number');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sections_updated_at BEFORE UPDATE ON public.sections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subtypes_updated_at BEFORE UPDATE ON public.subtypes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_topics_updated_at BEFORE UPDATE ON public.topics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON public.questions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_progress_updated_at BEFORE UPDATE ON public.user_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_category_progress_updated_at BEFORE UPDATE ON public.category_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_topic_progress_updated_at BEFORE UPDATE ON public.topic_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update user progress after test completion
CREATE OR REPLACE FUNCTION public.update_user_progress_after_test()
RETURNS TRIGGER AS $$
DECLARE
  correct_count INTEGER;
  topic_id_val UUID;
  category_id_val UUID;
BEGIN
  -- Count correct answers from the JSONB answers array
  SELECT COUNT(*) INTO correct_count
  FROM jsonb_array_elements(NEW.answers) AS answer
  WHERE (answer->>'isCorrect')::boolean = true;

  -- Get topic_id and category_id
  topic_id_val := NEW.topic_id;
  category_id_val := NEW.category_id;

  -- Update user_progress table
  INSERT INTO public.user_progress (user_id, total_tests_taken, total_questions_attempted, correct_answers, last_active_date)
  VALUES (NEW.user_id, 1, NEW.total_questions, correct_count, CURRENT_DATE)
  ON CONFLICT (user_id) DO UPDATE
  SET
    total_tests_taken = user_progress.total_tests_taken + 1,
    total_questions_attempted = user_progress.total_questions_attempted + NEW.total_questions,
    correct_answers = user_progress.correct_answers + correct_count,
    last_active_date = CURRENT_DATE,
    updated_at = NOW();

  -- Update topic_progress if topic_id exists
  IF topic_id_val IS NOT NULL THEN
    INSERT INTO public.topic_progress (user_id, topic_id, questions_attempted, correct_answers, last_attempted)
    VALUES (NEW.user_id, topic_id_val, NEW.total_questions, correct_count, NOW())
    ON CONFLICT (user_id, topic_id) DO UPDATE
    SET
      questions_attempted = topic_progress.questions_attempted + NEW.total_questions,
      correct_answers = topic_progress.correct_answers + correct_count,
      last_attempted = NOW(),
      updated_at = NOW();
  END IF;

  -- Update category_progress if category_id exists
  IF category_id_val IS NOT NULL THEN
    INSERT INTO public.category_progress (user_id, category_id, questions_attempted, correct_answers, last_attempted)
    VALUES (NEW.user_id, category_id_val, NEW.total_questions, correct_count, NOW())
    ON CONFLICT (user_id, category_id) DO UPDATE
    SET
      questions_attempted = category_progress.questions_attempted + NEW.total_questions,
      correct_answers = category_progress.correct_answers + correct_count,
      last_attempted = NOW(),
      updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update progress after test
CREATE TRIGGER update_progress_after_test
  AFTER INSERT ON public.test_results
  FOR EACH ROW EXECUTE FUNCTION public.update_user_progress_after_test();

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Insert default sections
INSERT INTO public.sections (type, name) VALUES
  ('dgca_questions', 'D.G.C.A. Questions'),
  ('books', 'Books'),
  ('aircrafts', 'Aircrafts'),
  ('airlines', 'Airlines')
ON CONFLICT (type) DO NOTHING;
