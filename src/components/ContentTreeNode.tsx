import { ChevronRight, ChevronDown, Folder, FolderOpen, FileText, Plus, Edit, Trash2, Upload, Eye, EyeOff, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { HierarchyNode } from "@/services/categoryService";
import { cn } from "@/lib/utils";

interface ContentTreeNodeProps {
  node: HierarchyNode;
  level?: number;
  onAddSubtype?: (sectionType: string) => void;
  onAddCategory?: (sectionTypeOrSubtypeId: string, isSubtype?: boolean) => void;
  onLinkTopics?: (categoryId: string) => void;
  onAddQuestion?: (topicId: string) => void;
  onBulkUpload?: (topicId: string) => void;
  onViewQuestions?: (topicId: string) => void;
  viewingQuestionsForTopics?: Set<string>;
  onEdit?: (node: HierarchyNode) => void;
  onDelete?: (node: HierarchyNode) => void;
  isExpanded?: boolean;
  onToggleExpand?: (nodeId: string) => void;
  expandedNodes?: Set<string>;
  questionsByTopic?: Map<string, any[]>;
  onEditQuestion?: (question: any) => void;
  onDeleteQuestion?: (questionId: string) => void;
}

export function ContentTreeNode({
  node,
  level = 0,
  onAddSubtype,
  onAddCategory,
  onLinkTopics,
  onAddQuestion,
  onBulkUpload,
  onViewQuestions,
  viewingQuestionsForTopics,
  onEdit,
  onDelete,
  isExpanded = false,
  onToggleExpand,
  expandedNodes,
  questionsByTopic,
  onEditQuestion,
  onDeleteQuestion,
}: ContentTreeNodeProps) {
  const hasChildren = node.children && node.children.length > 0;
  const canExpand = hasChildren || 
    (node.type === 'section' && (onAddSubtype || onAddCategory)) ||
    (node.type === 'subtype' && onAddCategory) ||
    (node.type === 'category' && onLinkTopics);

  const isViewingQuestions = node.type === 'topic' && viewingQuestionsForTopics?.has(node.id);
  const questions = node.type === 'topic' ? questionsByTopic?.get(node.id) : undefined;

  const getIcon = () => {
    if (node.type === 'section' || node.type === 'subtype' || node.type === 'category') {
      return isExpanded ? <FolderOpen className="h-4 w-4" /> : <Folder className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  const getTypeColor = () => {
    switch (node.type) {
      case 'section':
        return 'text-blue-600 dark:text-blue-400';
      case 'subtype':
        return 'text-purple-600 dark:text-purple-400';
      case 'category':
        return 'text-green-600 dark:text-green-400';
      case 'topic':
        return 'text-orange-600 dark:text-orange-400';
      default:
        return 'text-foreground';
    }
  };

  return (
    <div className={cn("group", level > 0 && "ml-4")}>
      <Collapsible open={isExpanded} onOpenChange={(open) => {
        if (onToggleExpand) {
          onToggleExpand(node.id);
        }
      }}>
        {canExpand ? (
          <CollapsibleTrigger asChild>
            <div className={cn(
              "flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors cursor-pointer",
              level === 0 && "font-semibold"
            )}>
              <Button variant="ghost" size="icon" className="h-6 w-6 pointer-events-none">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>

              <div className={cn("flex items-center gap-2 flex-1", getTypeColor())}>
                {getIcon()}
                <span className="text-sm">{node.name}</span>
                {node.questionCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {node.questionCount} {node.questionCount === 1 ? 'question' : 'questions'}
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
            {node.type === 'section' && (
              <>
                {onAddSubtype && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddSubtype(node.id);
                    }}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Subtype
                  </Button>
                )}
                {onAddCategory && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddCategory(node.id, false);
                    }}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Category
                  </Button>
                )}
              </>
            )}
            {node.type === 'subtype' && onAddCategory && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddCategory(node.id, true);
                }}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Category
              </Button>
            )}
            {node.type === 'category' && onLinkTopics && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onLinkTopics(node.id);
                }}
              >
                <Link2 className="h-3 w-3 mr-1" />
                Link Topics
              </Button>
            )}
            {node.type === 'topic' && (
              <>
                {onViewQuestions && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewQuestions(node.id);
                    }}
                  >
                    {isViewingQuestions ? (
                      <>
                        <EyeOff className="h-3 w-3 mr-1" />
                        Hide Questions
                      </>
                    ) : (
                      <>
                        <Eye className="h-3 w-3 mr-1" />
                        View Questions
                      </>
                    )}
                  </Button>
                )}
                {onAddQuestion && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddQuestion(node.id);
                    }}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Question
                  </Button>
                )}
                {onBulkUpload && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      onBulkUpload(node.id);
                    }}
                  >
                    <Upload className="h-3 w-3 mr-1" />
                    Bulk Upload
                  </Button>
                )}
              </>
            )}
            {onEdit && node.type !== 'section' && node.type !== 'topic' && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(node);
                }}
              >
                <Edit className="h-3 w-3" />
              </Button>
            )}
            {onDelete && node.type !== 'section' && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(node);
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
              </div>
            </div>
          </CollapsibleTrigger>
        ) : (
          <div className={cn(
            "flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors",
            level === 0 && "font-semibold"
          )}>
            <div className="w-6" />

            <div className={cn("flex items-center gap-2 flex-1", getTypeColor())}>
              {getIcon()}
              <span className="text-sm">{node.name}</span>
              {node.questionCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {node.questionCount} {node.questionCount === 1 ? 'question' : 'questions'}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {node.type === 'section' && (
              <>
                {onAddSubtype && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddSubtype(node.id);
                    }}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Subtype
                  </Button>
                )}
                {onAddCategory && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddCategory(node.id, false);
                    }}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Category
                  </Button>
                )}
              </>
            )}
            {node.type === 'subtype' && onAddCategory && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddCategory(node.id, true);
                }}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Category
              </Button>
            )}
            {node.type === 'category' && onLinkTopics && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onLinkTopics(node.id);
                }}
              >
                <Link2 className="h-3 w-3 mr-1" />
                Link Topics
              </Button>
            )}
            {node.type === 'topic' && (
              <>
                {onViewQuestions && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewQuestions(node.id);
                    }}
                  >
                    {isViewingQuestions ? (
                      <>
                        <EyeOff className="h-3 w-3 mr-1" />
                        Hide Questions
                      </>
                    ) : (
                      <>
                        <Eye className="h-3 w-3 mr-1" />
                        View Questions
                      </>
                    )}
                  </Button>
                )}
                {onAddQuestion && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddQuestion(node.id);
                    }}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Question
                  </Button>
                )}
                {onBulkUpload && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      onBulkUpload(node.id);
                    }}
                  >
                    <Upload className="h-3 w-3 mr-1" />
                    Bulk Upload
                  </Button>
                )}
              </>
            )}
            {onEdit && node.type !== 'section' && node.type !== 'topic' && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(node);
                }}
              >
                <Edit className="h-3 w-3" />
              </Button>
            )}
            {onDelete && node.type !== 'section' && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(node);
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
          </div>
        )}

        {hasChildren && (
          <CollapsibleContent>
            <div className="ml-4 border-l border-muted pl-2">
              {node.children?.map((child) => (
                <ContentTreeNode
                  key={child.id}
                  node={child}
                  level={level + 1}
                  onAddSubtype={onAddSubtype}
                  onAddCategory={onAddCategory}
                  onLinkTopics={onLinkTopics}
                  onAddQuestion={onAddQuestion}
                  onBulkUpload={onBulkUpload}
                  onViewQuestions={onViewQuestions}
                  viewingQuestionsForTopics={viewingQuestionsForTopics}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  isExpanded={expandedNodes?.has(child.id) || false}
                  onToggleExpand={onToggleExpand}
                  expandedNodes={expandedNodes}
                  questionsByTopic={questionsByTopic}
                  onEditQuestion={onEditQuestion}
                  onDeleteQuestion={onDeleteQuestion}
                />
              ))}
            </div>
          </CollapsibleContent>
        )}
      </Collapsible>

      {/* Questions List for Topic */}
      {node.type === 'topic' && isViewingQuestions && questions !== undefined && (
        <div className="ml-4 border-l border-muted pl-4 mt-2 space-y-2">
          {questions.length > 0 ? (
            questions.map((question) => (
              <div key={question.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-md group">
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{question.question}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      Difficulty: {question.difficulty}
                    </span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">
                      {question.options.length} options
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {onEditQuestion && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onEditQuestion(question)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  )}
                  {onDeleteQuestion && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => onDeleteQuestion(question.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground p-2">No questions yet</p>
          )}
        </div>
      )}
    </div>
  );
}
