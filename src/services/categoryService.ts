import { supabase } from '@/lib/supabase';
import { Category, Subtype, Topic, SectionType } from '@/types/questions';

/**
 * Generate slug from name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-')      // Replace spaces with hyphens
    .replace(/-+/g, '-')       // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, '');  // Remove leading/trailing hyphens
}

// ============================================================================
// SUBTYPE INTERFACES & FUNCTIONS
// ============================================================================

export interface SubtypeInput {
  sectionType: SectionType;
  name: string;
  description?: string;
}

export interface SubtypeResponse {
  id: string;
  section_type: string;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export async function getSubtypes(sectionType?: SectionType): Promise<{ data: SubtypeResponse[] | null; error: any }> {
  let query = supabase
    .from('subtypes')
    .select('*')
    .order('name', { ascending: true });

  if (sectionType) {
    query = query.eq('section_type', sectionType);
  }

  const { data, error } = await query;
  return { data, error };
}

export async function createSubtype(subtype: SubtypeInput): Promise<{ data: SubtypeResponse | null; error: any }> {
  const slug = generateSlug(subtype.name);
  
  const { data, error } = await supabase
    .from('subtypes')
    .insert({
      section_type: subtype.sectionType,
      name: subtype.name,
      slug: slug,
      description: subtype.description || null,
    })
    .select()
    .single();

  return { data, error };
}

export async function updateSubtype(
  id: string,
  subtype: Partial<SubtypeInput>
): Promise<{ data: SubtypeResponse | null; error: any }> {
  const updateData: any = {};

  if (subtype.name !== undefined) {
    updateData.name = subtype.name;
    updateData.slug = generateSlug(subtype.name);
  }
  if (subtype.description !== undefined) updateData.description = subtype.description || null;
  if (subtype.sectionType !== undefined) updateData.section_type = subtype.sectionType;

  const { data, error } = await supabase
    .from('subtypes')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  return { data, error };
}

export async function deleteSubtype(id: string): Promise<{ error: any }> {
  const { error } = await supabase
    .from('subtypes')
    .delete()
    .eq('id', id);

  return { error };
}

// ============================================================================
// CATEGORY INTERFACES & FUNCTIONS
// ============================================================================

export interface CategoryInput {
  sectionType?: SectionType; // Only set if category is directly under section
  subtypeId?: string; // Only set if category is under a subtype
  name: string;
  description?: string;
  icon?: string;
}

export interface CategoryResponse {
  id: string;
  section_type: string | null;
  subtype_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  created_at: string;
  updated_at: string;
}

export interface CategoryWithCount extends CategoryResponse {
  question_count: number;
}

export async function getCategories(
  sectionType?: SectionType,
  subtypeId?: string
): Promise<{ data: CategoryResponse[] | null; error: any }> {
  let query = supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true });

  if (sectionType) {
    query = query.eq('section_type', sectionType).is('subtype_id', null);
  } else if (subtypeId) {
    query = query.eq('subtype_id', subtypeId);
  }

  const { data, error } = await query;
  return { data, error };
}

export async function getCategoriesWithCounts(
  limit?: number,
  sectionType?: SectionType
): Promise<{ data: CategoryWithCount[] | null; error: any }> {
  let query = supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true });

  if (sectionType) {
    query = query.eq('section_type', sectionType).is('subtype_id', null);
  }

  const { data: categories, error: categoriesError } = await query;

  if (categoriesError || !categories) {
    return { data: null, error: categoriesError };
  }

  // Get question counts for each category (through topics using junction table)
  const categoriesWithCounts = await Promise.all(
    categories.map(async (category) => {
      // Get all topics for this category using junction table
      const { data: topicCategories } = await supabase
        .from('topic_categories')
        .select('topic_id')
        .eq('category_id', category.id);

      if (!topicCategories || topicCategories.length === 0) {
        return { ...category, question_count: 0 };
      }

      const topicIds = topicCategories.map((tc) => tc.topic_id);

      // Count questions
      const { count } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .in('topic_id', topicIds);

      return {
        ...category,
        question_count: count ?? 0,
      };
    })
  );

  // Sort by question count descending and limit
  const sorted = categoriesWithCounts.sort((a, b) => b.question_count - a.question_count);
  const limited = limit ? sorted.slice(0, limit) : sorted;

  return { data: limited as CategoryWithCount[], error: null };
}

export async function getCategoryBySlug(
  slug: string,
  sectionType?: SectionType
): Promise<{ data: CategoryResponse | null; error: any }> {
  let query = supabase
    .from('categories')
    .select('*')
    .eq('slug', slug);

  if (sectionType) {
    query = query.eq('section_type', sectionType);
  }

  const { data, error } = await query.single();
  return { data, error };
}

export async function getCategoryById(id: string): Promise<{ data: CategoryResponse | null; error: any }> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('id', id)
    .single();

  return { data, error };
}

export async function createCategory(category: CategoryInput): Promise<{ data: CategoryResponse | null; error: any }> {
  const slug = generateSlug(category.name);
  
  const { data, error } = await supabase
    .from('categories')
    .insert({
      section_type: category.sectionType || null,
      subtype_id: category.subtypeId || null,
      name: category.name,
      slug: slug,
      description: category.description || null,
      icon: category.icon || null,
    })
    .select()
    .single();

  return { data, error };
}

export async function updateCategory(
  id: string,
  category: Partial<CategoryInput>
): Promise<{ data: CategoryResponse | null; error: any }> {
  const updateData: any = {};

  if (category.name !== undefined) {
    updateData.name = category.name;
    updateData.slug = generateSlug(category.name);
  }
  if (category.description !== undefined) updateData.description = category.description || null;
  if (category.icon !== undefined) updateData.icon = category.icon || null;
  if (category.sectionType !== undefined) updateData.section_type = category.sectionType || null;
  if (category.subtypeId !== undefined) updateData.subtype_id = category.subtypeId || null;

  const { data, error } = await supabase
    .from('categories')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  return { data, error };
}

export async function deleteCategory(id: string): Promise<{ error: any }> {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);

  return { error };
}

// ============================================================================
// TOPIC INTERFACES & FUNCTIONS
// ============================================================================

export interface TopicInput {
  categoryIds?: string[]; // Array of category IDs for many-to-many relationship (optional - empty array = no categories)
  name: string;
  description?: string;
}

export interface TopicResponse {
  id: string;
  category_id: string | null; // Nullable - topics can exist without categories
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export async function getTopics(categoryId?: string): Promise<{ data: TopicResponse[] | null; error: any }> {
  let query = supabase
    .from('topics')
    .select('*');

  // If categoryId is provided, filter using junction table
  if (categoryId) {
    const { data: topicIds, error: junctionError } = await supabase
      .from('topic_categories')
      .select('topic_id')
      .eq('category_id', categoryId);

    if (junctionError || !topicIds || topicIds.length === 0) {
      return { data: [], error: junctionError };
    }

    const ids = topicIds.map(t => t.topic_id);
    query = query.in('id', ids);
  }

  query = query.order('name', { ascending: true });
  const { data, error } = await query;

  return { data, error };
}

export async function createTopic(topic: TopicInput): Promise<{ data: TopicResponse | null; error: any }> {
  const slug = generateSlug(topic.name);
  const categoryIds = topic.categoryIds || [];
  
  // Topics can be created without categories - category_id is nullable
  // Categories can be linked later via the Content Manager
  const primaryCategoryId = categoryIds.length > 0 ? categoryIds[0] : null;
  
  // Create the topic (category_id can be null)
  const { data, error } = await supabase
    .from('topics')
    .insert({
      category_id: primaryCategoryId,
      name: topic.name,
      slug: slug,
      description: topic.description || null,
    })
    .select()
    .single();

  if (error || !data) {
    throw error || new Error('Failed to create topic');
  }

  // Insert into junction table for all categories (if any)
  if (categoryIds.length > 0) {
    const junctionEntries = categoryIds.map(categoryId => ({
      topic_id: data.id,
      category_id: categoryId,
    }));

    const { error: junctionError } = await supabase
      .from('topic_categories')
      .insert(junctionEntries);

    if (junctionError) {
      // Clean up: delete the topic if junction insert fails
      await supabase.from('topics').delete().eq('id', data.id);
      throw junctionError;
    }
  }

  return { data, error: null };
}

export async function updateTopic(
  id: string,
  topic: Partial<TopicInput>
): Promise<{ data: TopicResponse | null; error: any }> {
  const updateData: any = {};

  if (topic.name !== undefined) {
    updateData.name = topic.name;
    updateData.slug = generateSlug(topic.name);
  }
  if (topic.description !== undefined) updateData.description = topic.description || null;

  // Update basic topic fields
  const { data, error } = await supabase
    .from('topics')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    return { data: null, error };
  }

  // If categoryIds are provided, update junction table
  if (topic.categoryIds !== undefined) {
    if (topic.categoryIds.length > 0) {
      // Use first category as primary category_id for backward compatibility
      const primaryCategoryId = topic.categoryIds[0];
      await supabase
        .from('topics')
        .update({ category_id: primaryCategoryId })
        .eq('id', id);

      // Delete existing junction entries
      await supabase
        .from('topic_categories')
        .delete()
        .eq('topic_id', id);

      // Insert new junction entries
      const junctionEntries = topic.categoryIds.map(categoryId => ({
        topic_id: id,
        category_id: categoryId,
      }));

      const { error: junctionError } = await supabase
        .from('topic_categories')
        .insert(junctionEntries);

      if (junctionError) {
        return { data: null, error: junctionError };
      }
    } else {
      // If categoryIds is empty array, set category_id to null and remove all junction entries
      await supabase
        .from('topics')
        .update({ category_id: null })
        .eq('id', id);
      
      await supabase
        .from('topic_categories')
        .delete()
        .eq('topic_id', id);
    }
  }

  return { data, error: null };
}

export async function deleteTopic(id: string): Promise<{ error: any }> {
  const { error } = await supabase
    .from('topics')
    .delete()
    .eq('id', id);

  return { error };
}

export async function getTopicById(id: string): Promise<{ data: TopicResponse | null; error: any }> {
  const { data, error } = await supabase
    .from('topics')
    .select('*')
    .eq('id', id)
    .single();

  return { data, error };
}

/**
 * Get all category IDs for a topic
 */
export async function getTopicCategories(topicId: string): Promise<{ data: string[] | null; error: any }> {
  const { data, error } = await supabase
    .from('topic_categories')
    .select('category_id')
    .eq('topic_id', topicId);

  if (error || !data) {
    return { data: null, error };
  }

  const categoryIds = data.map(item => item.category_id);
  return { data: categoryIds, error: null };
}

/**
 * Get all topics (without category filter)
 */
export async function getAllTopics(): Promise<{ data: TopicResponse[] | null; error: any }> {
  return getTopics(); // getTopics() already works without categoryId parameter
}

/**
 * Remove a topic from a category (removes the link, not the topic itself)
 */
export async function removeTopicFromCategory(topicId: string, categoryId: string): Promise<{ error: any }> {
  const { error } = await supabase
    .from('topic_categories')
    .delete()
    .eq('topic_id', topicId)
    .eq('category_id', categoryId);

  return { error };
}

/**
 * Link multiple topics to a category (adds to junction table)
 */
export async function linkTopicsToCategory(categoryId: string, topicIds: string[]): Promise<{ error: any }> {
  if (topicIds.length === 0) {
    return { error: null };
  }

  // Remove existing links for these topics to this category (to avoid duplicates)
  await supabase
    .from('topic_categories')
    .delete()
    .eq('category_id', categoryId)
    .in('topic_id', topicIds);

  // Insert new junction entries
  const junctionEntries = topicIds.map(topicId => ({
    topic_id: topicId,
    category_id: categoryId,
  }));

  const { error } = await supabase
    .from('topic_categories')
    .insert(junctionEntries);

  return { error };
}

export async function getAllTopicsWithCounts(): Promise<{ data: (TopicResponse & { question_count: number })[] | null; error: any }> {
  const { data: topics, error: topicsError } = await supabase
    .from('topics')
    .select('*')
    .order('name', { ascending: true });

  if (topicsError || !topics) {
    return { data: null, error: topicsError };
  }

  // Get question counts for each topic
  const topicsWithCounts = await Promise.all(
    topics.map(async (topic) => {
      const { count } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .eq('topic_id', topic.id);

      return {
        ...topic,
        question_count: count ?? 0,
      };
    })
  );

  return { data: topicsWithCounts, error: null };
}

// ============================================================================
// MAPPING FUNCTIONS
// ============================================================================

export function mapSubtypeToApp(subtype: SubtypeResponse, questionCount?: number): Subtype {
  return {
    id: subtype.id,
    sectionType: subtype.section_type as SectionType,
    name: subtype.name,
    slug: subtype.slug,
    description: subtype.description || undefined,
    questionCount: questionCount || 0,
  };
}

export function mapCategoryToApp(category: CategoryResponse, questionCount?: number): Category {
  return {
    id: category.id,
    sectionType: category.section_type as SectionType | undefined,
    subtypeId: category.subtype_id || undefined,
    name: category.name,
    slug: category.slug,
    description: category.description || undefined,
    icon: category.icon || undefined,
    questionCount: questionCount || 0,
  };
}

export function mapTopicToApp(topic: TopicResponse, questionCount?: number): Topic {
  return {
    id: topic.id,
    categoryId: topic.category_id,
    name: topic.name,
    slug: topic.slug,
    description: topic.description || undefined,
    questionCount: questionCount || 0,
  };
}

// ============================================================================
// HIERARCHY FUNCTIONS
// ============================================================================

export interface HierarchyNode {
  type: 'section' | 'subtype' | 'category' | 'topic';
  id: string;
  name: string;
  path: string;
  questionCount: number;
  sectionType?: SectionType;
  subtypeId?: string;
  categoryId?: string;
  children?: HierarchyNode[];
}

export async function getContentHierarchy(): Promise<{ data: HierarchyNode[] | null; error: any }> {
  const sections: SectionType[] = ['dgca_questions', 'books', 'aircrafts', 'airlines'];
  const sectionNames: Record<SectionType, string> = {
    dgca_questions: 'D.G.C.A. Questions',
    books: 'Books',
    aircrafts: 'Aircrafts',
    airlines: 'Airlines',
  };

  const hierarchy: HierarchyNode[] = [];

  for (const sectionType of sections) {
    // Get subtypes for this section
    const { data: subtypes, error: subtypesError } = await getSubtypes(sectionType);
    
    // Get direct categories (not under subtypes)
    const { data: directCategories, error: categoriesError } = await getCategories(sectionType);

    const childrenNodes: HierarchyNode[] = [];

    // Process subtypes
    if (!subtypesError && subtypes) {
      for (const subtype of subtypes) {
        // Get categories under this subtype
        const { data: subtypeCategories, error: subtypeCategoriesError } = await getCategories(undefined, subtype.id);
        
        const categoryNodes: HierarchyNode[] = [];

        if (!subtypeCategoriesError && subtypeCategories) {
          for (const category of subtypeCategories) {
            // Get topics for this category
            const { data: topics, error: topicsError } = await getTopics(category.id);
            
            const topicNodes: HierarchyNode[] = [];

            if (!topicsError && topics) {
              for (const topic of topics) {
                const { count } = await supabase
                  .from('questions')
                  .select('*', { count: 'exact', head: true })
                  .eq('topic_id', topic.id);

                topicNodes.push({
                  type: 'topic',
                  id: topic.id,
                  name: topic.name,
                  path: `${sectionNames[sectionType]} > ${subtype.name} > ${category.name} > ${topic.name}`,
                  questionCount: count || 0,
                  categoryId: category.id,
                  children: undefined,
                });
              }
            }

            const categoryQuestionCount = topicNodes.reduce((sum, topic) => sum + topic.questionCount, 0);

            categoryNodes.push({
              type: 'category',
              id: category.id,
              name: category.name,
              path: `${sectionNames[sectionType]} > ${subtype.name} > ${category.name}`,
              questionCount: categoryQuestionCount,
              categoryId: category.id,
              children: topicNodes,
            });
          }
        }

        const subtypeQuestionCount = categoryNodes.reduce((sum, cat) => sum + cat.questionCount, 0);

        childrenNodes.push({
          type: 'subtype',
          id: subtype.id,
          name: subtype.name,
          path: `${sectionNames[sectionType]} > ${subtype.name}`,
          questionCount: subtypeQuestionCount,
          sectionType,
          subtypeId: subtype.id,
          children: categoryNodes,
        });
      }
    }

    // Process direct categories (not under subtypes)
    if (!categoriesError && directCategories) {
      for (const category of directCategories) {
        // Get topics for this category
        const { data: topics, error: topicsError } = await getTopics(category.id);
        
        const topicNodes: HierarchyNode[] = [];

        if (!topicsError && topics) {
          for (const topic of topics) {
            const { count } = await supabase
              .from('questions')
              .select('*', { count: 'exact', head: true })
              .eq('topic_id', topic.id);

            topicNodes.push({
              type: 'topic',
              id: topic.id,
              name: topic.name,
              path: `${sectionNames[sectionType]} > ${category.name} > ${topic.name}`,
              questionCount: count || 0,
              categoryId: category.id,
              children: undefined,
            });
          }
        }

        const categoryQuestionCount = topicNodes.reduce((sum, topic) => sum + topic.questionCount, 0);

        childrenNodes.push({
          type: 'category',
          id: category.id,
          name: category.name,
          path: `${sectionNames[sectionType]} > ${category.name}`,
          questionCount: categoryQuestionCount,
          sectionType,
          categoryId: category.id,
          children: topicNodes,
        });
      }
    }

    const sectionQuestionCount = childrenNodes.reduce((sum, child) => sum + child.questionCount, 0);

    hierarchy.push({
      type: 'section',
      id: sectionType,
      name: sectionNames[sectionType],
      path: sectionNames[sectionType],
      questionCount: sectionQuestionCount,
      sectionType,
      children: childrenNodes,
    });
  }

  return { data: hierarchy, error: null };
}

// ============================================================================
// DROPDOWN HELPER FUNCTIONS
// ============================================================================

export interface TopicOption {
  id: string;
  name: string;
  path: string;
}

export async function getAllTopicsWithPaths(): Promise<{ data: TopicOption[] | null; error: any }> {
  const { data: hierarchy, error } = await getContentHierarchy();
  
  if (error || !hierarchy) {
    return { data: null, error };
  }

  const topics: TopicOption[] = [];

  function extractTopics(node: HierarchyNode) {
    if (node.type === 'topic') {
      topics.push({
        id: node.id,
        name: node.name,
        path: node.path,
      });
    }
    if (node.children) {
      node.children.forEach(extractTopics);
    }
  }

  hierarchy.forEach(extractTopics);

  return { data: topics, error: null };
}

export interface CategoryWithPath extends CategoryWithCount {
  path: string;
  sectionName: string;
  subtypeName?: string;
}

/**
 * Get all categories with their full hierarchy paths
 */
export async function getCategoriesWithPaths(): Promise<{ data: CategoryWithPath[] | null; error: any }> {
  const sections: SectionType[] = ['dgca_questions', 'books', 'aircrafts', 'airlines'];
  const sectionNames: Record<SectionType, string> = {
    dgca_questions: 'D.G.C.A. Questions',
    books: 'Books',
    aircrafts: 'Aircrafts',
    airlines: 'Airlines',
  };

  // Get all categories
  const { data: allCategories, error: categoriesError } = await getCategoriesWithCounts();
  
  if (categoriesError || !allCategories) {
    return { data: null, error: categoriesError };
  }

  // Get all subtypes to build paths
  const { data: allSubtypes, error: subtypesError } = await getSubtypes();
  
  if (subtypesError) {
    return { data: null, error: subtypesError };
  }

  const subtypesMap = new Map<string, { name: string; sectionType: SectionType }>();
  if (allSubtypes) {
    allSubtypes.forEach(subtype => {
      subtypesMap.set(subtype.id, {
        name: subtype.name,
        sectionType: subtype.section_type as SectionType,
      });
    });
  }

  // Build categories with paths
  const categoriesWithPaths: CategoryWithPath[] = allCategories.map(category => {
    let path = '';
    let sectionName = '';
    let subtypeName: string | undefined;

    if (category.subtype_id) {
      // Category is under a subtype
      const subtype = subtypesMap.get(category.subtype_id);
      if (subtype) {
        sectionName = sectionNames[subtype.sectionType];
        subtypeName = subtype.name;
        path = `${sectionName} > ${subtypeName} > ${category.name}`;
      } else {
        // Fallback if subtype not found
        path = category.name;
      }
    } else if (category.section_type) {
      // Category is directly under a section
      sectionName = sectionNames[category.section_type as SectionType];
      path = `${sectionName} > ${category.name}`;
    } else {
      // Fallback
      path = category.name;
    }

    return {
      ...category,
      path,
      sectionName,
      subtypeName,
    };
  });

  return { data: categoriesWithPaths, error: null };
}
