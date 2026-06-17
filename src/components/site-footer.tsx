import { SITE } from "@/lib/site";
import { Phone, MapPin, Clock, Instagram, Facebook } from "lucide-react";

export function SiteFooter() {
  return (
    <footer id="contact" className="mt-24 border-t border-border/60 bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-3">
            <img src={SITE.logoUrl} alt="BMB" className="h-12 w-12 rounded-full ring-2 ring-accent" />
            <div>
              <div className="font-display text-lg">{SITE.short}</div>
              <div className="text-xs uppercase tracking-[0.18em] text-accent">Since generations</div>
            </div>
          </div>
          <p className="mt-4 text-sm text-primary-foreground/80">{SITE.tagline}</p>
        </div>
        <div className="space-y-3 text-sm">
          <h4 className="font-display text-base text-accent">Visit Us</h4>
          <div className="flex gap-3"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" /><a href={SITE.mapsUrl} target="_blank" rel="noreferrer" className="hover:underline">{SITE.address}</a></div>
          <div className="flex gap-3"><Clock className="mt-0.5 h-4 w-4 shrink-0 text-accent" /><span>{SITE.hours}</span></div>
          <div className="flex gap-3"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-accent" /><a href={`tel:${SITE.phoneDigits}`} className="hover:underline">{SITE.phone}</a></div>
        </div>
        <div className="space-y-3 text-sm">
          <h4 className="font-display text-base text-accent">Follow</h4>
          <div className="flex gap-3">
            <a href={SITE.instagram} target="_blank" rel="noreferrer" className="rounded-full bg-primary-foreground/10 p-2 hover:bg-accent hover:text-accent-foreground"><Instagram className="h-4 w-4" /></a>
            <a href={SITE.facebook} target="_blank" rel="noreferrer" className="rounded-full bg-primary-foreground/10 p-2 hover:bg-accent hover:text-accent-foreground"><Facebook className="h-4 w-4" /></a>
            <a href={SITE.whatsapp} target="_blank" rel="noreferrer" className="rounded-full bg-primary-foreground/10 p-2 hover:bg-accent hover:text-accent-foreground">WA</a>
          </div>
          <p className="pt-3 text-xs text-primary-foreground/60">© {new Date().getFullYear()} {SITE.name}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
