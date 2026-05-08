import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Home, Calendar, Clock, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import SEO from "@/components/SEO";
import ThemeToggle from "@/components/ThemeToggle";

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  meta_description: string;
  category: string;
  read_time_minutes: number;
  published_at: string | null;
  featured_image_url: string | null;
  author: string;
}

const categoryLabel: Record<string, string> = {
  permits: "Permits",
  safety: "Safety",
  maintenance: "Maintenance",
  rural: "Rural",
  "buying-selling": "Buying & Selling",
};

const BlogIndexPage = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("blog_posts")
        .select("id,slug,title,meta_description,category,read_time_minutes,published_at,featured_image_url,author")
        .eq("published", true)
        .order("published_at", { ascending: false });
      setPosts((data as any) || []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen pb-20">
      <SEO
        title="The Home Intelligence Blog | ComingHomeIQ"
        description="Guides, records, and real information for homeowners who want to know their home. Permits, safety, rural property, buying and selling."
        path="/blog"
      />

      {/* Nav */}
      <nav className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <button onClick={() => navigate("/")} className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-primary/20 flex items-center justify-center">
            <Home className="h-5 w-5 text-primary" />
          </div>
          <span className="text-lg font-heading font-black text-foreground">
            Coming Home<span className="text-primary">IQ</span>
          </span>
        </button>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/pricing")} className="hidden sm:inline text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</button>
          <ThemeToggle />
          <button onClick={() => navigate("/auth")} className="text-sm font-heading font-extrabold bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:opacity-90 transition-opacity glow-orange">
            Get Started
          </button>
        </div>
      </nav>

      {/* Header */}
      <header className="text-center px-6 pt-10 pb-12 max-w-3xl mx-auto">
        <h1 className="text-3xl md:text-5xl font-heading font-black text-foreground mb-4 leading-tight">
          The Home Intelligence Blog
        </h1>
        <p className="text-base md:text-lg text-muted-foreground">
          Guides, records, and real information for homeowners who want to know their home.
        </p>
      </header>

      {/* Posts */}
      <section className="max-w-5xl mx-auto px-6">
        {loading ? (
          <p className="text-center text-muted-foreground text-sm py-12">Loading posts…</p>
        ) : posts.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-12">No posts yet — check back soon.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {posts.map((p) => (
              <article
                key={p.id}
                className="rounded-2xl border border-border bg-card p-6 flex flex-col hover:border-primary/40 transition-colors"
              >
                {p.featured_image_url && (
                  <img
                    src={p.featured_image_url}
                    alt={p.title}
                    loading="lazy"
                    className="w-full h-40 object-cover rounded-xl mb-4"
                  />
                )}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-heading font-black uppercase tracking-wider bg-primary/15 text-primary px-2.5 py-1 rounded-full">
                    {categoryLabel[p.category] || p.category}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Clock className="h-3 w-3" /> {p.read_time_minutes} min read
                  </span>
                </div>
                <h2 className="text-xl font-heading font-black text-foreground mb-2 leading-snug">
                  <button onClick={() => navigate(`/blog/${p.slug}`)} className="text-left hover:text-primary transition-colors">
                    {p.title}
                  </button>
                </h2>
                <p className="text-sm text-muted-foreground flex-1 mb-4">{p.meta_description}</p>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {p.published_at ? new Date(p.published_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : ""}
                  </span>
                  <button
                    onClick={() => navigate(`/blog/${p.slug}`)}
                    className="text-sm font-heading font-extrabold text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Read More <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Bottom CTA */}
      <section className="max-w-3xl mx-auto px-6 mt-16">
        <div className="rounded-2xl bg-primary text-primary-foreground p-8 text-center">
          <h2 className="text-xl md:text-2xl font-heading font-black mb-3">
            Check your home's permit history free
          </h2>
          <p className="text-sm text-primary-foreground/85 mb-5">
            Pull your home's public record in under a minute. No credit card.
          </p>
          <button
            onClick={() => navigate("/auth")}
            className="inline-flex items-center justify-center rounded-xl bg-primary-foreground text-primary px-6 py-3 text-sm font-heading font-extrabold hover:opacity-90 transition-opacity"
          >
            Check My Home — No Credit Card
          </button>
        </div>
      </section>
    </div>
  );
};

export default BlogIndexPage;