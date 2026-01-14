import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowLeft, Upload, FileText, Plus } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AdminRoute } from "@/components/AdminRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  createQuestion,
  QuestionInput,
} from "@/services/questionService";
import {
  bulkUploadQuestions,
  parseJsonFile,
  validateBulkUploadData,
  BulkUploadQuestion,
} from "@/services/bulkUploadService";
import { getAllTopicsWithPaths } from "@/services/categoryService";
import { Alert, AlertDescription } from "@/components/ui/alert";

const AdminQuestions = () => {
  const [selectedTopicId, setSelectedTopicId] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get topic from URL param if present
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const topicIdFromUrl = urlParams.get('topicId');
    if (topicIdFromUrl) {
      setSelectedTopicId(topicIdFromUrl);
    }
  }, []);

  // Fetch all topics for dropdown
  const { data: topicsData } = useQuery({
    queryKey: ['allTopicsWithPaths'],
    queryFn: () => getAllTopicsWithPaths(),
  });

  const topics = topicsData?.data || [];

  // Single question form state
  const [singleQuestionForm, setSingleQuestionForm] = useState<Omit<QuestionInput, 'topicId'>>({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    explanation: '',
    difficulty: 'medium',
  });

  // Bulk upload state
  const [uploadMode, setUploadMode] = useState<"file" | "paste">("file");
  const [jsonText, setJsonText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Single question mutation
  const createQuestionMutation = useMutation({
    mutationFn: (input: QuestionInput) => {
      if (!user) throw new Error("No user");
      return createQuestion(input, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contentHierarchy'] });
      queryClient.invalidateQueries({ queryKey: ['navigation'] });
      toast({ title: "Success", description: "Question created successfully" });
      // Reset form
      setSingleQuestionForm({
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

  // Bulk upload mutation
  const uploadMutation = useMutation({
    mutationFn: async ({ questions, topicId }: { questions: BulkUploadQuestion[]; topicId: string }) => {
      if (!user) throw new Error("No user");
      return bulkUploadQuestions(questions, { type: 'topic', id: topicId }, user.id);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["adminQuestions"] });
      queryClient.invalidateQueries({ queryKey: ["navigation"] });
      queryClient.invalidateQueries({ queryKey: ["contentHierarchy"] });
      
      if (result.success) {
        toast({
          title: "Success",
          description: result.message || `Successfully uploaded ${result.inserted} questions`,
        });
        // Reset form
        setJsonText("");
        setSelectedFile(null);
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

  const handleSingleQuestionSubmit = () => {
    if (!selectedTopicId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a topic",
      });
      return;
    }

    if (!singleQuestionForm.question.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Question is required",
      });
      return;
    }

    if (singleQuestionForm.options.filter(o => o.trim()).length < 2) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "At least 2 options are required",
      });
      return;
    }

    createQuestionMutation.mutate({
      ...singleQuestionForm,
      topicId: selectedTopicId,
    });
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

    // Show preview in textarea
    setJsonText(JSON.stringify(data, null, 2));
  };

  const handleBulkUpload = async () => {
    if (!selectedTopicId) {
      toast({
        variant: "destructive",
        title: "Missing destination",
        description: "Please select a topic",
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

    // Validate data
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
    uploadMutation.mutate({
      questions: validation.questions,
      topicId: selectedTopicId,
    });
  };

  const selectedTopic = topics.find(t => t.id === selectedTopicId);

  return (
    <AdminRoute>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 py-8">
          <div className="container mx-auto px-4 max-w-4xl">
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Admin Dashboard
            </Link>

            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Add Questions</h1>
              <p className="text-muted-foreground">
                Add single or multiple questions to a topic
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Topic Selection</CardTitle>
                <CardDescription>
                  Select the topic where you want to add questions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="topic-select">Select Topic *</Label>
                  <Select
                    value={selectedTopicId}
                    onValueChange={setSelectedTopicId}
                  >
                    <SelectTrigger id="topic-select">
                      <SelectValue placeholder="Select a topic..." />
                    </SelectTrigger>
                    <SelectContent>
                      {topics.map((topic) => (
                        <SelectItem key={topic.id} value={topic.id}>
                          {topic.path}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Select the topic where questions will be added. The full path shows: Section → Subtype (if exists) → Category → Topic
                  </p>
                  {selectedTopic && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Selected: <span className="font-medium">{selectedTopic.path}</span>
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {selectedTopicId && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Add Questions</CardTitle>
                  <CardDescription>
                    Choose between adding a single question or uploading multiple questions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="single" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="single">
                        <Plus className="h-4 w-4 mr-2" />
                        Single Question
                      </TabsTrigger>
                      <TabsTrigger value="bulk">
                        <Upload className="h-4 w-4 mr-2" />
                        Bulk Upload
                      </TabsTrigger>
                    </TabsList>

                    {/* Single Question Tab */}
                    <TabsContent value="single" className="space-y-4 mt-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Question *</Label>
                          <Textarea
                            value={singleQuestionForm.question}
                            onChange={(e) => setSingleQuestionForm({ ...singleQuestionForm, question: e.target.value })}
                            placeholder="Enter the question"
                            rows={3}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Options *</Label>
                          {singleQuestionForm.options.map((option, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <span className="font-medium w-6">{String.fromCharCode(65 + idx)}.</span>
                              <Input
                                value={option}
                                onChange={(e) => {
                                  const newOptions = [...singleQuestionForm.options];
                                  newOptions[idx] = e.target.value;
                                  setSingleQuestionForm({ ...singleQuestionForm, options: newOptions });
                                }}
                                placeholder={`Option ${idx + 1}`}
                              />
                              <Button
                                type="button"
                                variant={singleQuestionForm.correctAnswer === idx ? "default" : "outline"}
                                size="sm"
                                onClick={() => setSingleQuestionForm({ ...singleQuestionForm, correctAnswer: idx })}
                              >
                                Correct
                              </Button>
                            </div>
                          ))}
                        </div>

                        <div className="space-y-2">
                          <Label>Explanation</Label>
                          <Textarea
                            value={singleQuestionForm.explanation}
                            onChange={(e) => setSingleQuestionForm({ ...singleQuestionForm, explanation: e.target.value })}
                            placeholder="Explanation for the answer"
                            rows={3}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Difficulty</Label>
                          <Select
                            value={singleQuestionForm.difficulty}
                            onValueChange={(value: 'easy' | 'medium' | 'hard') => 
                              setSingleQuestionForm({ ...singleQuestionForm, difficulty: value })
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

                        <Button
                          onClick={handleSingleQuestionSubmit}
                          disabled={createQuestionMutation.isPending}
                          className="w-full"
                          size="lg"
                        >
                          {createQuestionMutation.isPending ? "Creating..." : "Create Question"}
                        </Button>
                      </div>
                    </TabsContent>

                    {/* Bulk Upload Tab */}
                    <TabsContent value="bulk" className="space-y-4 mt-6">
                      <div className="space-y-4">
                        {/* Upload Mode Toggle */}
                        <div className="flex gap-4">
                          <Button
                            variant={uploadMode === "file" ? "default" : "outline"}
                            onClick={() => setUploadMode("file")}
                            className="flex-1"
                            type="button"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Upload File
                          </Button>
                          <Button
                            variant={uploadMode === "paste" ? "default" : "outline"}
                            onClick={() => setUploadMode("paste")}
                            className="flex-1"
                            type="button"
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Paste JSON
                          </Button>
                        </div>

                        {/* File Upload */}
                        {uploadMode === "file" && (
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
                                <div className="text-sm text-muted-foreground">
                                  Selected: {selectedFile.name}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* JSON Textarea */}
                        <div className="space-y-2">
                          <Label htmlFor="json-input">
                            {uploadMode === "file" ? "Preview/Edit JSON" : "JSON Data"}
                          </Label>
                          <Textarea
                            id="json-input"
                            value={jsonText}
                            onChange={(e) => setJsonText(e.target.value)}
                            placeholder='[\n  {\n    "question": "What is...",\n    "options": ["Option 1", "Option 2", "Option 3", "Option 4"],\n    "correctAnswer": 0,\n    "explanation": "Explanation text",\n    "difficulty": "medium"\n  }\n]'
                            className="font-mono text-sm min-h-[300px]"
                            disabled={isUploading}
                          />
                          <p className="text-xs text-muted-foreground">
                            JSON array of question objects. Each question must have: question, options (array), correctAnswer (0-based index), and optionally: explanation, difficulty
                          </p>
                        </div>

                        {/* Upload Button */}
                        <Button
                          onClick={handleBulkUpload}
                          disabled={isUploading || (!jsonText.trim() && !selectedFile)}
                          className="w-full"
                          size="lg"
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

                        {/* Upload Results */}
                        {uploadMutation.data && (
                          <Alert variant={uploadMutation.data.success ? "default" : "destructive"}>
                            <AlertDescription>
                              <strong>Upload Results:</strong>
                              <br />
                              Successfully uploaded: {uploadMutation.data.inserted} questions
                              {uploadMutation.data.errors.length > 0 && (
                                <>
                                  <br />
                                  Errors: {uploadMutation.data.errors.length}
                                  <details className="mt-2">
                                    <summary className="cursor-pointer">View errors</summary>
                                    <ul className="list-disc list-inside mt-2 space-y-1">
                                      {uploadMutation.data.errors.slice(0, 10).map((error, idx) => (
                                        <li key={idx} className="text-xs">
                                          Question {error.index + 1}: {error.error}
                                        </li>
                                      ))}
                                      {uploadMutation.data.errors.length > 10 && (
                                        <li className="text-xs">
                                          ... and {uploadMutation.data.errors.length - 10} more errors
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
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
        <Footer />
      </div>
    </AdminRoute>
  );
};

export default AdminQuestions;
