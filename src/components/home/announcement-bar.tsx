import Link from "next/link";
import { CmsRegion, cmsView } from "../cms/region";
import { ActionArrow } from "../action-arrow";

export async function AnnouncementBar() {
  const { fields } = await cmsView("/~announcement");
  return (
    <CmsRegion name="/~announcement">
      <aside
        aria-label="Тема исследования"
        className="announcement [--focus-color:var(--color-masthead-focus)]"
      >
        <div className="page-container announcement-inner">
          <p className="flex flex-wrap items-baseline gap-x-4 gap-y-0.5 text-sm">
            <strong>{fields.headline}</strong>
            <span className="text-white/85">{fields.subtitle}</span>
          </p>
          <Link href={fields.href} className="action-link text-sm">
            {fields.button} <ActionArrow />
          </Link>
        </div>
      </aside>
    </CmsRegion>
  );
}
