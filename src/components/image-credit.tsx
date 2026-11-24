import type { ImageAsset } from "@/content/images";

export function ImageCredit({ asset }: { asset: ImageAsset }) {
  return (
    <>
      {asset.creator} ·{" "}
      {asset.licenseUrl ? (
        <a href={asset.licenseUrl} className="underline underline-offset-2">
          {asset.license}
        </a>
      ) : (
        asset.license
      )}{" "}
      ·{" "}
      <a href={asset.sourceUrl} className="underline underline-offset-2">
        Источник изображения
      </a>
    </>
  );
}
