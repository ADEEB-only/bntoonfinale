 import { useEffect, useState } from "react";
 import { formatDistanceToNow } from "date-fns";
 import { Loader2, MessageSquare } from "lucide-react";
 
 interface Comment {
   id: string;
   series_id: string;
   chapter_id: string | null;
   telegram_id: number;
   telegram_username: string | null;
   telegram_name: string;
   content: string;
   created_at: string;
 }
 
 interface CommentListProps {
   seriesId: string;
   chapterId?: string;
   refreshKey?: number;
 }
 
 export function CommentList({ seriesId, chapterId, refreshKey = 0 }: CommentListProps) {
   const [comments, setComments] = useState<Comment[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
 
   useEffect(() => {
     const fetchComments = async () => {
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
     };
 
     fetchComments();
   }, [seriesId, chapterId, refreshKey]);
 
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
               <p className="mt-2 text-foreground whitespace-pre-wrap break-words">
                 {comment.content}
               </p>
             </div>
           </div>
         </div>
       ))}
     </div>
   );
 }