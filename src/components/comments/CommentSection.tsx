 import { useState, useEffect, useCallback } from "react";
 import { TelegramLogin, TelegramUser } from "./TelegramLogin";
 import { CommentList } from "./CommentList";
 import { Button } from "@/components/ui/button";
 import { Textarea } from "@/components/ui/textarea";
 import { Loader2, Send, LogOut, MessageCircle } from "lucide-react";
 import { useToast } from "@/hooks/use-toast";
 
 interface CommentSectionProps {
   seriesId: string;
   chapterId?: string;
   botName?: string;
 }
 
 export function CommentSection({
   seriesId,
   chapterId,
   botName = "BnToonAccBot",
 }: CommentSectionProps) {
   const [user, setUser] = useState<TelegramUser | null>(null);
   const [content, setContent] = useState("");
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [refreshKey, setRefreshKey] = useState(0);
   const { toast } = useToast();
 
   // Check for existing session
   useEffect(() => {
     const stored = localStorage.getItem("tg_user");
     if (stored) {
       try {
         setUser(JSON.parse(stored));
       } catch {
         localStorage.removeItem("tg_user");
       }
     }
   }, []);
 
   const handleAuth = useCallback((authUser: TelegramUser) => {
     setUser(authUser);
   }, []);
 
   const handleLogout = () => {
     localStorage.removeItem("tg_user");
     document.cookie = "tg_auth=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
     setUser(null);
   };
 
   const handleSubmit = async () => {
     if (!content.trim() || !user) return;
 
     setIsSubmitting(true);
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
             content: content.trim(),
           }),
         }
       );
 
       if (response.ok) {
         setContent("");
         setRefreshKey((k) => k + 1);
         toast({
           title: "Comment posted!",
           description: "Your comment has been added.",
         });
       } else {
         const error = await response.json();
         toast({
           title: "Failed to post comment",
           description: error.error || "Please try again.",
           variant: "destructive",
         });
       }
     } catch (error) {
       toast({
         title: "Error",
         description: "Failed to post comment. Please try again.",
         variant: "destructive",
       });
     } finally {
       setIsSubmitting(false);
     }
   };
 
   return (
     <section className="mt-12 pt-8 border-t border-border">
       <div className="flex items-center gap-3 mb-6">
         <div className="w-1 h-6 bg-primary rounded-full" />
         <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
           <MessageCircle className="h-5 w-5" />
           Comments
         </h2>
       </div>
 
       {/* Auth / Comment Form */}
       <div className="bg-card rounded-xl border border-border p-6 mb-6">
         {user ? (
           <div className="space-y-4">
             <div className="flex items-center justify-between">
               <div className="flex items-center gap-3">
                 {user.photo_url ? (
                   <img
                     src={user.photo_url}
                     alt={user.telegram_name}
                     className="w-10 h-10 rounded-full"
                   />
                 ) : (
                   <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                     {user.telegram_name.charAt(0).toUpperCase()}
                   </div>
                 )}
                 <div>
                   <p className="font-medium text-foreground">{user.telegram_name}</p>
                   {user.telegram_username && (
                     <p className="text-sm text-muted-foreground">@{user.telegram_username}</p>
                   )}
                 </div>
               </div>
               <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
                 <LogOut className="h-4 w-4" />
                 Logout
               </Button>
             </div>
 
             <Textarea
               placeholder="Write a comment..."
               value={content}
               onChange={(e) => setContent(e.target.value)}
               className="min-h-[100px] resize-none"
               maxLength={2000}
             />
 
             <div className="flex items-center justify-between">
               <span className="text-xs text-muted-foreground">
                 {content.length}/2000
               </span>
               <Button
                 onClick={handleSubmit}
                 disabled={!content.trim() || isSubmitting}
                 className="gap-2"
               >
                 {isSubmitting ? (
                   <Loader2 className="h-4 w-4 animate-spin" />
                 ) : (
                   <Send className="h-4 w-4" />
                 )}
                 Post Comment
               </Button>
             </div>
           </div>
         ) : (
           <TelegramLogin botName={botName} onAuth={handleAuth} />
         )}
       </div>
 
       {/* Comments List */}
       <CommentList
         seriesId={seriesId}
         chapterId={chapterId}
         refreshKey={refreshKey}
          currentUser={user}
          onReplySubmitted={() => setRefreshKey((k) => k + 1)}
       />
     </section>
   );
 }