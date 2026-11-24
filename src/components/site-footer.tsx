import Link from "next/link";
import { footerGroups, site } from "@/config/site";
import { Brand } from "./brand";

export function SiteFooter() {
  return (
    <footer className="bg-black text-white [--focus-color:var(--color-masthead-focus)]">
      <div className="page-container grid gap-x-9 gap-y-8 py-12 sm:grid-cols-2 lg:grid-cols-[1.45fr_1fr_1fr_1fr]">
        <div>
          <Brand />
          <p className="mt-5 max-w-72 text-sm leading-relaxed text-neutral-300">
            {site.description}
          </p>
        </div>
        {footerGroups.map(({ title, links }) => (
          <nav key={title} aria-label={title}>
            <h2 className="mb-2 font-extrabold">{title}</h2>
            <ul className="space-y-1 text-sm text-neutral-300">
              {links.map(({ href, title }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="inline-flex min-h-8 items-center hover:underline"
                  >
                    {title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-masthead-border">
        <p className="page-container py-4 text-xs text-neutral-300">
          RENASCENTIA · Версия {site.version}
        </p>
      </div>
    </footer>
  );
}
