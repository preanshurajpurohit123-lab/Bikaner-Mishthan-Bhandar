import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SITE } from "@/lib/site";
import { ArrowRight, Star, Utensils, Clock, MapPin, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `${SITE.name} · Batala — Order at your table` },
      { name: "description", content: `${SITE.tagline} — visit us in Batala, Gurdaspur.` },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary via-primary to-[oklch(0.28_0.10_25)]" />
        <div className="absolute inset-0 -z-10 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, oklch(0.78 0.14 85 / 0.4), transparent 50%), radial-gradient(circle at 80% 80%, oklch(0.78 0.14 85 / 0.3), transparent 50%)" }} />
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 md:grid-cols-2 md:py-28">
          <div className="text-primary-foreground">
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-accent">
              <Sparkles className="h-3 w-3" /> Authentic · Batala
            </span>
            <h1 className="mt-5 font-display text-4xl leading-[1.05] sm:text-5xl md:text-6xl">
              Sweets, chaat &<br />street-food joy.
            </h1>
            <p className="mt-5 max-w-md text-base text-primary-foreground/80">
              {SITE.name} brings you Bikaneri sweets, crisp dosas, sizzling pizzas, chaats and shakes — made fresh, served warm.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/menu" className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground shadow-lg shadow-black/20 transition hover:opacity-90">
                View menu <ArrowRight className="h-4 w-4" />
              </Link>
              <a href={SITE.mapsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/30 px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary-foreground/10">
                <MapPin className="h-4 w-4" /> Get directions
              </a>
            </div>
            <div className="mt-8 flex items-center gap-1 text-accent">
              {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-accent" />)}
              <span className="ml-2 text-xs text-primary-foreground/70">Loved by locals across Gurdaspur</span>
            </div>
          </div>
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-accent/20 blur-3xl" />
            <img src={SITE.logoUrl} alt="BMB" className="relative h-64 w-64 rounded-full ring-8 ring-accent/40 md:h-80 md:w-80" />
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-16 md:grid-cols-3">
        {[
          { icon: Utensils, title: "100+ items", body: "Sweets, dosas, pizzas, burgers, chaat, shakes & more — all under one roof." },
          { icon: Clock, title: "Open daily", body: SITE.hours },
          { icon: MapPin, title: "Find us", body: SITE.address },
        ].map(({ icon: Icon, title, body }) => (
          <div key={title} className="rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:shadow-md">
            <Icon className="h-6 w-6 text-primary" />
            <h3 className="mt-4 font-display text-xl">{title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{body}</p>
          </div>
        ))}
      </section>

      {/* Featured categories */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-accent">Explore</p>
            <h2 className="mt-2 font-display text-3xl md:text-4xl">A taste of every craving</h2>
          </div>
          <Link to="/menu" className="hidden text-sm font-medium text-primary hover:underline md:inline">See full menu →</Link>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {["Sweets","Dosa","Pizza","Burger","Momos","Chaat","Shakes","Wraps"].map((c) => (
            <Link key={c} to="/menu" className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 text-center transition hover:border-accent hover:shadow-lg">
              <div className="font-display text-xl text-primary group-hover:text-accent-foreground">{c}</div>
              <div className="mt-1 text-xs text-muted-foreground">Tap to view</div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA banner */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="overflow-hidden rounded-3xl border border-accent/40 bg-gradient-to-br from-accent/20 via-background to-accent/10 p-10 text-center md:p-14">
          <h2 className="font-display text-3xl text-primary md:text-4xl">Dining in? Scan the QR on your table.</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">Browse the menu, add items to your cart, and your order is sent straight to the kitchen — no waiting for the waiter.</p>
          <Link to="/menu" className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90">
            Browse the menu <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
