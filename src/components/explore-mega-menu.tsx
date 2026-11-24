import Link from "next/link";
import { exploreLinks, sections } from "@/config/site";
import { articles } from "@/content/articles";
import { ActionArrow } from "./action-arrow";
import { PublicationCard } from "./publication-card";

export function ExploreMegaMenu() {
  return (
    <div className="page-container mega-inner">
      <ul>
        {exploreLinks.map(({ href, title }) => (
          <li key={href}>
            <Link href={href} className="mega-link">
              {title}
              {href === sections.research.href && <ActionArrow />}
            </Link>
          </li>
        ))}
        {[sections.publications, sections.multimedia, sections.sources].map(
          ({ href, title }) => (
            <li key={href} className="mobile-link">
              <Link href={href} className="mega-link">
                {title}
              </Link>
            </li>
          ),
        )}
      </ul>
      <section
        className="mega-recommended"
        aria-labelledby="recommended-materials-title"
      >
        <h2
          id="recommended-materials-title"
          className="mb-3 text-xs font-semibold tracking-wider text-neutral-300 uppercase"
        >
          Рекомендуемые исследовательские материалы
        </h2>
        <div className="mega-cards">
          {articles.slice(0, 3).map((article) => (
            <PublicationCard
              key={article.slug}
              article={article}
              variant="menu"
            />
          ))}
        </div>
      </section>
    </div>
  );
}
