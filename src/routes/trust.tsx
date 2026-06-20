import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteFooter } from "@/components/site-footer";
import { SITE } from "@/lib/site";
import { Shield, Lock, Database, UserCheck, Mail, FileText } from "lucide-react";

export const Route = createFileRoute("/trust")({
  component: TrustPage,
  head: () => ({
    meta: [
      { title: `Trust & Privacy · ${SITE.short}` },
      {
        name: "description",
        content: `How ${SITE.short} handles customer data, orders, and account security.`,
      },
      { property: "og:title", content: `Trust & Privacy · ${SITE.short}` },
      {
        property: "og:description",
        content: `How ${SITE.short} handles customer data, orders, and account security.`,
      },
    ],
  }),
});

function Section({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
      <div className="mb-3 flex items-center gap-3">
        <span className="rounded-full bg-accent/15 p-2 text-accent"><Icon className="h-5 w-5" /></span>
        <h2 className="font-display text-xl">{title}</h2>
      </div>
      <div className="space-y-2 text-sm text-muted-foreground">{children}</div>
    </section>
  );
}

function TrustPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link to="/" className="font-display text-lg">{SITE.short}</Link>
          <Link to="/menu" className="text-sm text-muted-foreground hover:text-foreground">Back to menu</Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-12">
        <div className="mb-10">
          <h1 className="font-display text-4xl">Trust, Privacy & Security</h1>
          <p className="mt-3 text-muted-foreground">
            This page is maintained by {SITE.short} to answer common questions about how we
            handle your information when you browse the menu, place an order, or contact us.
            It describes current practices and is not an independent certification.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <Section icon={Database} title="What we collect">
            <p>When you place an order we collect your name, phone number, delivery address, and the items in your order so we can prepare and deliver your food.</p>
            <p>Browsing the menu does not require an account.</p>
          </Section>

          <Section icon={UserCheck} title="How we use it">
            <p>Order details are used only to fulfil your order and contact you about it. We do not sell your information to third parties.</p>
          </Section>

          <Section icon={Lock} title="Account security">
            <p>Customer and staff accounts are protected by email-and-password sign-in. Passwords are hashed by our authentication provider — we never see them in plain text.</p>
            <p>Administrative areas are restricted to authorised staff via role-based access controls enforced on the server.</p>
          </Section>

          <Section icon={Shield} title="Data protection">
            <p>Orders are stored in a managed database with row-level access rules. Customers can view their own order via the tracking link issued at checkout; full order history with personal details is only accessible to authorised staff.</p>
            <p>Prices and order totals are calculated on the server to prevent tampering.</p>
          </Section>

          <Section icon={FileText} title="Retention">
            <p>Order records are retained for operational and accounting purposes. If you would like a copy of, or deletion of, your personal data, contact us using the details below.</p>
          </Section>

          <Section icon={Mail} title="Contact">
            <p>For privacy or security questions, reach us at:</p>
            <ul className="ml-4 list-disc">
              <li>Phone: <a className="underline" href={`tel:${SITE.phoneDigits}`}>{SITE.phone}</a></li>
              <li>Address: {SITE.address}</li>
            </ul>
          </Section>
        </div>

        <p className="mt-10 text-xs text-muted-foreground">
          Shared responsibility: {SITE.short} is responsible for the data and practices described above. Our hosting and authentication providers are responsible for the underlying infrastructure security.
        </p>
      </main>

      <SiteFooter />
    </div>
  );
}
