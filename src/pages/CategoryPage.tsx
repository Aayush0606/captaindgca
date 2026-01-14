import { useParams, Link, useLocation } from "react-router-dom";
import { useState, useMemo } from "react";
import { ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { QuestionCard } from "@/components/QuestionCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { getTopicById, getCategoryById, getTopics } from "@/services/categoryService";
import { getQuestionsByTopic, getQuestions, mapQuestionToApp } from "@/services/questionService";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { categories } from "@/data/categories";
import { getQuestionsByCategory } from "@/data/sampleQuestions";
import { supabase } from "@/lib/supabase";

const CategoryPage = () => {
  const { slug, id } = useParams<{ slug?: string; id?: string }>();
  const location = useLocation();
  
  // Determine if this is a topic route
  const isTopicRoute = location.pathname.startsWith('/topic/');
  const topicId = isTopicRoute ? id : undefined;
  
  // Determine if this is a database category route
  // If we have an 'id' param, it's a UUID-based route
  // If we have a 'slug' param, check if it looks like a UUID (contains hyphens) or is a legacy slug
  const isCategoryRoute = !isTopicRoute && (id || (slug && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug)));
  const categoryId = isCategoryRoute ? (id || slug) : undefined;
  
  // Fetch topic data if it's a topic route
  const { data: topicData, isLoading: isLoadingTopic } = useQuery({
    queryKey: ['topic', topicId],
    queryFn: () => topicId ? getTopicById(topicId) : Promise.resolve({ data: null, error: null }),
    enabled: !!topicId,
  });

  // Fetch questions for the topic
  const { data: questionsData, isLoading: isLoadingQuestions } = useQuery({
    queryKey: ['topicQuestions', topicId],
    queryFn: () => topicId ? getQuestionsByTopic(topicId) : Promise.resolve({ data: null, error: null }),
    enabled: !!topicId,
  });

  // Fetch category data if it's a database category route
  const { data: categoryData, isLoading: isLoadingCategory } = useQuery({
    queryKey: ['category', categoryId],
    queryFn: () => categoryId ? getCategoryById(categoryId) : Promise.resolve({ data: null, error: null }),
    enabled: !!categoryId,
  });

  // Fetch topics for the category
  const { data: topicsData, isLoading: isLoadingTopics } = useQuery({
    queryKey: ['categoryTopics', categoryId],
    queryFn: () => categoryId ? getTopics(categoryId) : Promise.resolve({ data: null, error: null }),
    enabled: !!categoryId,
  });

  const topic = topicData?.data || null;
  const questions = questionsData?.data?.map(mapQuestionToApp) || [];
  const dbCategory = categoryData?.data || null;
  const categoryTopics = topicsData?.data || [];

  // State for selected topic (null means show all questions)
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);

  // Fetch questions for all topics in the category
  const { data: allQuestionsData, isLoading: isLoadingAllQuestions } = useQuery({
    queryKey: ['categoryAllQuestions', categoryId, categoryTopics.map(t => t.id)],
    queryFn: async () => {
      if (!categoryId || categoryTopics.length === 0) {
        return { data: null, error: null };
      }
      
      // Fetch questions for all topics in this category
      const topicIds = categoryTopics.map(t => t.id);
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .in('topic_id', topicIds)
        .order('created_at', { ascending: false });
      
      return { data, error };
    },
    enabled: !!categoryId && categoryTopics.length > 0,
  });

  const allQuestions = allQuestionsData?.data?.map(mapQuestionToApp) || [];

  // Filter questions based on selected topic
  const filteredQuestions = useMemo(() => {
    if (!selectedTopicId) {
      return allQuestions;
    }
    return allQuestions.filter(q => q.topicId === selectedTopicId);
  }, [allQuestions, selectedTopicId]);

  // Handle database category route
  if (isCategoryRoute) {
    if (isLoadingCategory || isLoadingTopics || isLoadingAllQuestions) {
      return (
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1 container mx-auto px-4 py-16">
            <div className="space-y-4">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-6 w-96" />
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <Skeleton className="h-6 w-32 mb-2" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-24" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </main>
          <Footer />
        </div>
      );
    }

    if (!dbCategory) {
      return (
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1 container mx-auto px-4 py-16 text-center">
            <h1 className="text-2xl font-bold mb-4">Category Not Found</h1>
            <p className="text-muted-foreground mb-8">The category you're looking for doesn't exist.</p>
            <Link to="/">
              <Button>Back to Home</Button>
            </Link>
          </main>
          <Footer />
        </div>
      );
    }

    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        
        <main className="flex-1">
          {/* Header */}
          <section className="border-b bg-muted/30 py-8">
            <div className="container mx-auto px-4">
              <Link 
                to="/" 
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Link>
              
              <div className="flex flex-col gap-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2">{dbCategory.name}</h1>
                  {dbCategory.description && (
                    <p className="text-muted-foreground">{dbCategory.description}</p>
                  )}
                </div>
                
                {/* Topic Pills - Horizontal Scrollable */}
                {categoryTopics.length > 0 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-2 px-2">
                    <Button
                      variant={selectedTopicId === null ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedTopicId(null)}
                      className="shrink-0"
                    >
                      All Topics
                    </Button>
                    {categoryTopics.map((topic) => {
                      const topicQuestionCount = allQuestions.filter(q => q.topicId === topic.id).length;
                      return (
                        <Button
                          key={topic.id}
                          variant={selectedTopicId === topic.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedTopicId(topic.id)}
                          className="shrink-0"
                        >
                          {topic.name}
                          {topicQuestionCount > 0 && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              {topicQuestionCount}
                            </Badge>
                          )}
                        </Button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Questions List */}
          <section className="py-8">
            <div className="container mx-auto px-4">
              {filteredQuestions.length > 0 ? (
                <div className="space-y-4">
                  {filteredQuestions.map((question, index) => (
                    <QuestionCard key={question.id} question={question} index={index} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <p className="text-muted-foreground mb-4">
                    {selectedTopicId 
                      ? "No questions found for this topic yet."
                      : "No questions found for this category yet."
                    }
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Questions will be added soon. Check back later!
                  </p>
                </div>
              )}
            </div>
          </section>
        </main>

        <Footer />
      </div>
    );
  }

  if (isTopicRoute) {
    if (isLoadingTopic || isLoadingQuestions) {
      return (
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1 container mx-auto px-4 py-16">
            <div className="space-y-4">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-6 w-96" />
              <Skeleton className="h-32 w-full" />
            </div>
          </main>
          <Footer />
        </div>
      );
    }

    if (!topic) {
      return (
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1 container mx-auto px-4 py-16 text-center">
            <h1 className="text-2xl font-bold mb-4">Topic Not Found</h1>
            <p className="text-muted-foreground mb-8">The topic you're looking for doesn't exist.</p>
            <Link to="/">
              <Button>Back to Home</Button>
            </Link>
          </main>
          <Footer />
        </div>
      );
    }

    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        
        <main className="flex-1">
          {/* Header */}
          <section className="border-b bg-muted/30 py-8">
            <div className="container mx-auto px-4">
              <Link 
                to="/" 
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Link>
              
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2">{topic.name}</h1>
                  {topic.description && (
                    <p className="text-muted-foreground">{topic.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-3">
                    <Badge variant="secondary">{questions.length} {questions.length === 1 ? 'question' : 'questions'}</Badge>
                  </div>
                </div>
                
                {questions.length > 0 && (
                  <Link to={`/practice?topic=${topicId}`}>
                    <Button size="lg" className="gap-2">
                      Start Practice Test
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </section>

          {/* Questions List */}
          <section className="py-8">
            <div className="container mx-auto px-4">
              {/* Questions */}
              {questions.length > 0 ? (
                <div className="space-y-4">
                  {questions.map((question, index) => (
                    <QuestionCard key={question.id} question={question} index={index} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <p className="text-muted-foreground mb-4">
                    No questions found for this topic yet.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Questions will be added soon. Check back later!
                  </p>
                </div>
              )}
            </div>
          </section>
        </main>

        <Footer />
      </div>
    );
  }

  // Legacy category route handling (for backward compatibility)
  // This uses hardcoded data - consider migrating to database queries
  // Only handle legacy categories if we have a slug (not an id-based route)
  const legacyCategory = slug ? categories.find((c) => c.slug === slug) as (typeof categories[0] & { subcategories?: string[] }) | undefined : undefined;
  const legacyQuestions = slug ? getQuestionsByCategory(slug) : [];

  if (!slug || !legacyCategory) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Category Not Found</h1>
          <p className="text-muted-foreground mb-8">The category you're looking for doesn't exist.</p>
          <Link to="/">
            <Button>Back to Home</Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Header */}
        <section className="border-b bg-muted/30 py-8">
          <div className="container mx-auto px-4">
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Categories
            </Link>
            
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">{legacyCategory.name}</h1>
                <p className="text-muted-foreground">{legacyCategory.description}</p>
                <div className="flex items-center gap-2 mt-3">
                  <Badge variant="secondary">{legacyCategory.questionCount}+ questions</Badge>
                  {(legacyCategory as any).subcategories && (
                    <Badge variant="outline">
                      {(legacyCategory as any).subcategories.length} subcategories
                    </Badge>
                  )}
                </div>
              </div>
              
              <Link to={`/practice?category=${slug}`}>
                <Button size="lg" className="gap-2">
                  Start Practice Test
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Subcategories */}
        {(legacyCategory as any).subcategories && (
          <section className="border-b py-4">
            <div className="container mx-auto px-4">
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                <span className="text-sm font-medium text-muted-foreground shrink-0">Topics:</span>
                {(legacyCategory as any).subcategories.map((sub: string) => (
                  <Badge key={sub} variant="outline" className="shrink-0 cursor-pointer hover:bg-muted">
                    {sub}
                  </Badge>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Questions List */}
        <section className="py-8">
          <div className="container mx-auto px-4">
            {/* Questions */}
            {legacyQuestions.length > 0 ? (
              <div className="space-y-4">
                {legacyQuestions.map((question: any, index: number) => (
                  <QuestionCard key={question.id} question={question} index={index} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-muted-foreground mb-4">
                  No questions found for this category yet.
                </p>
                <p className="text-sm text-muted-foreground">
                  Sample questions will be added soon. Check back later!
                </p>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default CategoryPage;
