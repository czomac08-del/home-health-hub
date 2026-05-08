import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { Home, Calendar, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import SEO from "@/components/SEO";
import ThemeToggle from "@/components/ThemeToggle";

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  meta_description: string;
  content: string;
  author: string;
  category: string;
  read_time_minutes: number;
  published_at: string | null;
  featured_image_url: string | null;
}

const categoryLabel: Record<string, string> = {
  permits: "Permits",
  safety: "Safety",
  maintenance: "Maintenance",
  rural: "Rural",
  "buying-selling": "Buying & Selling",
};

const BlogPostPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [related, setRelated] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setNotFound(false);
    (async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .eq("published", true)
        .maybeSingle();
      if (error || !data) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setPost(data as any);

      const { data: rel } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("published", true)
        .eq("category", (data as any).category)
        .neq("id", (data as any).id)
        .order("published_at", { ascending: false })
        .limit(2);
      setRelated((rel as any) || []);
      setLoading(false);
      window.scrollTo(0, 0);
    })();
  }, [slug]);

  // Split content for mid-article CTA after the 3rd paragraph.
  const { firstHalf, secondHalf } = useMemo(() => {
    if (!post?.content) return { firstHalf: "", secondHalf: "" };
    const blocks = post.content.split(/\n\n+/);
    if (blocks.length <= 4) return { firstHalf: post.content, secondHalf: "" };
    return {
      firstHalf: blocks.slice(0, 3).join("\n\n"),
      secondHalf: blocks.slice(3).join("\n\n"),
    };
  }, [post?.content]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground text-sm">
        Loading…
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <h1 className="text-2xl font-heading font-black text-foreground mb-2">Post not found</h1>
        <p className="text-sm text-muted-foreground mb-6">This article doesn't exist or hasn't been published yet.</p>
        <button onClick={() => navigate("/blog")} className="text-sm font-heading font-extrabold text-primary hover:underline">
          ← Back to the blog
        </button>
      </div>
    );
  }

  const publishedISO = post.published_at || new Date().toISOString();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.meta_description,
    author: { "@type": "Organization", name: "ComingHomeIQ" },
    publisher: {
      "@type": "Organization",
      name: "ComingHomeIQ",
      url: "https://cominghomeiq.com",
    },
    datePublished: publishedISO,
    image: post.featured_image_url || "https://cominghomeiq.com/og-image.png",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://cominghomeiq.com/blog/${post.slug}`,
    },
  };

  return (
    <div className="min-h-screen pb-20">
      <SEO
        title={`${post.title} — ComingHomeIQ`}
        description={post.meta_description}
        path={`/blog/${post.slug}`}
        type="article"
        jsonLd={jsonLd}
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
          <button onClick={() => navigate("/blog")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Blog</button>
          <button onClick={() => navigate("/pricing")} className="hidden sm:inline text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</button>
          <ThemeToggle />
          <button onClick={() => navigate("/auth")} className="text-sm font-heading font-extrabold bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:opacity-90 transition-opacity glow-orange">
            Get Started
          </button>
        </div>
      </nav>

      {/* Article */}
      <article className="max-w-2xl mx-auto px-6 pt-6">
        <button
          onClick={() => navigate("/blog")}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Back to the blog
        </button>

        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] font-heading font-black uppercase tracking-wider bg-primary/15 text-primary px-2.5 py-1 rounded-full">
            {categoryLabel[post.category] || post.category}
          </span>
        </div>

        <h1 className="text-3xl md:text-4xl font-heading font-black text-foreground mb-4 leading-tight">
          {post.title}
        </h1>

        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-8">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> {post.read_time_minutes} min read
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {post.published_at
              ? new Date(post.published_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
              : ""}
          </span>
        </div>

        {post.featured_image_url && (
          <img
            src={post.featured_image_url}
            alt={post.title}
            className="w-full rounded-2xl mb-8 object-cover max-h-[420px]"
          />
        )}

        <div className="prose prose-sm md:prose-base max-w-none dark:prose-invert prose-headings:font-heading prose-headings:font-black prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-3 prose-p:text-foreground/90 prose-li:text-foreground/90 prose-strong:text-foreground prose-a:text-primary">
          <ReactMarkdown>{firstHalf}</ReactMarkdown>
        </div>

        {/* Inline mid-article CTA */}
        {secondHalf && (
          <div className="my-8 rounded-2xl border-2 border-primary/40 bg-primary/5 p-6 text-center">
            <p className="text-base md:text-lg font-heading font-black text-foreground mb-3">
              Pull your home's public record free at ComingHomeIQ
            </p>
            <button
              onClick={() => navigate("/auth")}
              className="inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground px-5 py-2.5 text-sm font-heading font-extrabold hover:opacity-90 transition-opacity glow-orange"
            >
              Check My Home — Free
            </button>
          </div>
        )}

        {secondHalf && (
          <div className="prose prose-sm md:prose-base max-w-none dark:prose-invert prose-headings:font-heading prose-headings:font-black prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-3 prose-p:text-foreground/90 prose-li:text-foreground/90 prose-strong:text-foreground prose-a:text-primary">
            <ReactMarkdown>{secondHalf}</ReactMarkdown>
          </div>
        )}

        {/* Author byline */}
        <div className="mt-10 pt-6 border-t border-border flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center">
            <Home className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-heading font-black text-foreground">{post.author}</p>
            <p className="text-xs text-muted-foreground">Independent home intelligence platform</p>
          </div>
        </div>
      </article>

      {/* Related Articles */}
      {related.length > 0 && (
        <section className="max-w-2xl mx-auto px-6 mt-12">
          <h2 className="text-sm font-heading font-bold uppercase tracking-wider text-muted-foreground mb-4">Related</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {related.map((r) => (
              <button
                key={r.id}
                onClick={() => navigate(`/blog/${r.slug}`)}
                className="text-left rounded-xl border border-border bg-card p-4 hover:border-primary/40 transition-colors"
              >
                <p className="text-[10px] font-heading font-black uppercase tracking-wider text-primary mb-2">
                  {categoryLabel[r.category] || r.category}
                </p>
                <p className="text-sm font-heading font-black text-foreground mb-2 leading-snug">{r.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">{r.meta_description}</p>
                <span className="inline-flex items-center gap-1 text-xs font-heading font-extrabold text-primary mt-3">
                  Read <ChevronRight className="h-3.5 w-3.5" />
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Bottom CTA */}
      <section className="max-w-3xl mx-auto px-6 mt-14">
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

export default BlogPostPage;