import { SectionType, Category, Subtype, Topic } from '@/types/questions';
import { getSubtypes, getCategories, getTopics } from './categoryService';
import { supabase } from '@/lib/supabase';

/**
 * Navigation item structure for navbar
 */
export interface NavigationItem {
  id: string;
  name: string;
  url?: string;
  isComingSoon?: boolean;
  children?: NavigationItem[];
}

/**
 * Navigation structure for a section
 */
export interface NavigationStructure {
  sectionType: SectionType;
  items: NavigationItem[];
}

const sectionNames: Record<SectionType, string> = {
  dgca_questions: 'D.G.C.A. Questions',
  books: 'Books',
  aircrafts: 'Aircrafts',
  airlines: 'Airlines',
};

/**
 * Check if a category has questions
 */
async function categoryHasQuestions(categoryId: string): Promise<boolean> {
  // Use junction table to get topics linked to this category
  const { data: topicCategories } = await supabase
    .from('topic_categories')
    .select('topic_id')
    .eq('category_id', categoryId)
    .limit(1);

  if (!topicCategories || topicCategories.length === 0) return false;

  const topicIds = topicCategories.map((tc) => tc.topic_id);
  const { count } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true })
    .in('topic_id', topicIds)
    .limit(1);

  return (count || 0) > 0;
}

/**
 * Check if a topic has questions
 */
async function topicHasQuestions(topicId: string): Promise<boolean> {
  const { count } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true })
    .eq('topic_id', topicId)
    .limit(1);

  return (count || 0) > 0;
}

/**
 * Get navigation URL for a category
 */
function getCategoryUrl(categoryId: string): string {
  return `/category/${categoryId}`;
}

/**
 * Get navigation URL for a topic
 */
function getTopicUrl(topicId: string): string {
  return `/topic/${topicId}`;
}

/**
 * Generate navigation structure for a section from content hierarchy
 */
export async function getNavigationStructure(
  sectionType: SectionType
): Promise<{ data: NavigationStructure | null; error: any }> {
  try {
    // Get subtypes for this section
    const { data: subtypes, error: subtypesError } = await getSubtypes(sectionType);
    
    // Get direct categories (not under subtypes)
    const { data: directCategories, error: categoriesError } = await getCategories(sectionType);

    const navigationItems: NavigationItem[] = [];

    // Process subtypes
    if (!subtypesError && subtypes) {
      for (const subtype of subtypes) {
        // Get categories under this subtype
        const { data: subtypeCategories, error: subtypeCategoriesError } = await getCategories(undefined, subtype.id);
        
        if (subtypeCategoriesError || !subtypeCategories || subtypeCategories.length === 0) {
          // Subtype with no categories - mark as coming soon
          navigationItems.push({
            id: subtype.id,
            name: subtype.name,
            isComingSoon: true,
            children: [],
          });
          continue;
        }

        const categoryItems: NavigationItem[] = [];

        for (const category of subtypeCategories) {
          // Get topics for this category
          const { data: topics, error: topicsError } = await getTopics(category.id);
          
          const hasQuestions = await categoryHasQuestions(category.id);

          if (!topicsError && topics && topics.length > 0) {
            // Category has topics - create nested structure
            const topicItems: NavigationItem[] = await Promise.all(
              topics.map(async (topic) => {
                const hasQuestions = await topicHasQuestions(topic.id);
                return {
                  id: topic.id,
                  name: topic.name,
                  url: getTopicUrl(topic.id),
                  isComingSoon: !hasQuestions,
                };
              })
            );

            categoryItems.push({
              id: category.id,
              name: category.name,
              url: getCategoryUrl(category.id),
              isComingSoon: !hasQuestions,
              children: topicItems,
            });
          } else {
            // Category with no topics
            categoryItems.push({
              id: category.id,
              name: category.name,
              url: getCategoryUrl(category.id),
              isComingSoon: !hasQuestions,
              children: [],
            });
          }
        }

        navigationItems.push({
          id: subtype.id,
          name: subtype.name,
          isComingSoon: categoryItems.every(item => item.isComingSoon),
          children: categoryItems,
        });
      }
    }

    // Process direct categories (not under subtypes)
    if (!categoriesError && directCategories) {
      for (const category of directCategories) {
        // Get topics for this category
        const { data: topics, error: topicsError } = await getTopics(category.id);
        
        const hasQuestions = await categoryHasQuestions(category.id);

        if (!topicsError && topics && topics.length > 0) {
          // Category has topics - create nested structure
          const topicItems: NavigationItem[] = await Promise.all(
            topics.map(async (topic) => {
              const hasQuestions = await topicHasQuestions(topic.id);
              return {
                id: topic.id,
                name: topic.name,
                url: getTopicUrl(topic.id),
                isComingSoon: !hasQuestions,
              };
            })
          );

          navigationItems.push({
            id: category.id,
            name: category.name,
            url: getCategoryUrl(category.id),
            isComingSoon: !hasQuestions,
            children: topicItems,
          });
        } else {
          // Category with no topics
          navigationItems.push({
            id: category.id,
            name: category.name,
            url: getCategoryUrl(category.id),
            isComingSoon: !hasQuestions,
            children: [],
          });
        }
      }
    }

    return {
      data: {
        sectionType,
        items: navigationItems,
      },
      error: null,
    };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Get navigation URL for a navigation item
 * This is a helper function that can be used by components
 */
export function getNavigationItemUrl(item: NavigationItem): string | undefined {
  return item.url;
}

/**
 * Alias for backwards compatibility with existing code
 */
export async function getNavigationWithSubItems(
  sectionType: SectionType
): Promise<{ data: NavigationStructure | null; error: any }> {
  return getNavigationStructure(sectionType);
}
