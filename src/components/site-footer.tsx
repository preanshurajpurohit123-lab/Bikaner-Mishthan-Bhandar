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
            <a href={SITE.instagram} target="_blank" rel="noreferrer" aria-label="Instagram" className="rounded-full bg-primary-foreground/10 p-2 hover:bg-accent hover:text-accent-foreground"><Instagram className="h-4 w-4" /></a>
            <a href={SITE.facebook} target="_blank" rel="noreferrer" aria-label="Facebook" className="rounded-full bg-primary-foreground/10 p-2 hover:bg-accent hover:text-accent-foreground"><Facebook className="h-4 w-4" /></a>
            <a href={SITE.whatsapp} target="_blank" rel="noreferrer" aria-label="WhatsApp" className="rounded-full bg-primary-foreground/10 p-2 hover:bg-accent hover:text-accent-foreground">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true"><path d="M20.52 3.48A11.85 11.85 0 0 0 12.04 0C5.5 0 .2 5.3.2 11.84c0 2.08.55 4.11 1.59 5.9L0 24l6.4-1.68a11.83 11.83 0 0 0 5.64 1.43h.01c6.54 0 11.85-5.3 11.85-11.84 0-3.16-1.23-6.13-3.38-8.43ZM12.05 21.3h-.01a9.43 9.43 0 0 1-4.81-1.32l-.34-.2-3.8 1 1.02-3.7-.22-.38a9.43 9.43 0 0 1-1.45-5.04c0-5.22 4.25-9.47 9.47-9.47 2.53 0 4.9.99 6.69 2.78a9.39 9.39 0 0 1 2.77 6.7c0 5.22-4.25 9.47-9.32 9.63Zm5.4-7.1c-.3-.15-1.76-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48a9.06 9.06 0 0 1-1.67-2.07c-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.49 0 1.47 1.07 2.89 1.22 3.09.15.2 2.1 3.21 5.1 4.5.71.31 1.27.5 1.7.64.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35Z"/></svg>
            </a>
          </div>
          <p className="pt-3 text-xs text-primary-foreground/60">© {new Date().getFullYear()} {SITE.name}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
