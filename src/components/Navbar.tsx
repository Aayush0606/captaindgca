import { Link } from "react-router-dom";
import { useState } from "react";
import { Menu, X, Plane, Search, User, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const subjectLinks = [
  { name: "Instruments", href: "/category/instruments" },
  { name: "Radio Navigation", href: "/category/radio-navigation" },
  { name: "Performance", href: "/category/performance" },
  { name: "Meteorology", href: "/category/meteorology" },
  { name: "Technical", href: "/category/technical" },
  { name: "Navigation", href: "/category/navigation" },
  { name: "Regulations", href: "/category/regulations" },
  { name: "Air Law", href: "/category/air-law" },
  { name: "Mass & Balance", href: "/category/mass-balance" },
];

const sourceLinks = [
  { name: "ATPL Question Bank", href: "/source/ATPL" },
  { name: "Indigo Airlines", href: "/source/Indigo" },
  { name: "Oxford Aviation", href: "/source/Oxford" },
  { name: "Keith Williams", href: "/source/Keith Williams" },
  { name: "Previous Papers", href: "/source/Previous Papers" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-bold text-xl">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Plane className="h-5 w-5" />
            </div>
            <span className="hidden sm:inline-block">DGCA Question Bank</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {/* Subjects Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-1">
                  Subjects <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                {subjectLinks.map((link) => (
                  <DropdownMenuItem key={link.href} asChild>
                    <Link to={link.href}>{link.name}</Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Question Banks Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-1">
                  Question Banks <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                {sourceLinks.map((link) => (
                  <DropdownMenuItem key={link.href} asChild>
                    <Link to={link.href}>{link.name}</Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Link to="/category/airbus-320">
              <Button variant="ghost">Airbus A320</Button>
            </Link>

            <Link to="/practice">
              <Button variant="ghost">Practice Test</Button>
            </Link>
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            <Link to="/search">
              <Button variant="ghost" size="icon">
                <Search className="h-5 w-5" />
              </Button>
            </Link>
            <ThemeToggle />
            <Link to="/login" className="hidden sm:block">
              <Button variant="outline" className="gap-2">
                <User className="h-4 w-4" />
                Login
              </Button>
            </Link>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="lg:hidden border-t py-4 animate-fade-in">
            <nav className="flex flex-col gap-2">
              <div className="font-semibold text-sm text-muted-foreground px-2 mb-1">Subjects</div>
              {subjectLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="px-2 py-2 rounded-md hover:bg-muted transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              <div className="border-t my-2" />
              <div className="font-semibold text-sm text-muted-foreground px-2 mb-1">Question Banks</div>
              {sourceLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="px-2 py-2 rounded-md hover:bg-muted transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              <div className="border-t my-2" />
              <Link
                to="/practice"
                className="px-2 py-2 rounded-md hover:bg-muted transition-colors font-medium"
                onClick={() => setIsOpen(false)}
              >
                Practice Test
              </Link>
              <Link
                to="/login"
                className="px-2 py-2 rounded-md hover:bg-muted transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Login / Sign Up
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
