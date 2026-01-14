import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, Edit, Trash2, Search, Upload, FileText, ChevronDown, ChevronUp, X } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AdminRoute } from "@/components/AdminRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  getAllTopicsWithCounts,
  createTopic,
  updateTopic,
  deleteTopic,
  TopicInput,
  TopicResponse,
} from "@/services/categoryService";
import {
  getQuestionsByTopic,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  QuestionInput,
  mapQuestionToApp,
} from "@/services/questionService";
import {
  bulkUploadQuestions,
  parseJsonFile,
  validateBulkUploadData,
  BulkUploadQuestion,
} from "@/services/bulkUploadService";
import { Question } from "@/types/questions";

interface TopicWithCount extends TopicResponse {
  question_count: number;
}

// Topic Card Component
const TopicCard = ({
  topic,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  onAddQuestion,
  onBulkUpload,
  onEditQuestion,
  onDeleteQuestion,
}: {
  topic: TopicWithCount;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddQuestion: () => void;
  onBulkUpload: () => void;
  onEditQuestion: (question: Question, topicId: string) => void;
  onDeleteQuestion: (id: string) => void;
}) => {
  const { data: questionsData, isLoading } = useQuery({
    queryKey: ['questions', topic.id],
    queryFn: () => getQuestionsByTopic(topic.id),
    enabled: isExpanded,
  });
  const questions = questionsData?.data?.map(mapQuestionToApp) || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2">{topic.name}</CardTitle>
            <div className="flex gap-2 items-center flex-wrap">
              <Badge variant="outline">{topic.slug}</Badge>
              <Badge variant="secondary">
                {topic.question_count} question{topic.question_count !== 1 ? 's' : ''}
              </Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          {topic.description || "No description"}
        </p>
        
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleExpand}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-2" />
                Hide Questions
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-2" />
                View Questions
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onAddQuestion}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Question
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onBulkUpload}
          >
            <Upload className="h-4 w-4 mr-2" />
            Bulk Upload
          </Button>
        </div>

        {isExpanded && (
          <div className="mt-4 space-y-3">
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Questions ({questions.length})</h4>
              </div>
              {isLoading ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Loading questions...</p>
              ) : questions.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No questions yet. Add your first question!
                </p>
              ) : (
                <div className="space-y-2">
                  {questions.map((question) => (
                    <Card key={question.id} className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium mb-1">{question.question}</p>
                          <div className="space-y-1">
                            {question.options.map((option, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-xs">
                                <span className={`font-medium w-4 ${idx === question.correctAnswer ? 'text-green-600' : ''}`}>
                                  {String.fromCharCode(65 + idx)}.
                                </span>
                                <span className={idx === question.correctAnswer ? 'text-green-600 font-medium' : 'text-muted-foreground'}>
                                  {option}
                                </span>
                              </div>
                            ))}
                          </div>
                          {question.explanation && (
                            <p className="text-xs text-muted-foreground mt-2">
                              <strong>Explanation:</strong> {question.explanation}
                            </p>
                          )}
                          <div className="flex gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {question.difficulty}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEditQuestion(question, topic.id)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onDeleteQuestion(question.id)}
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const AdminTopics = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<TopicWithCount | null>(null);
  const [deleteTopicId, setDeleteTopicId] = useState<string | null>(null);
  
  // Question management state
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  const [selectedTopicForQuestions, setSelectedTopicForQuestions] = useState<string | null>(null);
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [deleteQuestionId, setDeleteQuestionId] = useState<string | null>(null);
  const [isBulkUploadDialogOpen, setIsBulkUploadDialogOpen] = useState(false);
  const [uploadMode, setUploadMode] = useState<"file" | "paste">("file");
  const [jsonText, setJsonText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: topicsData, isLoading } = useQuery({
    queryKey: ["adminTopics", searchQuery],
    queryFn: async () => {
      const result = await getAllTopicsWithCounts();
      if (!result.data) return { data: [] };
      
      // Filter by search query if provided
      if (searchQuery) {
        const filtered = result.data.filter(
          (topic) =>
            topic.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            topic.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
            topic.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        return { data: filtered };
      }
      
      return result;
    },
  });

  const topics = topicsData?.data || [];

  // Question form state
  const [questionForm, setQuestionForm] = useState<Omit<QuestionInput, 'topicId'>>({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    explanation: '',
    difficulty: 'medium',
  });

  // Fetch questions for expanded topics
  const expandedTopicIds = Array.from(expandedTopics);
  const questionsQueries = expandedTopicIds.map(topicId => ({
    queryKey: ['questions', topicId],
    queryFn: () => getQuestionsByTopic(topicId),
  }));

  const [formData, setFormData] = useState<Omit<TopicInput, 'categoryIds'>>({
    name: "",
    description: "",
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
    });
  };

  const createMutation = useMutation({
    mutationFn: (topic: TopicInput) => createTopic(topic),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminTopics"] });
      queryClient.invalidateQueries({ queryKey: ["topics"] });
      queryClient.invalidateQueries({ queryKey: ["contentHierarchy"] });
      queryClient.invalidateQueries({ queryKey: ["navigation"] });
      toast({
        title: "Success",
        description: "Topic created successfully",
      });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create topic",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, topic }: { id: string; topic: Partial<TopicInput> }) =>
      updateTopic(id, topic),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminTopics"] });
      queryClient.invalidateQueries({ queryKey: ["topics"] });
      queryClient.invalidateQueries({ queryKey: ["contentHierarchy"] });
      queryClient.invalidateQueries({ queryKey: ["navigation"] });
      toast({
        title: "Success",
        description: "Topic updated successfully",
      });
      setIsDialogOpen(false);
      setEditingTopic(null);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update topic",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTopic(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminTopics"] });
      queryClient.invalidateQueries({ queryKey: ["topics"] });
      queryClient.invalidateQueries({ queryKey: ["contentHierarchy"] });
      queryClient.invalidateQueries({ queryKey: ["navigation"] });
      toast({
        title: "Success",
        description: "Topic deleted successfully",
      });
      setDeleteTopicId(null);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete topic",
      });
    },
  });

  const handleEdit = (topic: TopicWithCount) => {
    setEditingTopic(topic);
    setFormData({
      name: topic.name,
      description: topic.description || '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const topicInput: TopicInput = {
      ...formData,
      categoryIds: [], // Topics are created without categories, linked later from Content Manager
    };

    if (editingTopic) {
      updateMutation.mutate({ id: editingTopic.id, topic: topicInput });
    } else {
      createMutation.mutate(topicInput);
    }
  };

  const handleDelete = () => {
    if (deleteTopicId) {
      deleteMutation.mutate(deleteTopicId);
    }
  };

  // Question mutations
  const createQuestionMutation = useMutation({
    mutationFn: (input: QuestionInput) => {
      if (!user) throw new Error("No user");
      return createQuestion(input, user.id);
    },
    onSuccess: () => {
      if (selectedTopicForQuestions) {
        queryClient.invalidateQueries({ queryKey: ['questions', selectedTopicForQuestions] });
      }
      queryClient.invalidateQueries({ queryKey: ["adminTopics"] });
      queryClient.invalidateQueries({ queryKey: ["contentHierarchy"] });
      queryClient.invalidateQueries({ queryKey: ["navigation"] });
      toast({ title: "Success", description: "Question created successfully" });
      setIsQuestionDialogOpen(false);
      setQuestionForm({
        question: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        explanation: '',
        difficulty: 'medium',
      });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message || "Failed to create question" });
    },
  });

  const updateQuestionMutation = useMutation({
    mutationFn: ({ id, question }: { id: string; question: Partial<QuestionInput> }) =>
      updateQuestion(id, question),
    onSuccess: () => {
      if (selectedTopicForQuestions) {
        queryClient.invalidateQueries({ queryKey: ['questions', selectedTopicForQuestions] });
      }
      queryClient.invalidateQueries({ queryKey: ["adminTopics"] });
      queryClient.invalidateQueries({ queryKey: ["contentHierarchy"] });
      queryClient.invalidateQueries({ queryKey: ["navigation"] });
      toast({ title: "Success", description: "Question updated successfully" });
      setIsQuestionDialogOpen(false);
      setEditingQuestion(null);
      setQuestionForm({
        question: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        explanation: '',
        difficulty: 'medium',
      });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message || "Failed to update question" });
    },
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: (id: string) => deleteQuestion(id),
    onSuccess: () => {
      if (selectedTopicForQuestions) {
        queryClient.invalidateQueries({ queryKey: ['questions', selectedTopicForQuestions] });
      }
      queryClient.invalidateQueries({ queryKey: ["adminTopics"] });
      queryClient.invalidateQueries({ queryKey: ["contentHierarchy"] });
      queryClient.invalidateQueries({ queryKey: ["navigation"] });
      toast({ title: "Success", description: "Question deleted successfully" });
      setDeleteQuestionId(null);
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message || "Failed to delete question" });
    },
  });

  const bulkUploadMutation = useMutation({
    mutationFn: async ({ questions, topicId }: { questions: BulkUploadQuestion[]; topicId: string }) => {
      if (!user) throw new Error("No user");
      return bulkUploadQuestions(questions, { type: 'topic', id: topicId }, user.id);
    },
    onSuccess: (result) => {
      if (selectedTopicForQuestions) {
        queryClient.invalidateQueries({ queryKey: ['questions', selectedTopicForQuestions] });
      }
      queryClient.invalidateQueries({ queryKey: ["adminTopics"] });
      queryClient.invalidateQueries({ queryKey: ["navigation"] });
      queryClient.invalidateQueries({ queryKey: ["contentHierarchy"] });
      
      if (result.success) {
        toast({
          title: "Success",
          description: result.message || `Successfully uploaded ${result.inserted} questions`,
        });
        setJsonText("");
        setSelectedFile(null);
        setIsBulkUploadDialogOpen(false);
      } else {
        toast({
          variant: "destructive",
          title: "Upload completed with errors",
          description: result.message || `Uploaded ${result.inserted} questions with ${result.errors.length} errors`,
        });
      }
      setIsUploading(false);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to upload questions",
      });
      setIsUploading(false);
    },
  });

  // Question handlers
  const toggleTopicExpansion = (topicId: string) => {
    setExpandedTopics(prev => {
      const next = new Set(prev);
      if (next.has(topicId)) {
        next.delete(topicId);
      } else {
        next.add(topicId);
      }
      return next;
    });
  };

  const handleAddQuestion = (topicId: string) => {
    setSelectedTopicForQuestions(topicId);
    setEditingQuestion(null);
    setQuestionForm({
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      explanation: '',
      difficulty: 'medium',
    });
    setIsQuestionDialogOpen(true);
  };

  const handleEditQuestion = (question: Question, topicId: string) => {
    setSelectedTopicForQuestions(topicId);
    setEditingQuestion(question);
    setQuestionForm({
      question: question.question,
      options: question.options,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      difficulty: question.difficulty,
    });
    setIsQuestionDialogOpen(true);
  };

  const handleQuestionSubmit = () => {
    if (!selectedTopicForQuestions) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No topic selected",
      });
      return;
    }

    if (!questionForm.question.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Question is required",
      });
      return;
    }

    if (questionForm.options.filter(o => o.trim()).length < 2) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "At least 2 options are required",
      });
      return;
    }

    if (editingQuestion) {
      updateQuestionMutation.mutate({
        id: editingQuestion.id,
        question: {
          ...questionForm,
          topicId: selectedTopicForQuestions,
        },
      });
    } else {
      createQuestionMutation.mutate({
        ...questionForm,
        topicId: selectedTopicForQuestions,
      });
    }
  };

  const handleBulkUpload = (topicId: string) => {
    setSelectedTopicForQuestions(topicId);
    setJsonText("");
    setSelectedFile(null);
    setIsBulkUploadDialogOpen(true);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".json")) {
      toast({
        variant: "destructive",
        title: "Invalid file",
        description: "Please select a JSON file",
      });
      return;
    }

    setSelectedFile(file);
    const { data, error } = await parseJsonFile(file);
    
    if (error || !data) {
      toast({
        variant: "destructive",
        title: "Error reading file",
        description: error || "Failed to parse JSON file",
      });
      setSelectedFile(null);
      return;
    }

    setJsonText(JSON.stringify(data, null, 2));
  };

  const handleBulkUploadSubmit = async () => {
    if (!selectedTopicForQuestions) {
      toast({
        variant: "destructive",
        title: "Missing destination",
        description: "No topic selected",
      });
      return;
    }

    let data: any;
    
    if (uploadMode === "file" && selectedFile) {
      const result = await parseJsonFile(selectedFile);
      if (result.error || !result.data) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to parse JSON file",
        });
        return;
      }
      data = result.data;
    } else {
      if (!jsonText.trim()) {
        toast({
          variant: "destructive",
          title: "Missing data",
          description: "Please provide JSON data",
        });
        return;
      }

      try {
        data = JSON.parse(jsonText);
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Invalid JSON",
          description: error.message || "Failed to parse JSON",
        });
        return;
      }
    }

    const validation = validateBulkUploadData(data);
    if (!validation.valid || !validation.questions) {
      toast({
        variant: "destructive",
        title: "Validation error",
        description: validation.error || "Invalid question data",
      });
      return;
    }

    setIsUploading(true);
    bulkUploadMutation.mutate({
      questions: validation.questions,
      topicId: selectedTopicForQuestions,
    });
  };

  return (
    <AdminRoute>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 py-8">
          <div className="container mx-auto px-4">
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Admin Dashboard
            </Link>

            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold mb-2">Manage Topics</h1>
                <p className="text-muted-foreground">Add, edit, or delete topics</p>
              </div>
              <Button
                onClick={() => {
                  resetForm();
                  setEditingTopic(null);
                  setIsDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Topic
              </Button>
            </div>

            {/* Search */}
            <div className="mb-6">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search topics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Topics List */}
            {isLoading ? (
              <div className="text-center py-12">Loading...</div>
            ) : topics.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground mb-4">No topics found</p>
                  <Button onClick={() => setIsDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Topic
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {topics.map((topic) => {
                  const isExpanded = expandedTopics.has(topic.id);
                  
                  return (
                    <TopicCard
                      key={topic.id}
                      topic={topic}
                      isExpanded={isExpanded}
                      onToggleExpand={() => toggleTopicExpansion(topic.id)}
                      onEdit={() => handleEdit(topic)}
                      onDelete={() => setDeleteTopicId(topic.id)}
                      onAddQuestion={() => handleAddQuestion(topic.id)}
                      onBulkUpload={() => handleBulkUpload(topic.id)}
                      onEditQuestion={handleEditQuestion}
                      onDeleteQuestion={setDeleteQuestionId}
                    />
                  );
                })}
              </div>
            )}

            {/* Add/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingTopic ? "Edit Topic" : "Add New Topic"}
                  </DialogTitle>
                  <DialogDescription>
                    Fill in the topic details below. Categories can be linked later from the Content Manager.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="topic-name">Name *</Label>
                      <Input
                        id="topic-name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        placeholder="Radio Communication"
                      />
                      <p className="text-xs text-muted-foreground">
                        Slug will be auto-generated from the name
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="topic-description">Description</Label>
                      <Textarea
                        id="topic-description"
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({ ...formData, description: e.target.value })
                        }
                        rows={3}
                        placeholder="Brief description of the topic"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsDialogOpen(false);
                        setEditingTopic(null);
                        resetForm();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                      {editingTopic ? "Update" : "Create"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            {/* Delete Topic Confirmation */}
            <AlertDialog
              open={!!deleteTopicId}
              onOpenChange={(open) => !open && setDeleteTopicId(null)}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the topic.
                    All questions in this topic will also be deleted.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Question Dialog */}
            <Dialog open={isQuestionDialogOpen} onOpenChange={(open) => {
              setIsQuestionDialogOpen(open);
              if (!open) {
                setEditingQuestion(null);
                setQuestionForm({
                  question: '',
                  options: ['', '', '', ''],
                  correctAnswer: 0,
                  explanation: '',
                  difficulty: 'medium',
                });
              }
            }}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingQuestion ? 'Edit Question' : 'Add Question'}</DialogTitle>
                  <DialogDescription>
                    {selectedTopicForQuestions && `Topic: ${topics.find(t => t.id === selectedTopicForQuestions)?.name || 'Unknown'}`}
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
                  <Button variant="outline" onClick={() => setIsQuestionDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleQuestionSubmit} disabled={createQuestionMutation.isPending || updateQuestionMutation.isPending}>
                    {editingQuestion ? 'Update' : 'Create'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Bulk Upload Dialog */}
            <Dialog open={isBulkUploadDialogOpen} onOpenChange={(open) => {
              setIsBulkUploadDialogOpen(open);
              if (!open) {
                setJsonText("");
                setSelectedFile(null);
              }
            }}>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Bulk Upload Questions</DialogTitle>
                  <DialogDescription>
                    {selectedTopicForQuestions && `Topic: ${topics.find(t => t.id === selectedTopicForQuestions)?.name || 'Unknown'}`}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <Tabs value={uploadMode} onValueChange={(v) => setUploadMode(v as "file" | "paste")}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="file">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload File
                      </TabsTrigger>
                      <TabsTrigger value="paste">
                        <FileText className="h-4 w-4 mr-2" />
                        Paste JSON
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="file" className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="file-upload">Select JSON File</Label>
                        <div className="flex items-center gap-4">
                          <Input
                            id="file-upload"
                            type="file"
                            accept=".json"
                            onChange={handleFileSelect}
                            className="flex-1"
                            disabled={isUploading}
                          />
                          {selectedFile && (
                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                              <span>{selectedFile.name}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedFile(null);
                                  setJsonText("");
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="paste" className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label>JSON Data</Label>
                        <Textarea
                          value={jsonText}
                          onChange={(e) => setJsonText(e.target.value)}
                          placeholder='[\n  {\n    "question": "What is...",\n    "options": ["Option 1", "Option 2", "Option 3", "Option 4"],\n    "correctAnswer": 0,\n    "explanation": "Explanation text",\n    "difficulty": "medium"\n  }\n]'
                          className="font-mono text-sm min-h-[300px]"
                          disabled={isUploading}
                        />
                      </div>
                    </TabsContent>
                  </Tabs>

                  <div className="space-y-2">
                    <Label>Preview/Edit JSON</Label>
                    <Textarea
                      value={jsonText}
                      onChange={(e) => setJsonText(e.target.value)}
                      className="font-mono text-sm min-h-[200px]"
                      disabled={isUploading}
                    />
                    <p className="text-xs text-muted-foreground">
                      JSON array of question objects. Each question must have: question, options (array), correctAnswer (0-based index), and optionally: explanation, difficulty
                    </p>
                  </div>

                  {bulkUploadMutation.data && (
                    <Alert variant={bulkUploadMutation.data.success ? "default" : "destructive"}>
                      <AlertDescription>
                        <strong>Upload Results:</strong>
                        <br />
                        Successfully uploaded: {bulkUploadMutation.data.inserted} questions
                        {bulkUploadMutation.data.errors.length > 0 && (
                          <>
                            <br />
                            Errors: {bulkUploadMutation.data.errors.length}
                            <details className="mt-2">
                              <summary className="cursor-pointer">View errors</summary>
                              <ul className="list-disc list-inside mt-2 space-y-1">
                                {bulkUploadMutation.data.errors.slice(0, 10).map((error, idx) => (
                                  <li key={idx} className="text-xs">
                                    Question {error.index + 1}: {error.error}
                                  </li>
                                ))}
                                {bulkUploadMutation.data.errors.length > 10 && (
                                  <li className="text-xs">
                                    ... and {bulkUploadMutation.data.errors.length - 10} more errors
                                  </li>
                                )}
                              </ul>
                            </details>
                          </>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsBulkUploadDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleBulkUploadSubmit}
                    disabled={isUploading || (!jsonText.trim() && !selectedFile)}
                  >
                    {isUploading ? (
                      <>Uploading...</>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Questions
                      </>
                    )}
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
                  <AlertDialogAction
                    onClick={() => deleteQuestionId && deleteQuestionMutation.mutate(deleteQuestionId)}
                    className="bg-destructive text-destructive-foreground"
                  >
                    Delete
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

export default AdminTopics;
