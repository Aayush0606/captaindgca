import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Filter } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { QuestionCard } from "@/components/QuestionCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { questionSources } from "@/data/categories";
import { getQuestionsBySource } from "@/data/sampleQuestions";
import { useState } from "react";

const SourcePage = () => {
  const { sourceId } = useParams<{ sourceId: string }>();
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  
  const source = questionSources.find((s) => s.id === sourceId);
  const questions = sourceId ? getQuestionsBySource(sourceId) : [];

  const filteredQuestions = difficultyFilter === "all" 
    ? questions 
    : questions.filter((q) => q.difficulty === difficultyFilter);

  if (!source) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Source Not Found</h1>
          <p className="text-muted-foreground mb-8">The question source you're looking for doesn't exist.</p>
          <Link to="/">
            <Button>Back to Home</Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Header */}
        <section className="border-b bg-muted/30 py-8">
          <div className="container mx-auto px-4">
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
            
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">{source.name}</h1>
                <p className="text-muted-foreground">{source.description}</p>
                <div className="flex items-center gap-2 mt-3">
                  <Badge variant="secondary">{questions.length} questions available</Badge>
                </div>
              </div>
              
              <Link to={`/practice?source=${sourceId}`}>
                <Button size="lg" className="gap-2">
                  Start Practice Test
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Questions List */}
        <section className="py-8">
          <div className="container mx-auto px-4">
            {/* Filters */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-muted-foreground">
                Showing {filteredQuestions.length} questions
              </p>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Questions */}
            {filteredQuestions.length > 0 ? (
              <div className="space-y-4">
                {filteredQuestions.map((question, index) => (
                  <QuestionCard key={question.id} question={question} index={index} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-muted-foreground mb-4">
                  No questions found for this source yet.
                </p>
                <p className="text-sm text-muted-foreground">
                  Sample questions will be added soon. Check back later!
                </p>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default SourcePage;
