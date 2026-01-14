import { CheckCircle, XCircle, Clock, BarChart3, RotateCcw, Home } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Question } from "@/types/questions";
import { TestResults } from "@/components/PracticeTest";
import { cn } from "@/lib/utils";

interface TestResultsDisplayProps {
  results: TestResults;
  questions: Question[];
  onRetry: () => void;
  isSaving?: boolean;
}

export function TestResultsDisplay({ results, questions, onRetry, isSaving = false }: TestResultsDisplayProps) {
  const percentage = Math.round((results.score / results.totalQuestions) * 100);
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getGrade = (pct: number) => {
    if (pct >= 90) return { grade: "A+", color: "text-success", message: "Excellent! You're ready!" };
    if (pct >= 80) return { grade: "A", color: "text-success", message: "Great performance!" };
    if (pct >= 70) return { grade: "B", color: "text-primary", message: "Good job! Keep practicing." };
    if (pct >= 60) return { grade: "C", color: "text-warning", message: "Needs improvement." };
    return { grade: "D", color: "text-destructive", message: "More practice needed." };
  };

  const gradeInfo = getGrade(percentage);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Score Overview */}
      <Card className="text-center">
        <CardHeader>
          <CardTitle className="text-2xl">Test Complete!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center">
            <div className="relative">
              <svg className="w-40 h-40 transform -rotate-90">
                <circle
                  className="text-muted"
                  strokeWidth="10"
                  stroke="currentColor"
                  fill="transparent"
                  r="60"
                  cx="80"
                  cy="80"
                />
                <circle
                  className={cn(
                    percentage >= 70 ? "text-success" : percentage >= 50 ? "text-warning" : "text-destructive"
                  )}
                  strokeWidth="10"
                  strokeDasharray={`${percentage * 3.77} 377`}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  r="60"
                  cx="80"
                  cy="80"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={cn("text-4xl font-bold", gradeInfo.color)}>{percentage}%</span>
                <span className="text-sm text-muted-foreground">Score</span>
              </div>
            </div>
          </div>

          <div>
            <span className={cn("text-5xl font-bold", gradeInfo.color)}>{gradeInfo.grade}</span>
            <p className="mt-2 text-muted-foreground">{gradeInfo.message}</p>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-2 text-success">
                <CheckCircle className="h-5 w-5" />
                <span className="text-2xl font-bold">{results.score}</span>
              </div>
              <p className="text-sm text-muted-foreground">Correct</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-2 text-destructive">
                <XCircle className="h-5 w-5" />
                <span className="text-2xl font-bold">{results.totalQuestions - results.score}</span>
              </div>
              <p className="text-sm text-muted-foreground">Incorrect</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Clock className="h-5 w-5" />
                <span className="text-2xl font-bold">{formatTime(results.timeTaken)}</span>
              </div>
              <p className="text-sm text-muted-foreground">Time Taken</p>
            </div>
          </div>

          <div className="flex justify-center gap-4 pt-4">
            {isSaving && (
              <p className="text-sm text-muted-foreground">Saving your results...</p>
            )}
            <Button onClick={onRetry} variant="outline" className="gap-2" disabled={isSaving}>
              <RotateCcw className="h-4 w-4" />
              Retry Test
            </Button>
            <Link to="/">
              <Button className="gap-2" disabled={isSaving}>
                <Home className="h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Question Review */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Question Review
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {questions.map((question, index) => {
            const answer = results.answers.find((a) => a.questionId === question.id);
            const isCorrect = answer?.isCorrect ?? false;
            const selectedIndex = answer?.selectedAnswer ?? -1;

            return (
              <div
                key={question.id}
                className={cn(
                  "p-4 rounded-lg border",
                  isCorrect ? "border-success/30 bg-success/5" : "border-destructive/30 bg-destructive/5"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                    isCorrect ? "bg-success text-success-foreground" : "bg-destructive text-destructive-foreground"
                  )}>
                    {isCorrect ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <p className="font-medium">
                      <span className="text-muted-foreground">Q{index + 1}:</span> {question.question}
                    </p>
                    
                    <div className="text-sm space-y-1">
                      {selectedIndex >= 0 && (
                        <p className={cn(isCorrect ? "text-success" : "text-destructive")}>
                          Your answer: {String.fromCharCode(65 + selectedIndex)}. {question.options[selectedIndex]}
                        </p>
                      )}
                      {!isCorrect && (
                        <p className="text-success">
                          Correct answer: {String.fromCharCode(65 + question.correctAnswer)}. {question.options[question.correctAnswer]}
                        </p>
                      )}
                    </div>

                    <div className="pt-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                      <strong>Explanation:</strong> {question.explanation}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
