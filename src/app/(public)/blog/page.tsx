import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarDays, Clock3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BLOG_POSTS } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog — Tips Mengelola Keuangan Pribadi",
  description:
    "Artikel dan panduan praktis seputar cara mengelola keuangan pribadi, menyusun anggaran bulanan, menabung, dan memaksimalkan aplikasi pencatat keuangan.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Blog Elbimas — Tips Mengelola Keuangan Pribadi",
    description:
      "Panduan praktis seputar keuangan pribadi, anggaran bulanan, dan kebiasaan finansial sehat.",
    url: "/blog",
  },
  robots: { index: true, follow: true },
};

function formatDateId(dateStr: string) {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function BlogPage() {
  const posts = [...BLOG_POSTS].sort((a, b) =>
    b.publishedAt.localeCompare(a.publishedAt)
  );

  return (
    <>
      <section className="border-b bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-20">
          <h1 className="font-heading max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
            Blog Elbimas
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            Panduan praktis mengelola keuangan pribadi — dari menyusun anggaran
            sampai membangun kebiasaan finansial yang bertahan.
          </p>
        </div>
      </section>

      <section className="py-14 md:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-6 md:grid-cols-3">
            {posts.map((post) => (
              <article
                key={post.slug}
                className="flex flex-col rounded-2xl border bg-card p-6 transition-shadow hover:shadow-md"
              >
                <Badge variant="secondary" className="w-fit">
                  {post.tag}
                </Badge>
                <h2 className="font-heading mt-3 text-xl font-semibold leading-snug">
                  <Link
                    href={`/blog/${post.slug}`}
                    className="hover:text-primary"
                  >
                    {post.title}
                  </Link>
                </h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {post.description}
                </p>
                <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="size-3.5" aria-hidden="true" />
                    <time dateTime={post.publishedAt}>
                      {formatDateId(post.publishedAt)}
                    </time>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock3 className="size-3.5" aria-hidden="true" />
                    {post.readingMinutes} menit baca
                  </span>
                </div>
                <p className="mt-4">
                  <Link
                    href={`/blog/${post.slug}`}
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Baca artikel
                    <ArrowRight className="size-3.5" aria-hidden="true" />
                  </Link>
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
