import { useState, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Play, Clock, HelpCircle, Settings2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PracticeTest, TestResults } from "@/components/PracticeTest";
import { TestResultsDisplay } from "@/components/TestResultsDisplay";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useAuth } from "@/contexts/AuthContext";
import { saveTestResult } from "@/services/testService";
import { useToast } from "@/hooks/use-toast";
import { getCategoriesWithPaths, CategoryWithPath } from "@/services/categoryService";
import { getQuestionsByCategory, getAllQuestions, mapQuestionToApp } from "@/services/questionService";
import { Question } from "@/types/questions";

const PracticePage = () => {
  const [searchParams] = useSearchParams();
  const preselectedCategory = searchParams.get("category");
  const preselectedSource = searchParams.get("source");
  const { user } = useAuth();
  const { toast } = useToast();

  const [selectedCategory, setSelectedCategory] = useState(preselectedCategory || "all");
  const [questionCount, setQuestionCount] = useState(10);
  const [timeLimit, setTimeLimit] = useState(15);
  const [testStarted, setTestStarted] = useState(false);
  const [testResults, setTestResults] = useState<TestResults | null>(null);
  const [testQuestions, setTestQuestions] = useState<Question[]>([]);
  const [savingResult, setSavingResult] = useState(false);

  // Fetch categories from DB with full hierarchy paths
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['practiceCategories'],
    queryFn: () => getCategoriesWithPaths(),
  });

  const categories = categoriesData?.data || [];

  // Fetch questions based on selected category
  const { data: questionsData, isLoading: questionsLoading } = useQuery({
    queryKey: ['practiceQuestions', selectedCategory],
    queryFn: async () => {
      if (selectedCategory === "all") {
        return getAllQuestions();
      }
      return getQuestionsByCategory(selectedCategory);
    },
    enabled: !categoriesLoading,
  });

  const availableQuestions = useMemo(() => {
    if (!questionsData?.data) return [];
    return questionsData.data.map(mapQuestionToApp);
  }, [questionsData]);

  const maxQuestions = Math.min(availableQuestions.length, 50);

  const handleStartTest = () => {
    if (availableQuestions.length === 0) {
      toast({
        variant: "destructive",
        title: "No questions available",
        description: "There are no questions available for the selected category.",
      });
      return;
    }

    // Shuffle and select questions (max 50)
    const shuffled = [...availableQuestions].sort(() => 0.5 - Math.random());
    const maxQuestionsToSelect = Math.min(questionCount, availableQuestions.length, 50);
    const questions = shuffled.slice(0, maxQuestionsToSelect);
    
    setTestQuestions(questions);
    setTestResults(null);
    setTestStarted(true);
  };

  const handleTestComplete = async (results: TestResults) => {
    setTestResults(results);

    // Save test result if user is logged in
    if (user) {
      setSavingResult(true);
      try {
        const categoryId = selectedCategory === "all" ? null : selectedCategory;
        const { error } = await saveTestResult(user.id, {
          categoryId,
          score: results.score,
          totalQuestions: results.totalQuestions,
          timeTaken: results.timeTaken,
          answers: results.answers,
        });

        if (error) {
          console.error('Error saving test result:', error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to save test result. Your progress was not saved.",
          });
        } else {
          toast({
            title: "Test result saved!",
            description: "Your progress has been saved successfully.",
          });
        }
      } catch (error) {
        console.error('Error saving test result:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to save test result. Your progress was not saved.",
        });
      } finally {
        setSavingResult(false);
      }
    }
  };

  const handleTestExit = async (results: Partial<TestResults>) => {
    // Save incomplete test result if user is logged in
    if (user && results.totalQuestions && results.timeTaken !== undefined) {
      try {
        const categoryId = selectedCategory === "all" ? null : selectedCategory;
        const { error } = await saveTestResult(user.id, {
          categoryId,
          score: results.score || 0,
          totalQuestions: results.totalQuestions,
          timeTaken: results.timeTaken,
          answers: results.answers || [],
        });

        if (error) {
          console.error('Error saving incomplete test result:', error);
          toast({
            variant: "destructive",
            title: "Warning",
            description: "Test exited but progress may not have been saved.",
          });
        } else {
          toast({
            title: "Test exited",
            description: "Your progress has been saved (marked as incomplete).",
          });
        }
      } catch (error) {
        console.error('Error saving incomplete test result:', error);
        toast({
          variant: "destructive",
          title: "Warning",
          description: "Test exited but progress may not have been saved.",
        });
      }
    }

    // Reset test state
    setTestStarted(false);
    setTestQuestions([]);
  };

  const handleRetry = () => {
    setTestResults(null);
    setTestStarted(false);
  };

  const getCategoryName = () => {
    if (selectedCategory === "all") return "Mixed Topics";
    const cat = categories.find((c) => c.id === selectedCategory);
    return cat?.path || cat?.name || "Practice";
  };

  // Show results
  if (testResults) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 py-8">
          <div className="container mx-auto px-4">
            <TestResultsDisplay
              results={testResults}
              questions={testQuestions}
              onRetry={handleRetry}
              isSaving={savingResult}
            />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Show test
  if (testStarted && testQuestions.length > 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 py-8">
          <div className="container mx-auto px-4">
            <PracticeTest
              questions={testQuestions}
              categoryName={getCategoryName()}
              timeLimit={timeLimit}
              onComplete={handleTestComplete}
              onExit={handleTestExit}
            />
          </div>
        </main>
      </div>
    );
  }

  // Show configuration
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>

          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">Practice Test</h1>
              <p className="text-muted-foreground">
                Configure your practice test and challenge yourself
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings2 className="h-5 w-5" />
                  Test Configuration
                </CardTitle>
                <CardDescription>
                  Customize your practice session
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Category Selection */}
                <div className="space-y-2">
                  <Label>Subject Category</Label>
                  {categoriesLoading ? (
                    <div className="text-sm text-muted-foreground">Loading categories...</div>
                  ) : (
                    <>
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories (Mixed)</SelectItem>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.path} ({cat.question_count} questions)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        {questionsLoading ? "Loading questions..." : `${availableQuestions.length} questions available`}
                      </p>
                    </>
                  )}
                </div>

                {/* Question Count */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Number of Questions</Label>
                    <span className="font-medium">{questionCount}</span>
                  </div>
                  <Slider
                    value={[questionCount]}
                    onValueChange={([value]) => setQuestionCount(Math.min(value, 50))}
                    min={5}
                    max={Math.min(maxQuestions, 50)}
                    step={5}
                  />
                  <p className="text-xs text-muted-foreground">
                    Select between 5 and {Math.min(maxQuestions, 50)} questions (maximum 50)
                  </p>
                </div>

                {/* Time Limit */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Time Limit (minutes)</Label>
                    <span className="font-medium">{timeLimit} min</span>
                  </div>
                  <Slider
                    value={[timeLimit]}
                    onValueChange={([value]) => setTimeLimit(value)}
                    min={5}
                    max={60}
                    step={5}
                  />
                  <p className="text-xs text-muted-foreground">
                    Recommended: {Math.ceil(questionCount * 1.5)} minutes for {questionCount} questions
                  </p>
                </div>

                {/* Test Summary */}
                <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="text-center">
                    <HelpCircle className="h-5 w-5 mx-auto mb-1 text-primary" />
                    <p className="text-2xl font-bold">{questionCount}</p>
                    <p className="text-xs text-muted-foreground">Questions</p>
                  </div>
                  <div className="text-center">
                    <Clock className="h-5 w-5 mx-auto mb-1 text-primary" />
                    <p className="text-2xl font-bold">{timeLimit}</p>
                    <p className="text-xs text-muted-foreground">Minutes</p>
                  </div>
                  <div className="text-center">
                    <Play className="h-5 w-5 mx-auto mb-1 text-primary" />
                    <p className="text-2xl font-bold">{Math.floor(timeLimit * 60 / questionCount)}s</p>
                    <p className="text-xs text-muted-foreground">Per Question</p>
                  </div>
                </div>

                <Button 
                  onClick={handleStartTest} 
                  className="w-full gap-2" 
                  size="lg"
                  disabled={availableQuestions.length === 0 || questionsLoading || categoriesLoading}
                >
                  <Play className="h-5 w-5" />
                  {questionsLoading || categoriesLoading ? "Loading..." : "Start Practice Test"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PracticePage;
