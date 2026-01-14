import { useState, useEffect, useCallback, useRef } from "react";
import { Clock, ArrowRight, CheckCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
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
import { Question } from "@/types/questions";
import { cn } from "@/lib/utils";

interface PracticeTestProps {
  questions: Question[];
  categoryName: string;
  timeLimit: number; // in minutes
  onComplete: (results: TestResults) => void;
  onExit?: (results: Partial<TestResults>) => void;
}

export interface TestResults {
  score: number;
  totalQuestions: number;
  timeTaken: number;
  answers: {
    questionId: string;
    selectedAnswer: number;
    isCorrect: boolean;
  }[];
}

export function PracticeTest({ questions, categoryName, timeLimit, onComplete, onExit }: PracticeTestProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [timeRemaining, setTimeRemaining] = useState(timeLimit * 60);
  const [isFinished, setIsFinished] = useState(false);
  const [startTime] = useState(Date.now());
  const [showExitDialog, setShowExitDialog] = useState(false);
  const hasExitedRef = useRef(false);

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  // Handle browser close/refresh warning
  useEffect(() => {
    if (isFinished || hasExitedRef.current) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "Are you sure you want to leave? Your progress will not be saved if you exit the test.";
      return e.returnValue;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isFinished]);

  // Timer
  useEffect(() => {
    if (isFinished || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isFinished, timeRemaining]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSelectAnswer = (optionIndex: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionIndex,
    }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleFinish = useCallback(() => {
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    const answers = questions.map((q) => ({
      questionId: q.id,
      selectedAnswer: selectedAnswers[q.id] ?? -1,
      isCorrect: selectedAnswers[q.id] === q.correctAnswer,
    }));
    const score = answers.filter((a) => a.isCorrect).length;

    setIsFinished(true);
    onComplete({
      score,
      totalQuestions: questions.length,
      timeTaken,
      answers,
    });
  }, [questions, selectedAnswers, startTime, onComplete]);

  const handleExit = () => {
    setShowExitDialog(true);
  };

  const confirmExit = () => {
    hasExitedRef.current = true;
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    const answeredQuestions = Object.keys(selectedAnswers);
    const answers = questions.map((q) => ({
      questionId: q.id,
      selectedAnswer: selectedAnswers[q.id] ?? -1,
      isCorrect: selectedAnswers[q.id] === q.correctAnswer,
    }));
    const score = answers.filter((a) => a.isCorrect).length;

    if (onExit) {
      onExit({
        score,
        totalQuestions: questions.length,
        timeTaken,
        answers,
      });
    }
    
    setShowExitDialog(false);
    setIsFinished(true);
  };

  const answeredCount = Object.keys(selectedAnswers).length;

  if (isFinished) {
    return null; // Parent component handles results display
  }

  return (
    <>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-card rounded-lg border">
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-lg">{categoryName} Practice Test</h2>
                <p className="text-sm text-muted-foreground">
                  Question {currentIndex + 1} of {questions.length}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExit}
                className="text-destructive hover:text-destructive"
              >
                <X className="h-4 w-4 mr-2" />
                Exit Test
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="gap-1">
              <CheckCircle className="h-3 w-3" />
              {answeredCount}/{questions.length}
            </Badge>
            <div className={cn(
              "flex items-center gap-2 font-mono text-lg font-bold",
              timeRemaining < 60 && "text-destructive animate-pulse"
            )}>
              <Clock className="h-5 w-5" />
              {formatTime(timeRemaining)}
            </div>
          </div>
        </div>

      {/* Progress */}
      <Progress value={progress} className="h-2" />

      {/* Question Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="capitalize">
              {currentQuestion.difficulty}
            </Badge>
          </div>
          <CardTitle className="text-xl leading-relaxed pt-2">
            {currentQuestion.question}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {currentQuestion.options.map((option, optionIndex) => {
            const isSelected = selectedAnswers[currentQuestion.id] === optionIndex;

            return (
              <button
                key={optionIndex}
                onClick={() => handleSelectAnswer(optionIndex)}
                className={cn(
                  "w-full text-left p-4 rounded-lg border-2 transition-all duration-200",
                  "hover:border-primary/50 hover:bg-muted/50",
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors",
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground/30"
                  )}>
                    {String.fromCharCode(65 + optionIndex)}
                  </span>
                  <span>{option}</span>
                </div>
              </button>
            );
          })}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentIndex === 0}
        >
          Previous
        </Button>

        <div className="flex gap-2">
          {currentIndex < questions.length - 1 ? (
            <Button onClick={handleNext} className="gap-2">
              Next <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleFinish} variant="default" className="gap-2">
              Finish Test
            </Button>
          )}
        </div>
      </div>

      {/* Question Navigator */}
      <Card>
        <CardContent className="p-4">
          <p className="text-sm font-medium mb-3">Question Navigator</p>
          <div className="flex flex-wrap gap-2">
            {questions.map((q, idx) => {
              const isAnswered = selectedAnswers[q.id] !== undefined;
              const isCurrent = idx === currentIndex;

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={cn(
                    "h-8 w-8 rounded-md text-sm font-medium transition-colors",
                    isCurrent && "ring-2 ring-primary ring-offset-2",
                    isAnswered
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80"
                  )}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Exit Confirmation Dialog */}
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Exit Practice Test?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to exit the test? Your progress will be saved but marked as incomplete.
              You will not be able to resume this test session.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Test</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmExit}
              className="bg-destructive text-destructive-foreground"
            >
              Exit Test
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </>
  );
}
