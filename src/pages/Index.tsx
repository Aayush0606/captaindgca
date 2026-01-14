import { Link } from "react-router-dom";
import { Search, BookOpen, GraduationCap, Award, Plane, ArrowRight } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SearchBar } from "@/components/SearchBar";
import { StatCard } from "@/components/StatCard";
import { CaptainReezzOverlay } from "@/components/CaptainReezzOverlay";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { getAllTopicsWithCounts, mapTopicToApp } from "@/services/categoryService";

const Index = () => {
  const { data: topicsData, isLoading } = useQuery({
    queryKey: ['allTopicsWithCounts'],
    queryFn: () => getAllTopicsWithCounts(),
  });

  const topics = (topicsData?.data || [])
    .map((topic) => mapTopicToApp(topic, topic.question_count));

  return (
    <div className="min-h-screen flex flex-col relative">
      <CaptainReezzOverlay />
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden gradient-hero py-20 lg:py-32">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMjIiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
          
          <div className="container mx-auto px-4 relative">
            <div className="text-center max-w-4xl mx-auto space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <Plane className="h-4 w-4" />
                DGCA Exam Preparation Platform
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-balance">
                Master Your{" "}
                <span className="text-primary">DGCA Pilot</span>{" "}
                Examinations
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                Comprehensive question bank with 2000+ questions from ATPL, Indigo, Oxford, 
                and previous DGCA papers. Practice, learn, and track your progress.
              </p>

              <SearchBar variant="hero" placeholder="Search questions by topic, keyword, or category..." />

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Link to="/practice">
                  <Button size="lg" className="gap-2 text-lg px-8">
                    Start Practice Test <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 border-b">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                title="Questions"
                value="2,000+"
                description="Comprehensive database"
                icon={BookOpen}
              />
              <StatCard
                title="Categories"
                value="10"
                description="All DGCA subjects"
                icon={GraduationCap}
              />
              <StatCard
                title="Sources"
                value="5"
                description="Trusted question banks"
                icon={Award}
              />
              <StatCard
                title="Success Rate"
                value="94%"
                description="Students passing exams"
                icon={Plane}
              />
            </div>
          </div>
        </section>

        {/* Topics Section */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Browse by Questions</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Select a topic to start practicing. Each topic contains questions 
                specific to DGCA examination syllabus.
              </p>
            </div>

            {isLoading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <Skeleton className="h-6 w-32 mb-2" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-24" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : topics.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {topics.map((topic) => (
                  <Link key={topic.id} to={`/topic/${topic.id}`}>
                    <Card className="group h-full transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 hover:border-primary/50">
                      <CardContent className="p-6">
                        <div className="space-y-2">
                          <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                            {topic.name}
                          </h3>
                          {topic.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {topic.description}
                            </p>
                          )}
                          <p className="text-xs text-primary font-medium pt-1">
                            {topic.questionCount}+ questions
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No topics available yet.</p>
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <Card className="gradient-aviation text-white overflow-hidden">
              <CardContent className="p-8 md:p-12 text-center">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Ready to Ace Your DGCA Exam?
                </h2>
                <p className="text-lg opacity-90 max-w-2xl mx-auto mb-8">
                  Start practicing with our comprehensive question bank and track 
                  your progress towards becoming a licensed pilot.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link to="/practice">
                    <Button size="lg" variant="secondary" className="gap-2 text-lg px-8">
                      Start Free Practice <ArrowRight className="h-5 w-5" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
