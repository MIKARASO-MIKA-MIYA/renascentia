import { galleryImages } from "@/content/home";
import { images } from "@/content/images";
import { assetWithFields } from "@/lib/cms/registry";
import { CmsRegion, cmsView } from "../cms/region";
import { ImageViewer } from "../image-viewer";

export async function ImageGallery({
  inArchive = false,
}: {
  inArchive?: boolean;
}) {
  const [{ fields }, { fields: pictureFields }] = await Promise.all([
    cmsView("/~gallery"),
    cmsView("/sources~images"),
  ]);
  return (
    <section
      id="gallery"
      className={`page-container ${inArchive ? "pb-[var(--page-space)]" : "pb-[var(--page-space)] pt-2"}`}
      aria-labelledby="gallery-heading"
    >
      <CmsRegion name="/~gallery">
        <h2 id="gallery-heading" className="section-title mb-6">
          Историческая галерея
        </h2>
        <ImageViewer
          entries={galleryImages.map(({ image }, index) => ({
            label: fields[index + ".label"],
            asset: assetWithFields(
              images[image],
              pictureFields,
              fields[index + ".image"],
            ),
          }))}
        />
      </CmsRegion>
    </section>
  );
}
