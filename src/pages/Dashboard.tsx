import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowLeft, Trophy, BookOpen, Target, Clock, TrendingUp, BarChart3 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { getUserProgress, getCategoryProgress, mapUserProgressToApp } from "@/services/progressService";
import { getUserTestResults, mapTestResultToApp } from "@/services/testService";
import { getCategoriesWithPaths } from "@/services/categoryService";

const Dashboard = () => {
  const { user } = useAuth();

  // Fetch categories with paths for displaying hierarchy
  const { data: categoriesData } = useQuery({
    queryKey: ['dashboardCategories'],
    queryFn: () => getCategoriesWithPaths(),
  });

  const categories = categoriesData?.data || [];
  const categoryMap = new Map(categories.map(cat => [cat.id, cat]));

  const { data: userProgressData, isLoading: progressLoading } = useQuery({
    queryKey: ['userProgress', user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) throw new Error('No user');
      const [progressResult, categoryResult, testResultsResult] = await Promise.all([
        getUserProgress(user.id),
        getCategoryProgress(user.id),
        getUserTestResults(user.id, 10),
      ]);

      if (progressResult.error || categoryResult.error || testResultsResult.error) {
        throw new Error('Failed to load progress');
      }

      const userProgress = progressResult.data
        ? mapUserProgressToApp(
            progressResult.data,
            categoryResult.data || [],
            (testResultsResult.data || []).map(mapTestResultToApp)
          )
        : null;

      return {
        userProgress,
        categoryProgress: categoryResult.data || [],
        recentTests: (testResultsResult.data || []).map(mapTestResultToApp),
      };
    },
  });

  const userProgress = userProgressData?.userProgress;
  const categoryProgress = userProgressData?.categoryProgress || [];
  const recentTests = userProgressData?.recentTests || [];

  const overallAccuracy = userProgress
    ? userProgress.totalQuestionsAttempted > 0
      ? Math.round((userProgress.correctAnswers / userProgress.totalQuestionsAttempted) * 100)
      : 0
    : 0;

  const getCategoryName = (categoryId: string) => {
    const category = categoryMap.get(categoryId);
    return category?.path || category?.name || categoryId;
  };

  return (
    <ProtectedRoute>
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

            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
              <p className="text-muted-foreground">Track your progress and performance</p>
            </div>

            {progressLoading ? (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Card key={i}>
                      <CardHeader className="pb-2">
                        <Skeleton className="h-4 w-24" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-8 w-16" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Tests Taken</CardTitle>
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {userProgress?.totalTestsTaken || 0}
                      </div>
                      <p className="text-xs text-muted-foreground">Total practice tests</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Questions Attempted</CardTitle>
                      <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {userProgress?.totalQuestionsAttempted || 0}
                      </div>
                      <p className="text-xs text-muted-foreground">Total questions answered</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Accuracy</CardTitle>
                      <Trophy className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{overallAccuracy}%</div>
                      <p className="text-xs text-muted-foreground">
                        {userProgress?.correctAnswers || 0} correct answers
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  {/* Category Progress */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Category Performance
                      </CardTitle>
                      <CardDescription>Your performance by subject category</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {categoryProgress.length > 0 ? (
                        <div className="space-y-4">
                          {categoryProgress.map((cat) => {
                            const accuracy =
                              cat.questions_attempted > 0
                                ? Math.round((cat.correct_answers / cat.questions_attempted) * 100)
                                : 0;
                            return (
                              <div key={cat.id} className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="font-medium">
                                    {getCategoryName(cat.category_id)}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="secondary">
                                      {accuracy}%
                                    </Badge>
                                    <span className="text-muted-foreground text-xs">
                                      {cat.correct_answers}/{cat.questions_attempted}
                                    </span>
                                  </div>
                                </div>
                                <Progress value={accuracy} className="h-2" />
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <p>No category progress yet.</p>
                          <Link to="/practice">
                            <Button variant="outline" size="sm" className="mt-4">
                              Start a Practice Test
                            </Button>
                          </Link>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Recent Tests */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Recent Tests
                      </CardTitle>
                      <CardDescription>Your most recent practice test results</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {recentTests.length > 0 ? (
                        <div className="space-y-4">
                          {recentTests.slice(0, 5).map((test) => {
                            const percentage = Math.round((test.score / test.totalQuestions) * 100);
                            const formatDate = (date: Date) => {
                              return new Intl.DateTimeFormat('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit',
                              }).format(date);
                            };
                            return (
                              <div
                                key={test.id}
                                className="flex items-center justify-between p-3 border rounded-lg"
                              >
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">
                                      {test.categoryId ? getCategoryName(test.categoryId) : 'Mixed Topics'}
                                    </span>
                                    <Badge
                                      variant={
                                        percentage >= 70
                                          ? 'default'
                                          : percentage >= 50
                                          ? 'secondary'
                                          : 'outline'
                                      }
                                    >
                                      {percentage}%
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    {formatDate(test.date)} • {test.score}/{test.totalQuestions} correct
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <p>No test results yet.</p>
                          <Link to="/practice">
                            <Button variant="outline" size="sm" className="mt-4">
                              Start a Practice Test
                            </Button>
                          </Link>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Actions */}
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-4">
                      <Link to="/practice">
                        <Button>Start Practice Test</Button>
                      </Link>
                      <Link to="/search">
                        <Button variant="outline">Search Questions</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  );
};

export default Dashboard;
