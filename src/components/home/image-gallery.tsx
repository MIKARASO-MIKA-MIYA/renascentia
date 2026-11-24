import { galleryImages } from "@/content/home";
import { images } from "@/content/images";
import { ImageViewer } from "../image-viewer";

export function ImageGallery({ inArchive = false }: { inArchive?: boolean }) {
  return (
    <section
      id="gallery"
      className={`page-container ${inArchive ? "pb-[var(--page-space)]" : "pb-[var(--page-space)] pt-2"}`}
      aria-labelledby="gallery-heading"
    >
      <h2 id="gallery-heading" className="section-title mb-6">
        Историческая галерея
      </h2>
      <ImageViewer
        entries={galleryImages.map(({ label, image }) => ({
          label,
          asset: images[image],
        }))}
      />
    </section>
  );
}
