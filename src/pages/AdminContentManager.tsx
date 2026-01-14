import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowLeft, Search } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AdminRoute } from "@/components/AdminRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  getContentHierarchy,
  createCategory,
  updateCategory,
  deleteCategory,
  createSubtype,
  updateSubtype,
  deleteSubtype,
  removeTopicFromCategory,
  linkTopicsToCategory,
  getCategories,
  getTopics,
  getAllTopics,
  getTopicCategories,
  CategoryInput,
  SubtypeInput,
  HierarchyNode,
  CategoryResponse,
  TopicResponse,
} from "@/services/categoryService";
import {
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getQuestionsByTopic,
  mapQuestionToApp,
  QuestionInput,
} from "@/services/questionService";
import { Question } from "@/types/questions";
import { ContentTreeNode } from "@/components/ContentTreeNode";
import { SectionType } from "@/types/questions";
import { Skeleton } from "@/components/ui/skeleton";

const SECTIONS: { type: SectionType; name: string }[] = [
  { type: 'dgca_questions', name: 'D.G.C.A. Questions' },
  { type: 'books', name: 'Books' },
  { type: 'aircrafts', name: 'Aircrafts' },
  { type: 'airlines', name: 'Airlines' },
];

const iconOptions = [
  "Gauge", "Radio", "TrendingUp", "Cloud", "Wrench", "Compass",
  "Scale", "BookOpen", "Plane", "Award", "GraduationCap"
];

const AdminContentManager = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [viewingQuestionsForTopics, setViewingQuestionsForTopics] = useState<Set<string>>(new Set());
  const [editingNode, setEditingNode] = useState<HierarchyNode | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [deleteNode, setDeleteNode] = useState<HierarchyNode | null>(null);
  const [deleteQuestionId, setDeleteQuestionId] = useState<string | null>(null);
  
  // Dialog states
  const [isSubtypeDialogOpen, setIsSubtypeDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isLinkTopicsDialogOpen, setIsLinkTopicsDialogOpen] = useState(false);
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  
  // Context for dialogs (parent IDs)
  const [subtypeDialogContext, setSubtypeDialogContext] = useState<{ sectionType: SectionType } | null>(null);
  const [categoryDialogContext, setCategoryDialogContext] = useState<{ sectionType?: SectionType; subtypeId?: string } | null>(null);
  const [linkTopicsDialogContext, setLinkTopicsDialogContext] = useState<{ categoryId: string; categoryName: string } | null>(null);
  const [questionDialogContext, setQuestionDialogContext] = useState<{ topicId: string; topicName: string } | null>(null);

  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: hierarchyData, isLoading } = useQuery({
    queryKey: ['contentHierarchy'],
    queryFn: () => getContentHierarchy(),
  });

  // Fetch all categories for category operations
  const { data: categoriesData } = useQuery({
    queryKey: ['allCategories'],
    queryFn: () => getCategories(),
  });

  // Fetch all topics for link topics dialog
  const { data: allTopicsData } = useQuery({
    queryKey: ['allTopics'],
    queryFn: () => getAllTopics(),
    enabled: isLinkTopicsDialogOpen,
  });

  const allCategories: CategoryResponse[] = categoriesData?.data || [];
  const allTopics: TopicResponse[] = allTopicsData?.data || [];
  const hierarchy = hierarchyData?.data || [];
  
  // Selected topic IDs for link dialog
  const [selectedTopicIds, setSelectedTopicIds] = useState<Set<string>>(new Set());

  // Form states
  const [subtypeForm, setSubtypeForm] = useState<Omit<SubtypeInput, 'sectionType'>>({
    name: '',
    description: '',
  });

  const [categoryForm, setCategoryForm] = useState<Omit<CategoryInput, 'sectionType' | 'subtypeId'>>({
    name: '',
    description: '',
    icon: 'Gauge',
  });

  const [questionForm, setQuestionForm] = useState<Omit<QuestionInput, 'topicId'>>({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    explanation: '',
    difficulty: 'medium',
  });

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  // Subtype mutations
  const createSubtypeMutation = useMutation({
    mutationFn: (input: SubtypeInput) => createSubtype(input),
    onSuccess: (data, variables) => {
      // Expand the section that contains this subtype
      if (subtypeDialogContext?.sectionType) {
        setExpandedNodes(prev => new Set(prev).add(subtypeDialogContext.sectionType));
      }
      queryClient.invalidateQueries({ queryKey: ['contentHierarchy'] });
      queryClient.invalidateQueries({ queryKey: ['navigation'] });
      toast({ title: "Success", description: "Subtype created successfully" });
      setIsSubtypeDialogOpen(false);
      setSubtypeForm({ name: '', description: '' });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message || "Failed to create subtype" });
    },
  });

  const updateSubtypeMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<SubtypeInput> }) => updateSubtype(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contentHierarchy'] });
      queryClient.invalidateQueries({ queryKey: ['navigation'] });
      toast({ title: "Success", description: "Subtype updated successfully" });
      setIsSubtypeDialogOpen(false);
      setEditingNode(null);
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message || "Failed to update subtype" });
    },
  });

  const deleteSubtypeMutation = useMutation({
    mutationFn: (id: string) => deleteSubtype(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contentHierarchy'] });
      queryClient.invalidateQueries({ queryKey: ['navigation'] });
      toast({ title: "Success", description: "Subtype deleted successfully" });
      setDeleteNode(null);
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message || "Failed to delete subtype" });
    },
  });

  // Category mutations
  const createCategoryMutation = useMutation({
    mutationFn: (input: CategoryInput) => createCategory(input),
    onSuccess: (data, variables) => {
      // Expand parent nodes: section and subtype (if category is under subtype)
      if (categoryDialogContext) {
        if (categoryDialogContext.subtypeId) {
          // Category is under subtype - expand both section and subtype
          // Find section type for this subtype
          const subtype = hierarchy
            .flatMap(s => s.children || [])
            .find(st => st.type === 'subtype' && st.id === categoryDialogContext.subtypeId);
          if (subtype?.sectionType) {
            setExpandedNodes(prev => {
              const next = new Set(prev);
              next.add(subtype.sectionType!);
              next.add(categoryDialogContext!.subtypeId!);
              return next;
            });
          } else {
            setExpandedNodes(prev => new Set(prev).add(categoryDialogContext!.subtypeId!));
          }
        } else if (categoryDialogContext.sectionType) {
          // Category is directly under section - expand section
          setExpandedNodes(prev => new Set(prev).add(categoryDialogContext!.sectionType!));
        }
      }
      queryClient.invalidateQueries({ queryKey: ['contentHierarchy'] });
      queryClient.invalidateQueries({ queryKey: ['navigation'] });
      toast({ title: "Success", description: "Category created successfully" });
      setIsCategoryDialogOpen(false);
      setCategoryForm({ name: '', description: '', icon: 'Gauge' });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message || "Failed to create category" });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CategoryInput> }) => updateCategory(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contentHierarchy'] });
      queryClient.invalidateQueries({ queryKey: ['navigation'] });
      toast({ title: "Success", description: "Category updated successfully" });
      setIsCategoryDialogOpen(false);
      setEditingNode(null);
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message || "Failed to update category" });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contentHierarchy'] });
      queryClient.invalidateQueries({ queryKey: ['navigation'] });
      toast({ title: "Success", description: "Category deleted successfully" });
      setDeleteNode(null);
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message || "Failed to delete category" });
    },
  });

  // Link topics mutation
  const linkTopicsMutation = useMutation({
    mutationFn: ({ categoryId, topicIds }: { categoryId: string; topicIds: string[] }) => 
      linkTopicsToCategory(categoryId, topicIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contentHierarchy'] });
      queryClient.invalidateQueries({ queryKey: ['navigation'] });
      toast({ title: "Success", description: "Topics linked successfully" });
      setIsLinkTopicsDialogOpen(false);
      setSelectedTopicIds(new Set());
      setLinkTopicsDialogContext(null);
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message || "Failed to link topics" });
    },
  });

  // Remove topic from category mutation
  const removeTopicFromCategoryMutation = useMutation({
    mutationFn: ({ topicId, categoryId }: { topicId: string; categoryId: string }) => 
      removeTopicFromCategory(topicId, categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contentHierarchy'] });
      queryClient.invalidateQueries({ queryKey: ['navigation'] });
      toast({ title: "Success", description: "Topic removed from category" });
      setDeleteNode(null);
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message || "Failed to remove topic from category" });
    },
  });

  // Fetch questions for all viewing topics
  // We'll use a map to store questions for each topic
  const [questionsByTopic, setQuestionsByTopic] = useState<Map<string, Question[]>>(new Map());

  // Question mutations
  const createQuestionMutation = useMutation({
    mutationFn: (input: QuestionInput) => {
      if (!user) throw new Error("No user");
      return createQuestion(input, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contentHierarchy'] });
      queryClient.invalidateQueries({ queryKey: ['navigation'] });
      // Refresh questions for all viewing topics
      viewingQuestionsForTopics.forEach(topicId => {
        getQuestionsByTopic(topicId).then(result => {
          if (result.data) {
            const mappedQuestions = result.data.map(mapQuestionToApp);
            setQuestionsByTopic(prevMap => new Map(prevMap).set(topicId, mappedQuestions));
          }
        });
      });
      toast({ title: "Success", description: "Question created successfully" });
      setIsQuestionDialogOpen(false);
      setQuestionForm({ question: '', options: ['', '', '', ''], correctAnswer: 0, explanation: '', difficulty: 'medium' });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message || "Failed to create question" });
    },
  });

  const updateQuestionMutation = useMutation({
    mutationFn: ({ id, question }: { id: string; question: Partial<QuestionInput> }) => updateQuestion(id, question),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contentHierarchy'] });
      queryClient.invalidateQueries({ queryKey: ['navigation'] });
      // Refresh questions for all viewing topics
      viewingQuestionsForTopics.forEach(topicId => {
        getQuestionsByTopic(topicId).then(result => {
          if (result.data) {
            const mappedQuestions = result.data.map(mapQuestionToApp);
            setQuestionsByTopic(prevMap => new Map(prevMap).set(topicId, mappedQuestions));
          }
        });
      });
      toast({ title: "Success", description: "Question updated successfully" });
      setIsQuestionDialogOpen(false);
      setEditingQuestion(null);
      setQuestionForm({ question: '', options: ['', '', '', ''], correctAnswer: 0, explanation: '', difficulty: 'medium' });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message || "Failed to update question" });
    },
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: (id: string) => deleteQuestion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contentHierarchy'] });
      queryClient.invalidateQueries({ queryKey: ['navigation'] });
      // Refresh questions for all viewing topics
      viewingQuestionsForTopics.forEach(topicId => {
        getQuestionsByTopic(topicId).then(result => {
          if (result.data) {
            const mappedQuestions = result.data.map(mapQuestionToApp);
            setQuestionsByTopic(prevMap => new Map(prevMap).set(topicId, mappedQuestions));
          }
        });
      });
      toast({ title: "Success", description: "Question deleted successfully" });
      setDeleteQuestionId(null);
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message || "Failed to delete question" });
    },
  });

  // Handlers
  const handleAddSubtype = (sectionType: string) => {
    setSubtypeDialogContext({ sectionType: sectionType as SectionType });
    setSubtypeForm({ name: '', description: '' });
    setIsSubtypeDialogOpen(true);
  };

  const handleAddCategory = (sectionTypeOrSubtypeId: string, isSubtype: boolean = false) => {
    if (isSubtype) {
      setCategoryDialogContext({ subtypeId: sectionTypeOrSubtypeId });
    } else {
      setCategoryDialogContext({ sectionType: sectionTypeOrSubtypeId as SectionType });
    }
    setCategoryForm({ name: '', description: '', icon: 'Gauge' });
    setIsCategoryDialogOpen(true);
  };

  const handleLinkTopics = (categoryId: string) => {
    // Find category in hierarchy to get name
    const findCategory = (nodes: HierarchyNode[]): HierarchyNode | null => {
      for (const node of nodes) {
        if (node.type === 'category' && node.id === categoryId) {
          return node;
        }
        if (node.children) {
          const found = findCategory(node.children);
          if (found) return found;
        }
      }
      return null;
    };

    const category = findCategory(hierarchy);
    setLinkTopicsDialogContext({ categoryId, categoryName: category?.name || '' });
    
    // Load currently linked topics for this category
    getTopics(categoryId).then(({ data: linkedTopics }) => {
      const linkedTopicIds = new Set(linkedTopics?.map(t => t.id) || []);
      setSelectedTopicIds(linkedTopicIds);
      setIsLinkTopicsDialogOpen(true);
    });
  };

  const handleAddQuestion = (topicId: string) => {
    // Find topic in hierarchy to get name
    const findTopic = (nodes: HierarchyNode[]): HierarchyNode | null => {
      for (const node of nodes) {
        if (node.type === 'topic' && node.id === topicId) {
          return node;
        }
        if (node.children) {
          const found = findTopic(node.children);
          if (found) return found;
        }
      }
      return null;
    };

    const topic = findTopic(hierarchy);
    setQuestionDialogContext({ topicId, topicName: topic?.name || '' });
    setQuestionForm({ question: '', options: ['', '', '', ''], correctAnswer: 0, explanation: '', difficulty: 'medium' });
    setIsQuestionDialogOpen(true);
  };

  const handleViewQuestions = async (topicId: string) => {
    setViewingQuestionsForTopics(prev => {
      const next = new Set(prev);
      if (next.has(topicId)) {
        next.delete(topicId);
        // Remove questions from map when hiding
        setQuestionsByTopic(prevMap => {
          const nextMap = new Map(prevMap);
          nextMap.delete(topicId);
          return nextMap;
        });
      } else {
        next.add(topicId);
        // Fetch questions for this topic
        getQuestionsByTopic(topicId).then(result => {
          if (result.data) {
            const mappedQuestions = result.data.map(mapQuestionToApp);
            setQuestionsByTopic(prevMap => new Map(prevMap).set(topicId, mappedQuestions));
          }
        });
      }
      return next;
    });
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    // Find topic in hierarchy to get name
    const findTopic = (nodes: HierarchyNode[]): HierarchyNode | null => {
      for (const node of nodes) {
        if (node.type === 'topic' && node.id === question.topicId) {
          return node;
        }
        if (node.children) {
          const found = findTopic(node.children);
          if (found) return found;
        }
      }
      return null;
    };
    const topic = findTopic(hierarchy);
    setQuestionDialogContext({ topicId: question.topicId, topicName: topic?.name || '' });
    setQuestionForm({
      question: question.question,
      options: question.options,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      difficulty: question.difficulty,
    });
    setIsQuestionDialogOpen(true);
  };

  const handleBulkUpload = (topicId: string) => {
    window.location.href = `/admin/bulk-upload?topicId=${topicId}`;
  };

  const handleEdit = (node: HierarchyNode) => {
    setEditingNode(node);
    
    if (node.type === 'subtype') {
      setSubtypeDialogContext({ sectionType: node.sectionType || 'dgca_questions' });
      setSubtypeForm({ name: node.name, description: '' });
      setIsSubtypeDialogOpen(true);
    } else if (node.type === 'category') {
      if (node.subtypeId) {
        setCategoryDialogContext({ subtypeId: node.subtypeId });
      } else {
        setCategoryDialogContext({ sectionType: node.sectionType || 'dgca_questions' });
      }
      setCategoryForm({ name: node.name, description: '', icon: 'Gauge' });
      setIsCategoryDialogOpen(true);
    }
    // Topics are edited from AdminTopics page, not from Content Manager
  };

  const handleDelete = (node: HierarchyNode) => {
    setDeleteNode(node);
  };

  const confirmDelete = () => {
    if (!deleteNode) return;
    
    if (deleteNode.type === 'subtype') {
      deleteSubtypeMutation.mutate(deleteNode.id);
    } else if (deleteNode.type === 'category') {
      deleteCategoryMutation.mutate(deleteNode.id);
    } else if (deleteNode.type === 'topic' && deleteNode.categoryId) {
      // Remove topic from category (not delete the topic itself)
      removeTopicFromCategoryMutation.mutate({ 
        topicId: deleteNode.id, 
        categoryId: deleteNode.categoryId 
      });
    }
  };

  const handleSubtypeSubmit = () => {
    if (!subtypeDialogContext) return;
    if (!subtypeForm.name.trim()) {
      toast({ variant: "destructive", title: "Error", description: "Name is required" });
      return;
    }

    if (editingNode && editingNode.type === 'subtype') {
      updateSubtypeMutation.mutate({
        id: editingNode.id,
        input: { ...subtypeForm, sectionType: subtypeDialogContext.sectionType },
      });
    } else {
      createSubtypeMutation.mutate({
        ...subtypeForm,
        sectionType: subtypeDialogContext.sectionType,
      });
    }
  };

  const handleCategorySubmit = () => {
    if (!categoryDialogContext) return;
    if (!categoryForm.name.trim()) {
      toast({ variant: "destructive", title: "Error", description: "Name is required" });
      return;
    }

    const input: CategoryInput = {
      ...categoryForm,
      sectionType: categoryDialogContext.sectionType,
      subtypeId: categoryDialogContext.subtypeId,
    };

    if (editingNode && editingNode.type === 'category') {
      updateCategoryMutation.mutate({
        id: editingNode.id,
        input,
      });
    } else {
      createCategoryMutation.mutate(input);
    }
  };

  const handleLinkTopicsSubmit = () => {
    if (!linkTopicsDialogContext) return;
    
    const topicIdsArray = Array.from(selectedTopicIds);
    linkTopicsMutation.mutate({
      categoryId: linkTopicsDialogContext.categoryId,
      topicIds: topicIdsArray,
    });
  };

  const handleQuestionSubmit = () => {
    if (!questionDialogContext) return;
    if (!questionForm.question.trim()) {
      toast({ variant: "destructive", title: "Error", description: "Question is required" });
      return;
    }
    if (questionForm.options.filter(o => o.trim()).length < 2) {
      toast({ variant: "destructive", title: "Error", description: "At least 2 options are required" });
      return;
    }

    if (editingQuestion) {
      updateQuestionMutation.mutate({
        id: editingQuestion.id,
        question: {
          ...questionForm,
          topicId: questionDialogContext.topicId,
        },
      });
    } else {
      createQuestionMutation.mutate({
        ...questionForm,
        topicId: questionDialogContext.topicId,
      });
    }
  };

  // Filter hierarchy based on search
  const filteredHierarchy = searchQuery
    ? hierarchy.map(section => {
        const filterNode = (node: HierarchyNode): HierarchyNode | null => {
          if (node.name.toLowerCase().includes(searchQuery.toLowerCase())) {
            return node;
          }
          if (node.children) {
            const filteredChildren = node.children
              .map(child => filterNode(child))
              .filter((child): child is HierarchyNode => child !== null);
            if (filteredChildren.length > 0) {
              return { ...node, children: filteredChildren };
            }
          }
          return null;
        };
        const filtered = filterNode(section);
        return filtered;
      }).filter((section): section is HierarchyNode => section !== null)
    : hierarchy;

  return (
    <AdminRoute>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 py-8">
          <div className="container mx-auto px-4 max-w-7xl">
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Admin Dashboard
            </Link>

            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Content Manager</h1>
              <p className="text-muted-foreground">
                Manage your content hierarchy: Sections → Subtypes (optional) → Categories → Topics → Questions
              </p>
            </div>

            {/* Search */}
            <div className="mb-6">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Tree View */}
            {isLoading ? (
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : filteredHierarchy.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No content found. Start by adding a subtype or category to a section.
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-1">
                    {filteredHierarchy.map((section) => (
                      <ContentTreeNode
                        key={section.id}
                        node={section}
                        isExpanded={expandedNodes.has(section.id)}
                        onToggleExpand={toggleNode}
                        onAddSubtype={handleAddSubtype}
                        onAddCategory={handleAddCategory}
                        onLinkTopics={handleLinkTopics}
                        onAddQuestion={handleAddQuestion}
                        onBulkUpload={handleBulkUpload}
                        onViewQuestions={handleViewQuestions}
                        viewingQuestionsForTopics={viewingQuestionsForTopics}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        expandedNodes={expandedNodes}
                        questionsByTopic={questionsByTopic}
                        onEditQuestion={handleEditQuestion}
                        onDeleteQuestion={setDeleteQuestionId}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Subtype Dialog */}
            <Dialog open={isSubtypeDialogOpen} onOpenChange={setIsSubtypeDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingNode ? 'Edit Subtype' : 'Create Subtype'}</DialogTitle>
                  <DialogDescription>
                    {subtypeDialogContext && `Section: ${SECTIONS.find(s => s.type === subtypeDialogContext.sectionType)?.name}`}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Name *</Label>
                    <Input
                      value={subtypeForm.name}
                      onChange={(e) => setSubtypeForm({ ...subtypeForm, name: e.target.value })}
                      placeholder="Subtype name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={subtypeForm.description}
                      onChange={(e) => setSubtypeForm({ ...subtypeForm, description: e.target.value })}
                      placeholder="Subtype description"
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => { setIsSubtypeDialogOpen(false); setEditingNode(null); }}>
                    Cancel
                  </Button>
                  <Button onClick={handleSubtypeSubmit}>
                    {editingNode ? 'Update' : 'Create'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Category Dialog */}
            <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingNode ? 'Edit Category' : 'Create Category'}</DialogTitle>
                  <DialogDescription>
                    {categoryDialogContext?.sectionType && `Section: ${SECTIONS.find(s => s.type === categoryDialogContext.sectionType)?.name}`}
                    {categoryDialogContext?.subtypeId && `Subtype: (selected)`}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Name *</Label>
                    <Input
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                      placeholder="Category name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={categoryForm.description}
                      onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                      placeholder="Category description"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Icon</Label>
                    <Select
                      value={categoryForm.icon}
                      onValueChange={(value) => setCategoryForm({ ...categoryForm, icon: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {iconOptions.map((icon) => (
                          <SelectItem key={icon} value={icon}>
                            {icon}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => { setIsCategoryDialogOpen(false); setEditingNode(null); }}>
                    Cancel
                  </Button>
                  <Button onClick={handleCategorySubmit}>
                    {editingNode ? 'Update' : 'Create'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Link Topics Dialog */}
            <Dialog open={isLinkTopicsDialogOpen} onOpenChange={(open) => {
              setIsLinkTopicsDialogOpen(open);
              if (!open) {
                setSelectedTopicIds(new Set());
                setLinkTopicsDialogContext(null);
              }
            }}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Link Topics to Category</DialogTitle>
                  <DialogDescription>
                    {linkTopicsDialogContext && `Category: ${linkTopicsDialogContext.categoryName}`}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Select Topics</Label>
                    <div className="border rounded-md p-4 max-h-60 overflow-y-auto space-y-2">
                      {allTopics.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Loading topics...</p>
                      ) : (
                        allTopics.map((topic) => (
                          <div key={topic.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`topic-${topic.id}`}
                              checked={selectedTopicIds.has(topic.id)}
                              onCheckedChange={(checked) => {
                                setSelectedTopicIds(prev => {
                                  const next = new Set(prev);
                                  if (checked) {
                                    next.add(topic.id);
                                  } else {
                                    next.delete(topic.id);
                                  }
                                  return next;
                                });
                              }}
                            />
                            <label
                              htmlFor={`topic-${topic.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                            >
                              {topic.name}
                            </label>
                          </div>
                        ))
                      )}
                    </div>
                    {selectedTopicIds.size > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {selectedTopicIds.size} topic{selectedTopicIds.size !== 1 ? 's' : ''} selected
                      </p>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => {
                    setIsLinkTopicsDialogOpen(false);
                    setSelectedTopicIds(new Set());
                    setLinkTopicsDialogContext(null);
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={handleLinkTopicsSubmit} disabled={linkTopicsMutation.isPending}>
                    Link Topics
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Question Dialog */}
            <Dialog open={isQuestionDialogOpen} onOpenChange={(open) => {
              setIsQuestionDialogOpen(open);
              if (!open) {
                setEditingQuestion(null);
                setQuestionForm({ question: '', options: ['', '', '', ''], correctAnswer: 0, explanation: '', difficulty: 'medium' });
              }
            }}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingQuestion ? 'Edit Question' : 'Create Question'}</DialogTitle>
                  <DialogDescription>
                    {questionDialogContext && `Topic: ${questionDialogContext.topicName}`}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Question *</Label>
                    <Textarea
                      value={questionForm.question}
                      onChange={(e) => setQuestionForm({ ...questionForm, question: e.target.value })}
                      placeholder="Enter the question"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Options *</Label>
                    {questionForm.options.map((option, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="font-medium w-6">{String.fromCharCode(65 + idx)}.</span>
                        <Input
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...questionForm.options];
                            newOptions[idx] = e.target.value;
                            setQuestionForm({ ...questionForm, options: newOptions });
                          }}
                          placeholder={`Option ${idx + 1}`}
                        />
                        <Button
                          type="button"
                          variant={questionForm.correctAnswer === idx ? "default" : "outline"}
                          size="sm"
                          onClick={() => setQuestionForm({ ...questionForm, correctAnswer: idx })}
                        >
                          Correct
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <Label>Explanation</Label>
                    <Textarea
                      value={questionForm.explanation}
                      onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                      placeholder="Explanation for the answer"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Difficulty</Label>
                    <Select
                      value={questionForm.difficulty}
                      onValueChange={(value: 'easy' | 'medium' | 'hard') => 
                        setQuestionForm({ ...questionForm, difficulty: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => {
                    setIsQuestionDialogOpen(false);
                    setEditingQuestion(null);
                    setQuestionForm({ question: '', options: ['', '', '', ''], correctAnswer: 0, explanation: '', difficulty: 'medium' });
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={handleQuestionSubmit} disabled={createQuestionMutation.isPending || updateQuestionMutation.isPending}>
                    {editingQuestion ? 'Update' : 'Create'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Delete Question Confirmation */}
            <AlertDialog open={!!deleteQuestionId} onOpenChange={(open) => !open && setDeleteQuestionId(null)}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the question.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deleteQuestionId && deleteQuestionMutation.mutate(deleteQuestionId)} className="bg-destructive text-destructive-foreground">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Delete Confirmation */}
            <AlertDialog open={!!deleteNode} onOpenChange={(open) => !open && setDeleteNode(null)}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    {deleteNode?.type === 'topic' 
                      ? `This will remove "${deleteNode?.name}" from this category. The topic itself will not be deleted.`
                      : `This action cannot be undone. This will permanently delete "${deleteNode?.name}" and all its children.`
                    }
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
                    {deleteNode?.type === 'topic' ? 'Remove' : 'Delete'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </main>
        <Footer />
      </div>
    </AdminRoute>
  );
};

export default AdminContentManager;
