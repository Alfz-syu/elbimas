import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CalendarDays, Clock3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/public/json-ld";
import { BLOG_POSTS, getBlogPost } from "@/lib/blog";
import { SITE_NAME, SITE_URL } from "@/lib/site";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const post = getBlogPost((await params).slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      url: `/blog/${post.slug}`,
      publishedTime: post.publishedAt,
      locale: "id_ID",
      siteName: SITE_NAME,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
    robots: { index: true, follow: true },
  };
}

function formatDateId(dateStr: string) {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function BlogPostPage({ params }: Params) {
  const post = getBlogPost((await params).slug);
  if (!post) notFound();

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: post.title,
          description: post.description,
          datePublished: post.publishedAt,
          inLanguage: "id",
          author: { "@type": "Organization", name: SITE_NAME },
          publisher: { "@type": "Organization", name: SITE_NAME },
          mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Beranda",
              item: SITE_URL,
            },
            {
              "@type": "ListItem",
              position: 2,
              name: "Blog",
              item: `${SITE_URL}/blog`,
            },
            {
              "@type": "ListItem",
              position: 3,
              name: post.title,
              item: `${SITE_URL}/blog/${post.slug}`,
            },
          ],
        }}
      />

      <article className="py-12 md:py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <nav aria-label="Breadcrumb" className="mb-6">
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Semua artikel
            </Link>
          </nav>

          <header>
            <Badge variant="secondary">{post.tag}</Badge>
            <h1 className="font-heading mt-4 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
              {post.title}
            </h1>
            <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="size-4" aria-hidden="true" />
                <time dateTime={post.publishedAt}>
                  {formatDateId(post.publishedAt)}
                </time>
              </span>
              <span className="flex items-center gap-1.5">
                <Clock3 className="size-4" aria-hidden="true" />
                {post.readingMinutes} menit baca
              </span>
            </div>
          </header>

          <div className="mt-8 space-y-5 text-lg leading-relaxed">
            {post.intro.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>

          {post.sections.map((section) => (
            <section key={section.heading} className="mt-10">
              <h2 className="font-heading text-2xl font-semibold tracking-tight">
                {section.heading}
              </h2>
              <div className="mt-4 space-y-4 leading-relaxed">
                {section.paragraphs.map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
                {section.list && (
                  <ul className="list-disc space-y-2 pl-6">
                    {section.list.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          ))}

          <p className="mt-10 leading-relaxed">{post.closing}</p>

          <div className="mt-12 rounded-2xl border bg-muted/40 p-8 text-center">
            <h2 className="font-heading text-xl font-semibold">
              Praktikkan langsung dengan Elbimas
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Aplikasi pengelola keuangan pribadi gratis — catat transaksi,
              atur anggaran, dan pantau semuanya dari satu dashboard.
            </p>
            <div className="mt-5">
              <Button asChild className="h-11 px-6">
                <Link href="/register">
                  Daftar Gratis
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </article>
    </>
  );
}
