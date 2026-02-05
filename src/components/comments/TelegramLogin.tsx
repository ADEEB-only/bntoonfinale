 import { useEffect, useRef } from "react";
 import { Button } from "@/components/ui/button";
 import { MessageCircle } from "lucide-react";
 
 interface TelegramLoginProps {
   botName: string;
   onAuth: (user: TelegramUser) => void;
 }
 
 export interface TelegramUser {
   telegram_id: number;
   telegram_username?: string;
   telegram_name: string;
   photo_url?: string;
 }
 
 declare global {
   interface Window {
     TelegramLoginWidget: {
       dataOnauth: (user: TelegramAuthResult) => void;
     };
   }
 }
 
 interface TelegramAuthResult {
   id: number;
   first_name: string;
   last_name?: string;
   username?: string;
   photo_url?: string;
   auth_date: number;
   hash: string;
 }
 
 export function TelegramLogin({ botName, onAuth }: TelegramLoginProps) {
   const containerRef = useRef<HTMLDivElement>(null);
   const scriptLoaded = useRef(false);
 
   useEffect(() => {
     if (scriptLoaded.current || !containerRef.current) return;
     scriptLoaded.current = true;
 
     // Set up the callback
     window.TelegramLoginWidget = {
       dataOnauth: async (user: TelegramAuthResult) => {
         try {
           const response = await fetch(
             `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/telegram-auth`,
             {
               method: "POST",
               headers: { "Content-Type": "application/json" },
               credentials: "include",
               body: JSON.stringify(user),
             }
           );
 
           if (response.ok) {
             const data = await response.json();
             if (data.success && data.user) {
               // Store in localStorage as backup
               localStorage.setItem("tg_user", JSON.stringify(data.user));
               onAuth(data.user);
             }
           } else {
             console.error("Auth failed:", await response.text());
           }
         } catch (error) {
           console.error("Telegram auth error:", error);
         }
       },
     };
 
     // Create the Telegram script
     const script = document.createElement("script");
     script.src = "https://telegram.org/js/telegram-widget.js?22";
     script.setAttribute("data-telegram-login", botName);
     script.setAttribute("data-size", "large");
     script.setAttribute("data-onauth", "TelegramLoginWidget.dataOnauth(user)");
     script.setAttribute("data-request-access", "write");
     script.async = true;
 
     containerRef.current.appendChild(script);
 
     return () => {
       if (containerRef.current) {
         containerRef.current.innerHTML = "";
       }
       scriptLoaded.current = false;
     };
   }, [botName, onAuth]);
 
   return (
     <div className="flex flex-col items-center gap-4">
       <div ref={containerRef} />
       <p className="text-sm text-muted-foreground flex items-center gap-2">
         <MessageCircle className="h-4 w-4" />
         Login with Telegram to comment
       </p>
     </div>
   );
 }
 
 export function TelegramLoginButton({ onClick }: { onClick: () => void }) {
   return (
     <Button onClick={onClick} variant="outline" className="gap-2">
       <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
         <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.009-1.252-.242-1.865-.442-.751-.244-1.349-.374-1.297-.789.027-.216.324-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.015 3.333-1.386 4.025-1.627 4.477-1.635.099-.002.321.023.465.141.121.1.154.234.17.331.015.098.034.322.019.496z"/>
       </svg>
       Login with Telegram
     </Button>
   );
 }