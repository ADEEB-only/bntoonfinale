import { MessageCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

export function JoinUsCard() {
  return (
    <section>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-1 h-6 bg-primary rounded-full" />
        <h2 className="font-display text-xl font-bold text-foreground">Join Us</h2>
      </div>

      <div className="bg-card rounded-xl border border-border p-4 space-y-3">
        <p className="text-sm text-muted-foreground">
          Stay updated and connect with our community!
        </p>

        <div className="flex flex-col gap-2">
          <a
            href="https://discord.com/invite/PzyaVENX9w"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full"
          >
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-10 bg-[#5865F2]/10 border-[#5865F2]/30 hover:bg-[#5865F2]/20 hover:border-[#5865F2]/50 text-foreground"
            >
              <MessageCircle className="h-4 w-4 text-[#5865F2]" />
              <span className="text-sm font-medium">Join Discord</span>
            </Button>
          </a>

          <a
            href="https://t.me/BnToon"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full"
          >
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-10 bg-[#0088cc]/10 border-[#0088cc]/30 hover:bg-[#0088cc]/20 hover:border-[#0088cc]/50 text-foreground"
            >
              <Send className="h-4 w-4 text-[#0088cc]" />
              <span className="text-sm font-medium">Join Telegram</span>
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
}
