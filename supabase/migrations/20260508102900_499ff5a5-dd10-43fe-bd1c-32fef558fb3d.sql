
CREATE TABLE public.blog_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  meta_description TEXT NOT NULL,
  content TEXT NOT NULL,
  author TEXT NOT NULL DEFAULT 'ComingHomeIQ Team',
  published_at TIMESTAMPTZ,
  published BOOLEAN NOT NULL DEFAULT false,
  category TEXT NOT NULL,
  featured_image_url TEXT,
  read_time_minutes INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_blog_posts_published ON public.blog_posts (published, published_at DESC);
CREATE INDEX idx_blog_posts_category ON public.blog_posts (category);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published blog posts"
  ON public.blog_posts FOR SELECT
  USING (published = true);

CREATE POLICY "Admins can read all blog posts"
  ON public.blog_posts FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert blog posts"
  ON public.blog_posts FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update blog posts"
  ON public.blog_posts FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete blog posts"
  ON public.blog_posts FOR DELETE
  USING (public.is_admin(auth.uid()));

CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
