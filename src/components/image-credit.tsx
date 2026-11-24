import type { ImageAsset } from "@/content/images";

export function ImageCredit({ asset }: { asset: ImageAsset }) {
  if (!asset.creator && !asset.license && !asset.sourceUrl) return null;
  return (
    <>
      {asset.creator}
      {asset.creator && (asset.license || asset.sourceUrl) && " · "}
      {asset.licenseUrl ? (
        <a href={asset.licenseUrl} className="underline underline-offset-2">
          {asset.license}
        </a>
      ) : (
        asset.license
      )}
      {asset.license && asset.sourceUrl && " · "}
      {asset.sourceUrl && (
        <a href={asset.sourceUrl} className="underline underline-offset-2">
          Источник изображения
        </a>
      )}
    </>
  );
}
