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
import { categories } from "@/data/categories";
import { getQuestionsByCategory } from "@/data/sampleQuestions";
import { useState } from "react";

const CategoryPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  
  const category = categories.find((c) => c.slug === slug);
  const questions = slug ? getQuestionsByCategory(slug) : [];

  const filteredQuestions = difficultyFilter === "all" 
    ? questions 
    : questions.filter((q) => q.difficulty === difficultyFilter);

  if (!category) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Category Not Found</h1>
          <p className="text-muted-foreground mb-8">The category you're looking for doesn't exist.</p>
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
              Back to Categories
            </Link>
            
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">{category.name}</h1>
                <p className="text-muted-foreground">{category.description}</p>
                <div className="flex items-center gap-2 mt-3">
                  <Badge variant="secondary">{category.questionCount}+ questions</Badge>
                  {category.subcategories && (
                    <Badge variant="outline">
                      {category.subcategories.length} subcategories
                    </Badge>
                  )}
                </div>
              </div>
              
              <Link to={`/practice?category=${slug}`}>
                <Button size="lg" className="gap-2">
                  Start Practice Test
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Subcategories */}
        {category.subcategories && (
          <section className="border-b py-4">
            <div className="container mx-auto px-4">
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                <span className="text-sm font-medium text-muted-foreground shrink-0">Topics:</span>
                {category.subcategories.map((sub) => (
                  <Badge key={sub} variant="outline" className="shrink-0 cursor-pointer hover:bg-muted">
                    {sub}
                  </Badge>
                ))}
              </div>
            </div>
          </section>
        )}

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
                  No questions found for this category yet.
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

export default CategoryPage;
