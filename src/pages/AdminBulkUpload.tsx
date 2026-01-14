import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowLeft, Upload, FileText, Copy } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AdminRoute } from "@/components/AdminRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import {
  bulkUploadQuestions,
  parseJsonFile,
  validateBulkUploadData,
  BulkUploadQuestion,
} from "@/services/bulkUploadService";
import { getAllTopicsWithPaths } from "@/services/categoryService";
import { Alert, AlertDescription } from "@/components/ui/alert";

const AdminBulkUpload = () => {
  const [uploadMode, setUploadMode] = useState<"file" | "paste">("file");
  const [jsonText, setJsonText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState("");
  const [isUploading, setIsUploading] = useState(false);
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
        setSelectedTopicId("");
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

  const handleUpload = async () => {
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
              <h1 className="text-3xl font-bold mb-2">Bulk Upload Questions</h1>
              <p className="text-muted-foreground">
                Upload multiple questions at once using JSON format
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Upload Questions</CardTitle>
                <CardDescription>
                  Choose between file upload or paste JSON directly
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Upload Mode Toggle */}
                <div className="flex gap-4">
                  <Button
                    variant={uploadMode === "file" ? "default" : "outline"}
                    onClick={() => setUploadMode("file")}
                    className="flex-1"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload File
                  </Button>
                  <Button
                    variant={uploadMode === "paste" ? "default" : "outline"}
                    onClick={() => setUploadMode("paste")}
                    className="flex-1"
                  >
                    <Copy className="h-4 w-4 mr-2" />
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

                {/* Topic Selector */}
                <div className="space-y-2">
                  <Label htmlFor="topic-select">Select Topic *</Label>
                  <Select
                    value={selectedTopicId}
                    onValueChange={setSelectedTopicId}
                    disabled={isUploading}
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
                    Select the topic where questions will be uploaded. The full path shows: Section &gt; Category &gt; Subcategory &gt; Topic
                  </p>
                </div>

                {/* Upload Button */}
                <Button
                  onClick={handleUpload}
                  disabled={isUploading || (!jsonText.trim() && !selectedFile) || !selectedTopicId}
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
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    </AdminRoute>
  );
};

export default AdminBulkUpload;
