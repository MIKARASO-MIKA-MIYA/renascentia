import Link from "next/link";
import { sections } from "@/config/site";
import { programs } from "@/content/programs";
import { ActionArrow } from "../action-arrow";

export function AnnouncementBar() {
  return (
    <aside
      aria-label="Тема исследования"
      className="announcement [--focus-color:var(--color-masthead-focus)]"
    >
      <div className="page-container announcement-inner">
        <p className="flex flex-wrap items-baseline gap-x-4 gap-y-0.5 text-sm">
          <strong>Философия эпохи Возрождения</strong>
          <span className="text-white/85">
            XIV–XVI века · {programs.length} программ
          </span>
        </p>
        <Link href={sections.research.href} className="action-link text-sm">
          Каталог программ <ActionArrow />
        </Link>
      </div>
    </aside>
  );
}
