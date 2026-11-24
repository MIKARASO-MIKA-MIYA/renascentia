import { ImageCredit } from "@/components/image-credit";
import { ResourceList } from "@/components/resource-list";
import { SectionPage } from "@/components/section-page";
import { sections } from "@/config/site";
import { images } from "@/content/images";
import { collectionsGuide } from "@/content/section-guides";
import { cmsPageMetadata } from "@/lib/seo";
import { CmsRegion, cmsView } from "@/components/cms/region";
import { assetWithFields } from "@/lib/cms/registry";

export const generateMetadata = () => cmsPageMetadata(sections.sources);

export default async function SourcesPage() {
  const { fields } = await cmsView("/sources~images");
  return (
    <SectionPage
      section={sections.sources}
      replace
      after={
        <CmsRegion name="/sources~images">
          <section id="images" className="mt-9">
            <h2 className="mb-3 text-xl font-extrabold">
              Источники изображений
            </h2>
            <p className="mb-5 max-w-[65ch] text-sm text-muted">
              Файлы уменьшены и переведены в WebP. Фрагмент фрески «Афинская
              школа» и изображение бюста Платона кадрированы.
            </p>
            <ul className="grid max-w-5xl gap-4 sm:grid-cols-2">
              {Object.values(images).map((original) => {
                const asset = assetWithFields(original, fields);
                return (
                  <li key={asset.src} className="border-t border-border pt-3">
                    <p className="font-extrabold">{asset.title}</p>
                    <p className="mt-1 text-sm text-muted">
                      <ImageCredit asset={asset} />
                    </p>
                  </li>
                );
              })}
            </ul>
          </section>
        </CmsRegion>
      }
    >
      <section className="mt-9">
        <h2 className="mb-4 text-xl font-extrabold">
          Исторические и академические источники
        </h2>
        <ResourceList items={collectionsGuide} />
      </section>
    </SectionPage>
  );
}
