import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, Edit, Trash2, Search } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AdminRoute } from "@/components/AdminRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  getCategories,
  getSubtypes,
  createCategory,
  updateCategory,
  deleteCategory,
  mapCategoryToApp,
  CategoryInput,
} from "@/services/categoryService";
import { Category, SectionType } from "@/types/questions";

const iconOptions = [
  "Gauge", "Radio", "TrendingUp", "Cloud", "Wrench", "Compass",
  "Scale", "BookOpen", "Plane", "Award", "GraduationCap"
];

const AdminCategories = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categoriesData, isLoading } = useQuery({
    queryKey: ["adminCategories", searchQuery],
    queryFn: async () => {
      // Get all categories (both section-level and subtype-level)
      const result = await getCategories();
      if (!result.data) return { data: [] };
      
      // Filter by search query if provided
      if (searchQuery) {
        const filtered = result.data.filter(
          (cat) =>
            cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            cat.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
            cat.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        return { data: filtered };
      }
      
      return result;
    },
  });

  const categories = categoriesData?.data?.map((cat) => mapCategoryToApp(cat)) || [];

  const [formData, setFormData] = useState<Omit<CategoryInput, 'sectionType' | 'subtypeId'>>({
    name: "",
    description: "",
    icon: "Gauge",
  });

  const [selectedSectionType, setSelectedSectionType] = useState<SectionType | undefined>('dgca_questions');
  const [selectedSubtypeId, setSelectedSubtypeId] = useState<string | undefined>(undefined);

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      icon: "Gauge",
    });
    setSelectedSectionType('dgca_questions');
    setSelectedSubtypeId(undefined);
  };

  const createMutation = useMutation({
    mutationFn: (category: CategoryInput) => createCategory(category),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminCategories"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["contentHierarchy"] });
      queryClient.invalidateQueries({ queryKey: ["navigation"] });
      toast({
        title: "Success",
        description: "Category created successfully",
      });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create category",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, category }: { id: string; category: Partial<CategoryInput> }) =>
      updateCategory(id, category),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminCategories"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["contentHierarchy"] });
      queryClient.invalidateQueries({ queryKey: ["navigation"] });
      toast({
        title: "Success",
        description: "Category updated successfully",
      });
      setIsDialogOpen(false);
      setEditingCategory(null);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update category",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminCategories"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["contentHierarchy"] });
      queryClient.invalidateQueries({ queryKey: ["navigation"] });
      toast({
        title: "Success",
        description: "Category deleted successfully",
      });
      setDeleteCategoryId(null);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete category",
      });
    },
  });

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      icon: category.icon || 'Gauge',
    });
    setSelectedSectionType(category.sectionType);
    setSelectedSubtypeId(category.subtypeId);
    setIsDialogOpen(true);
  };

  // Fetch subtypes for dropdown
  const { data: subtypesData } = useQuery({
    queryKey: ['subtypes', selectedSectionType],
    queryFn: () => selectedSectionType ? getSubtypes(selectedSectionType) : { data: null, error: null },
    enabled: !!selectedSectionType && !editingCategory,
  });

  const subtypes = subtypesData?.data || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const categoryInput: CategoryInput = {
      ...formData,
      sectionType: selectedSubtypeId ? undefined : selectedSectionType,
      subtypeId: selectedSubtypeId,
    };

    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, category: categoryInput });
    } else {
      createMutation.mutate(categoryInput);
    }
  };

  const handleDelete = () => {
    if (deleteCategoryId) {
      deleteMutation.mutate(deleteCategoryId);
    }
  };


  return (
    <AdminRoute>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 py-8">
          <div className="container mx-auto px-4">
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Admin Dashboard
            </Link>

            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold mb-2">Manage Categories</h1>
                <p className="text-muted-foreground">Add, edit, or delete categories</p>
              </div>
              <Button
                onClick={() => {
                  resetForm();
                  setEditingCategory(null);
                  setIsDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </div>

            {/* Search */}
            <div className="mb-6">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Categories List */}
            {isLoading ? (
              <div className="text-center py-12">Loading...</div>
            ) : categories.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground mb-4">No categories found</p>
                  <Button onClick={() => setIsDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Category
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {categories.map((category) => (
                  <Card key={category.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-2">{category.name}</CardTitle>
                          <Badge variant="outline">{category.slug}</Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(category)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteCategoryId(category.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-2">
                        {category.description}
                      </p>
                      {category.subcategories && category.subcategories.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            Subcategories:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {category.subcategories.slice(0, 3).map((sub, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {sub}
                              </Badge>
                            ))}
                            {category.subcategories.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{category.subcategories.length - 3}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Add/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingCategory ? "Edit Category" : "Add New Category"}
                  </DialogTitle>
                  <DialogDescription>
                    Fill in the category details below
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4 py-4">
                    {!editingCategory && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="category-section">Section *</Label>
                          <Select
                            value={selectedSectionType || ''}
                            onValueChange={(value: SectionType) => {
                              setSelectedSectionType(value);
                              setSelectedSubtypeId(undefined);
                            }}
                          >
                            <SelectTrigger id="category-section">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="dgca_questions">D.G.C.A. Questions</SelectItem>
                              <SelectItem value="books">Books</SelectItem>
                              <SelectItem value="aircrafts">Aircrafts</SelectItem>
                              <SelectItem value="airlines">Airlines</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="category-parent">Parent (Optional - Leave empty for Section-level category)</Label>
                          <Select
                            value={selectedSubtypeId || ''}
                            onValueChange={(value) => {
                              setSelectedSubtypeId(value || undefined);
                            }}
                          >
                            <SelectTrigger id="category-parent">
                              <SelectValue placeholder="None (Section-level category)" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">None (Section-level category)</SelectItem>
                              {subtypes.map((subtype) => (
                                <SelectItem key={subtype.id} value={subtype.id}>
                                  {subtype.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">
                            Select a subtype to create a category under it, or leave empty to create directly under the section
                          </p>
                        </div>
                      </>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="category-name">Name *</Label>
                      <Input
                        id="category-name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        placeholder="Instruments"
                      />
                      <p className="text-xs text-muted-foreground">
                        Slug will be auto-generated from the name
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category-description">Description</Label>
                      <Textarea
                        id="category-description"
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({ ...formData, description: e.target.value })
                        }
                        rows={3}
                        placeholder="Brief description of the category"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category-icon">Icon</Label>
                      <Select
                        value={formData.icon}
                        onValueChange={(value) => setFormData({ ...formData, icon: value })}
                      >
                        <SelectTrigger id="category-icon">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {iconOptions.map((icon) => (
                            <SelectItem key={icon} value={icon}>
                              {icon}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsDialogOpen(false);
                        setEditingCategory(null);
                        resetForm();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                      {editingCategory ? "Update" : "Create"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog
              open={!!deleteCategoryId}
              onOpenChange={(open) => !open && setDeleteCategoryId(null)}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the category.
                    Questions in this category will not be deleted, but the category reference will be removed.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </main>
        <Footer />
      </div>
    </AdminRoute>
  );
};

export default AdminCategories;
