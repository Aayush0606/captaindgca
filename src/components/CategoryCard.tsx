import { Link } from "react-router-dom";
import { 
  Gauge, 
  Radio, 
  TrendingUp, 
  Cloud, 
  Wrench, 
  Compass, 
  Scale, 
  BookOpen, 
  Plane 
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Category } from "@/types/questions";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Gauge,
  Radio,
  TrendingUp,
  Cloud,
  Wrench,
  Compass,
  Scale,
  BookOpen,
  Plane,
};

interface CategoryCardProps {
  category: Category;
}

export function CategoryCard({ category }: CategoryCardProps) {
  const Icon = iconMap[category.icon] || Gauge;

  return (
    <Link to={`/category/${category.slug}`}>
      <Card className="group h-full transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 hover:border-primary/50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <Icon className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                {category.name}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {category.description}
              </p>
              <p className="text-xs text-primary font-medium pt-1">
                {category.questionCount}+ questions
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
