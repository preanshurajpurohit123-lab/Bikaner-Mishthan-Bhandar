import { Link } from "@tanstack/react-router";
import { ShoppingBag, Menu as MenuIcon, X } from "lucide-react";
import { useState } from "react";
import { SITE } from "@/lib/site";
import { useCart } from "@/lib/cart";

export function SiteHeader() {
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-3">
          <img src={SITE.logoUrl} alt="BMB logo" className="h-10 w-10 rounded-full ring-2 ring-accent/60" />
          <div className="leading-tight">
            <div className="font-display text-base font-semibold text-primary">Bikaner Mishthan</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Bhandar · Batala</div>
          </div>
        </Link>
        <nav className="hidden gap-7 text-sm font-medium md:flex">
          <Link to="/" className="hover:text-primary">Home</Link>
          <Link to="/menu" className="hover:text-primary">Menu</Link>
          <a href="#contact" className="hover:text-primary">Contact</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/cart" className="relative inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90">
            <ShoppingBag className="h-4 w-4" />
            <span className="hidden sm:inline">Cart</span>
            {count > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">{count}</span>
            )}
          </Link>
          <button onClick={() => setOpen((v) => !v)} className="rounded-md p-2 md:hidden" aria-label="Menu">
            {open ? <X className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-border/60 bg-background md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3">
            <Link to="/" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 hover:bg-muted">Home</Link>
            <Link to="/menu" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 hover:bg-muted">Menu</Link>
            <a href="#contact" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 hover:bg-muted">Contact</a>
          </div>
        </div>
      )}
    </header>
  );
}
