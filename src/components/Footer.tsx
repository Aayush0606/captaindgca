import { Link } from "react-router-dom";
import { Plane } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-card">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2 font-bold text-xl">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Plane className="h-5 w-5" />
              </div>
              <span>DGCA Question Bank</span>
            </Link>
            <p className="text-muted-foreground text-sm">
              Your comprehensive platform for DGCA pilot examination preparation. 
              Practice with thousands of questions from multiple sources.
            </p>
          </div>

          {/* Subjects */}
          <div>
            <h3 className="font-semibold mb-4">Subjects</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/category/instruments" className="hover:text-foreground transition-colors">Instruments</Link></li>
              <li><Link to="/category/radio-navigation" className="hover:text-foreground transition-colors">Radio Navigation</Link></li>
              <li><Link to="/category/meteorology" className="hover:text-foreground transition-colors">Meteorology</Link></li>
              <li><Link to="/category/performance" className="hover:text-foreground transition-colors">Performance</Link></li>
              <li><Link to="/category/navigation" className="hover:text-foreground transition-colors">Navigation</Link></li>
            </ul>
          </div>

          {/* Question Banks */}
          <div>
            <h3 className="font-semibold mb-4">Question Banks</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/source/ATPL" className="hover:text-foreground transition-colors">ATPL Question Bank</Link></li>
              <li><Link to="/source/Indigo" className="hover:text-foreground transition-colors">Indigo Airlines</Link></li>
              <li><Link to="/source/Oxford" className="hover:text-foreground transition-colors">Oxford Aviation</Link></li>
              <li><Link to="/category/airbus-320" className="hover:text-foreground transition-colors">Airbus A320</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold mb-4">Resources</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/practice" className="hover:text-foreground transition-colors">Practice Tests</Link></li>
              <li><Link to="/search" className="hover:text-foreground transition-colors">Search Questions</Link></li>
              <li><Link to="/login" className="hover:text-foreground transition-colors">Login / Sign Up</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} DGCA Question Bank. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground">
            Made for aspiring pilots in India 🇮🇳
          </p>
        </div>
      </div>
    </footer>
  );
}
