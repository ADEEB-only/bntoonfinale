import { useEffect, useState, useCallback } from "react";
 import { formatDistanceToNow } from "date-fns";
import { Loader2, MessageSquare, Trash2, Reply, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface TelegramUser {
  telegram_id: number;
  telegram_username?: string;
  telegram_name: string;
}
 
 interface Comment {
   id: string;
   series_id: string;
   chapter_id: string | null;
   telegram_id: number;
   telegram_username: string | null;
   telegram_name: string;
   content: string;
   created_at: string;
  parent_id: string | null;
  replies?: Comment[];
 }
 
 interface CommentListProps {
   seriesId: string;
   chapterId?: string;
   refreshKey?: number;
  currentUser?: TelegramUser | null;
  onReplySubmitted?: () => void;
 }
 
export function CommentList({ seriesId, chapterId, refreshKey = 0, currentUser, onReplySubmitted }: CommentListProps) {
   const [comments, setComments] = useState<Comment[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();
  const { isAdmin } = useAuth();
 
  const fetchComments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
 
    try {
      const params = new URLSearchParams({ seriesId });
      if (chapterId) params.append("chapterId", chapterId);
 
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/comments?${params}`
      );
 
      if (response.ok) {
        const data = await response.json();
        setComments(data.data || []);
      } else {
         setError("Failed to load comments");
       }
    } catch {
      setError("Failed to load comments");
    } finally {
      setIsLoading(false);
    }
  }, [seriesId, chapterId]);
 
  useEffect(() => {
     fetchComments();
  }, [fetchComments, refreshKey]);

  const handleDelete = async (commentId: string) => {
    setDeletingId(commentId);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/comments`,
        {
          method: "DELETE",
          headers,
          credentials: "include",
          body: JSON.stringify({ commentId }),
        }
      );

      if (response.ok) {
        toast({ title: "Comment deleted" });
        fetchComments();
      } else {
        const error = await response.json();
        toast({
          title: "Failed to delete comment",
          description: error.error || "Please try again.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete comment.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim() || !currentUser) return;

    setIsSubmittingReply(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            seriesId,
            chapterId: chapterId || null,
            content: replyContent.trim(),
            parentId,
          }),
        }
      );

      if (response.ok) {
        setReplyContent("");
        setReplyingTo(null);
        toast({ title: "Reply posted!" });
        fetchComments();
        onReplySubmitted?.();
      } else {
        const error = await response.json();
        toast({
          title: "Failed to post reply",
          description: error.error || "Please try again.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to post reply.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const toggleReplies = (commentId: string) => {
    setExpandedReplies((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
  };

  const canDelete = (comment: Comment) => {
    if (isAdmin) return true;
    if (currentUser && currentUser.telegram_id === comment.telegram_id) return true;
    return false;
  };
 
   if (isLoading) {
     return (
       <div className="flex items-center justify-center py-12">
         <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
       </div>
     );
   }
 
   if (error) {
     return (
       <div className="text-center py-12 text-muted-foreground">
         <p>{error}</p>
       </div>
     );
   }
 
   if (comments.length === 0) {
     return (
       <div className="text-center py-12">
         <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground/40 mb-4" />
         <p className="text-muted-foreground">No comments yet. Be the first to comment!</p>
       </div>
     );
   }
 
   return (
     <div className="space-y-4">
       {comments.map((comment) => (
         <div
           key={comment.id}
           className="bg-card rounded-lg border border-border p-4"
         >
           <div className="flex items-start gap-3">
             <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
               {comment.telegram_name.charAt(0).toUpperCase()}
             </div>
             <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-foreground">
                    {comment.telegram_name}
                   </span>
                  {comment.telegram_username && (
                    <span className="text-sm text-muted-foreground">
                      @{comment.telegram_username}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    •{" "}
                    {formatDistanceToNow(new Date(comment.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                {canDelete(comment) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(comment.id)}
                    disabled={deletingId === comment.id}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                  >
                    {deletingId === comment.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                )}
               </div>
               <p className="mt-2 text-foreground whitespace-pre-wrap break-words">
                 {comment.content}
               </p>
              
              {/* Reply button and replies toggle */}
              <div className="flex items-center gap-4 mt-3">
                {currentUser && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                    className="h-8 gap-1.5 text-muted-foreground hover:text-foreground"
                  >
                    <Reply className="h-4 w-4" />
                    Reply
                  </Button>
                )}
                {comment.replies && comment.replies.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleReplies(comment.id)}
                    className="h-8 gap-1.5 text-muted-foreground hover:text-foreground"
                  >
                    {expandedReplies.has(comment.id) ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                    {comment.replies.length} {comment.replies.length === 1 ? "reply" : "replies"}
                  </Button>
                )}
              </div>
              
              {/* Reply form */}
              {replyingTo === comment.id && currentUser && (
                <div className="mt-3 pl-4 border-l-2 border-border">
                  <Textarea
                    placeholder="Write a reply..."
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    className="min-h-[80px] resize-none"
                    maxLength={2000}
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setReplyingTo(null);
                        setReplyContent("");
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleSubmitReply(comment.id)}
                      disabled={!replyContent.trim() || isSubmittingReply}
                    >
                      {isSubmittingReply ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Reply"
                      )}
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Replies list */}
              {expandedReplies.has(comment.id) && comment.replies && comment.replies.length > 0 && (
                <div className="mt-4 pl-4 border-l-2 border-border space-y-3">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                        {reply.telegram_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-foreground text-sm">
                              {reply.telegram_name}
                            </span>
                            {reply.telegram_username && (
                              <span className="text-xs text-muted-foreground">
                                @{reply.telegram_username}
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground">
                              •{" "}
                              {formatDistanceToNow(new Date(reply.created_at), {
                                addSuffix: true,
                              })}
                            </span>
                          </div>
                          {canDelete(reply) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(reply.id)}
                              disabled={deletingId === reply.id}
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                            >
                              {deletingId === reply.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Trash2 className="h-3 w-3" />
                              )}
                            </Button>
                          )}
                        </div>
                        <p className="mt-1 text-foreground text-sm whitespace-pre-wrap break-words">
                          {reply.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
             </div>
           </div>
         </div>
       ))}
     </div>
   );
 }