import Link from "next/link";
import { sections } from "@/config/site";
import { articles } from "@/content/articles";
import { images, type ImageKey } from "@/content/images";
import { assetWithFields } from "@/lib/cms/registry";
import { publishedEntries } from "@/lib/cms/data";
import { plainText } from "@/lib/cms/schema";
import { ActionArrow } from "../action-arrow";
import { PublicationCard } from "../publication-card";
import { CmsRegion, cmsView } from "../cms/region";

export async function FeaturedResearch() {
  const [{ fields }, { fields: pictureFields }, edited] = await Promise.all([
    cmsView("/~featured"),
    cmsView("/sources~images"),
    publishedEntries(),
  ]);
  const entries = new Map(
    edited
      .filter(({ kind }) => kind === "publication")
      .map(({ key, body }) => [key, body]),
  );
  const pinned = articles.map((fallback, index) => {
    const slug = fields["article." + index];
    const original = articles.find((article) => article.slug === slug);
    const change = entries.get("/publications/" + slug);
    const baseline = original ?? fallback;
    const imageKey: ImageKey =
      original?.imageKey ?? (change ? "manuscript" : fallback.imageKey);
    return {
      article: change
        ? {
            slug,
            imageKey,
            title: change.title,
            category:
              change.fields.category || original?.category || "Публикация",
            body: change.blocks.map(({ doc }) => plainText(doc)),
          }
        : baseline,
      asset: assetWithFields(
        images[imageKey],
        pictureFields,
        change?.fields.cover ??
          change?.blocks.find(({ images }) => images?.length)?.images?.[0]?.url,
      ),
    };
  });
  return (
    <CmsRegion name="/~featured">
      <section
        className="page-container page-spacing"
        aria-labelledby="featured-research"
      >
        <div className="section-row">
          <h2 id="featured-research" className="section-title">
            {fields.headline}
          </h2>
          <Link href={sections.publications.href} className="action-link">
            Все публикации <ActionArrow />
          </Link>
        </div>
        <div className="editorial-grid">
          {pinned.slice(0, 4).map(({ article, asset }, index) => (
            <PublicationCard
              key={index + ":" + article.slug}
              article={article}
              variant="feature"
              asset={asset}
            />
          ))}
        </div>
        <ul className="mt-7 grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
          {pinned.slice(4).map(({ article, asset }, index) => (
            <li key={index + ":" + article.slug}>
              <PublicationCard
                article={article}
                variant="compact"
                asset={asset}
              />
            </li>
          ))}
        </ul>
      </section>
    </CmsRegion>
  );
}
