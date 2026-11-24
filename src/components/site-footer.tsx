import Link from "next/link";
import { footerGroups, site } from "@/config/site";
import { Brand } from "./brand";
import { CmsRegion, cmsView } from "./cms/region";

export async function SiteFooter() {
  const { fields } = await cmsView("/~footer");
  return (
    <footer className="bg-black text-white [--focus-color:var(--color-masthead-focus)]">
      <CmsRegion name="/~footer">
        <div className="page-container grid gap-x-9 gap-y-8 py-12 sm:grid-cols-2 lg:grid-cols-[1.45fr_1fr_1fr_1fr]">
          <div>
            <Brand />
            <p className="mt-5 max-w-72 text-sm leading-relaxed text-neutral-300">
              {fields.summary}
            </p>
          </div>
          {footerGroups.map(({ title, links }, index) => (
            <nav key={title} aria-label={fields[index + ".title"]}>
              <h2 className="mb-2 font-extrabold">
                {fields[index + ".title"]}
              </h2>
              <ul className="space-y-1 text-sm text-neutral-300">
                {links.map(({ href }, item) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="inline-flex min-h-8 items-center hover:underline"
                    >
                      {fields[index + "." + item]}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </CmsRegion>
      <div className="border-t border-masthead-border">
        <p className="page-container py-4 text-xs text-neutral-300">
          RENASCENTIA · Версия {site.version}
        </p>
      </div>
    </footer>
  );
}
