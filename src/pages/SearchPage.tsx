import { useState, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { ArrowLeft, Search as SearchIcon, Filter } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { QuestionCard } from "@/components/QuestionCard";
import { Input } from "@/components/ui/input";
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
import { sampleQuestions } from "@/data/sampleQuestions";

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  
  const [query, setQuery] = useState(initialQuery);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");

  const filteredQuestions = useMemo(() => {
    let results = sampleQuestions;

    // Text search
    if (query.trim()) {
      const searchTerms = query.toLowerCase().split(" ");
      results = results.filter((q) => {
        const searchText = `${q.question} ${q.options.join(" ")} ${q.explanation}`.toLowerCase();
        return searchTerms.every((term) => searchText.includes(term));
      });
    }

    // Category filter
    if (categoryFilter !== "all") {
      results = results.filter((q) => q.category === categoryFilter);
    }

    // Difficulty filter
    if (difficultyFilter !== "all") {
      results = results.filter((q) => q.difficulty === difficultyFilter);
    }

    return results;
  }, [query, categoryFilter, difficultyFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams(query ? { q: query } : {});
  };

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
            
            <h1 className="text-3xl font-bold mb-6">Search Questions</h1>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="flex gap-2 max-w-2xl">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by keyword, topic, or question text..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit">Search</Button>
            </form>
          </div>
        </section>

        {/* Results */}
        <section className="py-8">
          <div className="container mx-auto px-4">
            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <p className="text-sm text-muted-foreground">
                {filteredQuestions.length} question{filteredQuestions.length !== 1 ? "s" : ""} found
                {query && ` for "${query}"`}
              </p>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.slug}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                  <SelectTrigger className="w-32">
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

            {/* Active Filters */}
            {(categoryFilter !== "all" || difficultyFilter !== "all") && (
              <div className="flex items-center gap-2 mb-6">
                <span className="text-sm text-muted-foreground">Active filters:</span>
                {categoryFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    {categories.find((c) => c.slug === categoryFilter)?.name}
                    <button
                      onClick={() => setCategoryFilter("all")}
                      className="ml-1 hover:text-destructive"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {difficultyFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1 capitalize">
                    {difficultyFilter}
                    <button
                      onClick={() => setDifficultyFilter("all")}
                      className="ml-1 hover:text-destructive"
                    >
                      ×
                    </button>
                  </Badge>
                )}
              </div>
            )}

            {/* Results List */}
            {filteredQuestions.length > 0 ? (
              <div className="space-y-4">
                {filteredQuestions.map((question, index) => (
                  <QuestionCard key={question.id} question={question} index={index} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <SearchIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h2 className="text-xl font-semibold mb-2">No questions found</h2>
                <p className="text-muted-foreground mb-6">
                  Try adjusting your search terms or filters
                </p>
                <Button variant="outline" onClick={() => {
                  setQuery("");
                  setCategoryFilter("all");
                  setDifficultyFilter("all");
                }}>
                  Clear all filters
                </Button>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default SearchPage;
