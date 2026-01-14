import { useState } from "react";
import { ChevronDown, ChevronUp, Check, X, Bookmark } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Question } from "@/types/questions";
import { cn } from "@/lib/utils";

interface QuestionCardProps {
  question: Question;
  index?: number;
  showAnswer?: boolean;
}

export function QuestionCard({ question, index, showAnswer = false }: QuestionCardProps) {
  const [isExpanded, setIsExpanded] = useState(showAnswer);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const handleOptionClick = (optionIndex: number) => {
    if (selectedOption === null) {
      setSelectedOption(optionIndex);
      setIsExpanded(true);
    }
  };

  const resetQuestion = () => {
    setSelectedOption(null);
    setIsExpanded(false);
  };

  const difficultyColors = {
    easy: "bg-success/10 text-success border-success/20",
    medium: "bg-warning/10 text-warning border-warning/20",
    hard: "bg-destructive/10 text-destructive border-destructive/20",
  };

  return (
    <Card className="transition-all duration-200 hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            {index !== undefined && (
              <span className="text-sm font-medium text-muted-foreground">
                Question {index + 1}
              </span>
            )}
            <h3 className="font-medium leading-relaxed">{question.question}</h3>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="outline" className={cn("text-xs", difficultyColors[question.difficulty])}>
              {question.difficulty}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsBookmarked(!isBookmarked)}
            >
              <Bookmark className={cn("h-4 w-4", isBookmarked && "fill-primary text-primary")} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Options */}
        <div className="space-y-2">
          {question.options.map((option, optionIndex) => {
            const isSelected = selectedOption === optionIndex;
            const isCorrect = optionIndex === question.correctAnswer;
            const showResult = selectedOption !== null;

            return (
              <button
                key={optionIndex}
                onClick={() => handleOptionClick(optionIndex)}
                disabled={selectedOption !== null}
                className={cn(
                  "w-full text-left p-3 rounded-lg border transition-all duration-200",
                  "hover:bg-muted/50",
                  selectedOption === null && "hover:border-primary/50",
                  showResult && isCorrect && "bg-success/10 border-success text-success-foreground",
                  showResult && isSelected && !isCorrect && "bg-destructive/10 border-destructive",
                  !showResult && "bg-card"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium",
                    showResult && isCorrect && "bg-success text-success-foreground border-success",
                    showResult && isSelected && !isCorrect && "bg-destructive text-destructive-foreground border-destructive"
                  )}>
                    {showResult && isCorrect ? (
                      <Check className="h-3 w-3" />
                    ) : showResult && isSelected && !isCorrect ? (
                      <X className="h-3 w-3" />
                    ) : (
                      String.fromCharCode(65 + optionIndex)
                    )}
                  </span>
                  <span className="text-sm">{option}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Explanation Toggle */}
        {selectedOption !== null && (
          <div className="pt-2 border-t">
            <Button
              variant="ghost"
              className="w-full justify-between"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <span className="text-sm font-medium">
                {selectedOption === question.correctAnswer ? "Correct! " : "Incorrect. "}
                View Explanation
              </span>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>

            {isExpanded && (
              <div className="mt-3 p-4 rounded-lg bg-muted/50 text-sm animate-fade-in">
                <p className="text-muted-foreground">{question.explanation || "No explanation available."}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
