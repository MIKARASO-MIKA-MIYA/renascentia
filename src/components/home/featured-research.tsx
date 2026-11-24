import Link from "next/link";
import { sections } from "@/config/site";
import { articles } from "@/content/articles";
import { ActionArrow } from "../action-arrow";
import { PublicationCard } from "../publication-card";

export function FeaturedResearch() {
  return (
    <section
      className="page-container page-spacing"
      aria-labelledby="featured-research"
    >
      <div className="section-row">
        <h2 id="featured-research" className="section-title">
          Главные исследования
        </h2>
        <Link href={sections.publications.href} className="action-link">
          Все публикации <ActionArrow />
        </Link>
      </div>
      <div className="editorial-grid">
        {articles.slice(0, 4).map((article) => (
          <PublicationCard
            key={article.slug}
            article={article}
            variant="feature"
          />
        ))}
      </div>
      <ul className="mt-7 grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
        {articles.slice(4).map((article) => (
          <li key={article.slug}>
            <PublicationCard article={article} variant="compact" />
          </li>
        ))}
      </ul>
    </section>
  );
}
