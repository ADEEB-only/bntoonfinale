import { Layout } from "@/components/layout/Layout";
import { Mail, FileText, Shield, AlertTriangle } from "lucide-react";

export default function DMCA() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-3 rounded-full bg-primary/10">
                <Shield className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h1 className="font-display text-4xl font-bold text-foreground">
              Copyright & DMCA Policy
            </h1>
            <p className="text-xl text-primary font-semibold">BnToon</p>
          </div>

          {/* Introduction */}
          <section className="prose prose-invert max-w-none space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              BnToon respects the intellectual property rights of artists, authors, publishers, and content owners.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              BnToon is a non-commercial, community-driven project created with the goal of making comics accessible to Bengali-speaking readers. The Bengali (Bangla) language currently lags behind in the availability of officially translated comics, manga, and manhwa. As a result, readers from the Bengal region—especially Bangladesh—are often forced to rely solely on English translations.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Bangladesh is a rapidly growing audience for anime, manga, and manhwa, and BnToon aims to help these readers enjoy comics in their native language, Bangla (Bengali), for cultural accessibility and language inclusion purposes.
            </p>
            <p className="text-muted-foreground leading-relaxed font-medium">
              BnToon does not claim ownership of any third-party content unless explicitly stated.
            </p>
          </section>

          {/* Copyright Infringement Notice */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-primary" />
              <h2 className="font-display text-2xl font-bold text-foreground">
                Copyright Infringement Notice
              </h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              If you are a copyright owner or an authorized representative and believe that any content on BnToon infringes upon your copyright, please notify us using the information below. Upon receiving a valid request, we will promptly review and remove the specified content.
            </p>
          </section>

          {/* How to Submit */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="h-6 w-6 text-primary" />
              <h2 className="font-display text-2xl font-bold text-foreground">
                How to Submit a DMCA Takedown Request
              </h2>
            </div>
            <p className="text-muted-foreground">
              Please send a takedown request to:
            </p>
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-foreground font-medium">
                📧 Contact Email:{" "}
                <a 
                  href="mailto:bntoonweb@gmail.com" 
                  className="text-primary hover:underline"
                >
                  bntoonweb@gmail.com
                </a>
              </p>
            </div>
            
            <p className="text-muted-foreground font-medium mt-6">
              Your notice must include:
            </p>
            <ul className="space-y-3 text-muted-foreground list-none">
              <li className="flex gap-3">
                <span className="text-primary">•</span>
                <span>Identification of the copyrighted work you claim has been infringed.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary">•</span>
                <span>The exact URL(s) of the content you want removed.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary">•</span>
                <span>Proof that you are the copyright owner or authorized to act on their behalf.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary">•</span>
                <span>A statement that you have a good-faith belief that the disputed use is not authorized by the copyright owner, its agent, or the law.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary">•</span>
                <span>A statement that the information provided is accurate and, under penalty of perjury, that you are authorized to act on behalf of the copyright owner.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary">•</span>
                <span>Your electronic or physical signature.</span>
              </li>
            </ul>
            <p className="text-amber-500 text-sm font-medium mt-4">
              Incomplete or unverifiable requests may not be processed.
            </p>
          </section>

          {/* Content Removal Policy */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-primary" />
              <h2 className="font-display text-2xl font-bold text-foreground">
                Content Removal Policy
              </h2>
            </div>
            <ul className="space-y-3 text-muted-foreground list-none">
              <li className="flex gap-3">
                <span className="text-primary">•</span>
                <span>Content identified in a valid DMCA notice will be removed as quickly as possible.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary">•</span>
                <span>Removed content will not be re-uploaded.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary">•</span>
                <span>Repeat infringement may result in permanent removal of the related series or content.</span>
              </li>
            </ul>
          </section>

          {/* Disclaimer */}
          <section className="bg-card border border-border rounded-lg p-6 space-y-4">
            <h2 className="font-display text-xl font-bold text-foreground">
              Disclaimer
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              BnToon does not host or distribute content with the intent to infringe copyright. Any copyright-protected material is provided with the intent of language accessibility and community benefit only. If any content is found to violate copyright law, it will be removed immediately upon proper notification.
            </p>
          </section>

          {/* Policy Updates */}
          <section className="text-center space-y-2 pt-4 border-t border-border">
            <p className="text-muted-foreground text-sm">
              BnToon reserves the right to update or modify this policy at any time without prior notice.
            </p>
            <p className="text-muted-foreground text-sm font-medium">
              Last Updated: 2026
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
}
