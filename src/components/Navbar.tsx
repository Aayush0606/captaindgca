import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import React from "react";
import { Menu, X, Plane, Search, User, ChevronDown, LogOut, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { getNavigationWithSubItems, getNavigationItemUrl } from "@/services/navigationService";
import { SectionType } from "@/types/questions";

// Hardcoded sections
const SECTIONS: { type: SectionType; name: string }[] = [
  { type: 'dgca_questions', name: 'D.G.C.A. Questions' },
  { type: 'books', name: 'Books' },
  { type: 'aircrafts', name: 'Aircrafts' },
  { type: 'airlines', name: 'Airlines' },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, loading: authLoading, signOut } = useAuth();
  const [fullName, setFullName] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  // Fetch navigation data for all sections
  const { data: dgcaNav } = useQuery({
    queryKey: ['navigation', 'dgca_questions'],
    queryFn: () => getNavigationWithSubItems('dgca_questions'),
  });

  const { data: booksNav } = useQuery({
    queryKey: ['navigation', 'books'],
    queryFn: () => getNavigationWithSubItems('books'),
  });

  const { data: aircraftsNav } = useQuery({
    queryKey: ['navigation', 'aircrafts'],
    queryFn: () => getNavigationWithSubItems('aircrafts'),
  });

  const { data: airlinesNav } = useQuery({
    queryKey: ['navigation', 'airlines'],
    queryFn: () => getNavigationWithSubItems('airlines'),
  });

  const navigationData = {
    dgca_questions: dgcaNav?.data,
    books: booksNav?.data,
    aircrafts: aircraftsNav?.data,
    airlines: airlinesNav?.data,
  };

  useEffect(() => {
    async function loadProfile() {
      if (!user) {
        setFullName(null);
        setIsAdmin(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, is_admin')
          .eq('id', user.id)
          .single();

        if (!error && data) {
          setFullName(data.full_name);
          setIsAdmin(data.is_admin ?? false);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    }

    if (!authLoading) {
      loadProfile();
    }
  }, [user, authLoading]);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const getUserInitials = () => {
    if (fullName) {
      return fullName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.[0].toUpperCase() || 'U';
  };

  const renderNavigationDropdown = (sectionType: SectionType) => {
    const nav = navigationData[sectionType];
    const items = nav?.items || [];

    if (items.length === 0) {
      return null;
    }

    const renderMenuItem = (item: any, depth: number = 0): React.ReactNode => {
      const url = item.url;
      const hasChildren = item.children && item.children.length > 0;

      // If item has children, create a submenu
      if (hasChildren) {
        // If item also has a URL (like categories), make it clickable to navigate
        if (url) {
          return (
            <DropdownMenuSub key={item.id}>
              <DropdownMenuSubTrigger
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  navigate(url);
                }}
                className="cursor-pointer"
              >
                {item.name}
                {item.isComingSoon && (
                  <Badge variant="secondary" className="ml-2 text-xs">Soon</Badge>
                )}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {item.children.map((child: any) => renderMenuItem(child, depth + 1))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          );
        } else {
          // Item has children but no URL (like subtypes)
          return (
            <DropdownMenuSub key={item.id}>
              <DropdownMenuSubTrigger>
                {item.name}
                {item.isComingSoon && (
                  <Badge variant="secondary" className="ml-2 text-xs">Soon</Badge>
                )}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {item.children.map((child: any) => renderMenuItem(child, depth + 1))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          );
        }
      }

      // Leaf item (direct link) - no children
      return (
        <DropdownMenuItem key={item.id} asChild disabled={item.isComingSoon || !url}>
          {url ? (
            <Link to={url}>
              {item.name}
              {item.isComingSoon && (
                <Badge variant="secondary" className="ml-2 text-xs">Soon</Badge>
              )}
            </Link>
          ) : (
            <span>
              {item.name}
              {item.isComingSoon && (
                <Badge variant="secondary" className="ml-2 text-xs">Soon</Badge>
              )}
            </span>
          )}
        </DropdownMenuItem>
      );
    };

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="gap-1">
            {SECTIONS.find(s => s.type === sectionType)?.name} <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          {items.map((item) => renderMenuItem(item))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const renderMobileNavigationItem = (item: any, depth: number = 0): React.ReactNode => {
    const url = item.url;
    const hasChildren = item.children && item.children.length > 0;

    if (hasChildren) {
      return (
        <div key={item.id} className="space-y-1">
          {/* If item has a URL (like categories), make it clickable */}
          {url ? (
            <Link
              to={url}
              className="font-semibold text-sm px-2 py-1 hover:bg-muted rounded-md transition-colors block"
              onClick={() => setIsOpen(false)}
            >
              {item.name}
              {item.isComingSoon && (
                <Badge variant="secondary" className="ml-2 text-xs">Soon</Badge>
              )}
            </Link>
          ) : (
            <div className="font-semibold text-sm text-muted-foreground px-2 py-1">
              {item.name}
              {item.isComingSoon && (
                <Badge variant="secondary" className="ml-2 text-xs">Soon</Badge>
              )}
            </div>
          )}
          {item.children.map((child: any) => (
            <div key={child.id} className="pl-4">
              {renderMobileNavigationItem(child, depth + 1)}
            </div>
          ))}
        </div>
      );
    }

    return (
      <Link
        key={item.id}
        to={url || '#'}
        className="px-2 py-2 rounded-md hover:bg-muted transition-colors block"
        onClick={() => setIsOpen(false)}
      >
        {item.name}
        {item.isComingSoon && (
          <Badge variant="secondary" className="ml-2 text-xs">Soon</Badge>
        )}
      </Link>
    );
  };

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
            {SECTIONS.map((section) => renderNavigationDropdown(section.type))}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            <Link to="/search">
              <Button variant="ghost" size="icon">
                <Search className="h-5 w-5" />
              </Button>
            </Link>
            <ThemeToggle />
            {!authLoading && (
              user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="hidden sm:flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.user_metadata?.avatar_url} />
                        <AvatarFallback>{getUserInitials()}</AvatarFallback>
                      </Avatar>
                      <span className="hidden md:inline-block">
                        {fullName || user.email?.split('@')[0]}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {fullName || 'User'}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard" className="cursor-pointer">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="cursor-pointer">
                          <User className="mr-2 h-4 w-4" />
                          Admin Panel
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link to="/login" className="hidden sm:block">
                  <Button variant="outline" className="gap-2">
                    <User className="h-4 w-4" />
                    Login
                  </Button>
                </Link>
              )
            )}

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
            <nav className="flex flex-col gap-4">
              {SECTIONS.map((section) => {
                const nav = navigationData[section.type];
                const items = nav?.items || [];
                
                if (items.length === 0) return null;

                return (
                  <div key={section.type}>
                    <div className="font-semibold text-sm text-muted-foreground px-2 mb-2">
                      {section.name}
                    </div>
                    <div className="space-y-1">
                      {items.map((item) => renderMobileNavigationItem(item))}
                    </div>
                    {section.type !== SECTIONS[SECTIONS.length - 1].type && (
                      <div className="border-t my-3" />
                    )}
                  </div>
                );
              })}
              {user ? (
                <>
                  <div className="border-t my-2" />
                  <Link
                    to="/dashboard"
                    className="px-2 py-2 rounded-md hover:bg-muted transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    Dashboard
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="px-2 py-2 rounded-md hover:bg-muted transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsOpen(false);
                    }}
                    className="px-2 py-2 rounded-md hover:bg-muted transition-colors text-left w-full"
                  >
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <div className="border-t my-2" />
                  <Link
                    to="/login"
                    className="px-2 py-2 rounded-md hover:bg-muted transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    Login / Sign Up
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
