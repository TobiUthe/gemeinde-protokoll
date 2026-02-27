import Link from "next/link";
import { db } from "@/lib/db";
import { municipalities, documents } from "@protokolbase/db/schema";
import { count, sql, eq, desc } from "drizzle-orm";
import { FileText, Search, Bell, ArrowRight, Building2, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

// Force dynamic rendering — don't try DB queries at build time
export const dynamic = "force-dynamic";

async function getStats() {
  try {
    const [muniCount] = await db.select({ value: count() }).from(municipalities);
    const [docCount] = await db.select({ value: count() }).from(documents);
    const topMunis = await db
      .select({
        id: municipalities.id,
        name: municipalities.name,
        canton: municipalities.canton,
        population: municipalities.population,
      })
      .from(municipalities)
      .orderBy(desc(municipalities.population))
      .limit(8);
    return { municipalities: muniCount.value, documents: docCount.value, topMunis };
  } catch {
    return { municipalities: 2100, documents: 0, topMunis: [] };
  }
}

export default async function Home() {
  const stats = await getStats();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-border/40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <span className="font-bold text-lg tracking-tight">ProtokolBase</span>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Sign in
            </Link>
            <Link href="/register">
              <Button size="sm">Get started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-sm font-medium text-primary mb-4 tracking-wide uppercase">
            Swiss Municipal Transparency
          </p>
          <h1 className="text-5xl font-bold tracking-tight text-foreground leading-tight mb-6">
            Municipal protocols,
            <br />
            searchable and structured
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
            Access decisions, votes, and financial data from {stats.municipalities.toLocaleString()}+ Swiss
            municipalities. Structured, searchable, and always up to date.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="gap-2">
                Start searching <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg">
                Sign in
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border/40 bg-muted/30">
        <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-3 gap-8">
          {[
            { label: "Municipalities", value: stats.municipalities.toLocaleString() + "+" },
            { label: "Documents indexed", value: stats.documents.toLocaleString() + "+" },
            { label: "Cantons covered", value: "26" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-bold text-foreground">{stat.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-16 tracking-tight">
            Everything you need to follow Swiss municipal decisions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Search,
                title: "Full-text search",
                desc: "Search across all protocols by topic, entity, or keyword. Filter by canton, municipality, date, or decision type.",
              },
              {
                icon: FileText,
                title: "Structured data",
                desc: "AI-extracted agenda items, decisions, votes, financial figures, and named entities from every protocol.",
              },
              {
                icon: Bell,
                title: "Notifications",
                desc: "Get alerts when new protocols match your interests. Track specific municipalities, topics, or entities.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="p-6 rounded-lg border border-border/60 bg-white">
                <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center mb-4">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Top municipalities */}
      {stats.topMunis.length > 0 && (
        <section className="py-16 px-6 bg-muted/30 border-t border-border/40">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-lg font-semibold mb-8">Covered municipalities</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {stats.topMunis.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-3 p-3 rounded-md bg-white border border-border/60"
                >
                  <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <div className="text-sm font-medium">{m.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {m.canton}
                      {m.population ? ` · ${m.population.toLocaleString()}` : ""}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-border/40 py-12 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span>ProtokolBase</span>
          </div>
          <div>Swiss municipal protocol aggregation platform</div>
        </div>
      </footer>
    </div>
  );
}
