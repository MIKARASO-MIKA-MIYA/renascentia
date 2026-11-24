import Link from "next/link";
import { SectionPage } from "@/components/section-page";
import { sections } from "@/config/site";
import { aboutText } from "@/lib/cms/registry";
import { cmsPageMetadata } from "@/lib/seo";

export const generateMetadata = () => cmsPageMetadata(sections.about);

export default function AboutPage() {
  return (
    <SectionPage
      section={sections.about}
      replace
      after={
        <section id="site-map" className="mt-9 max-w-3xl">
          <h2 className="mb-3 text-xl font-extrabold">Карта сайта</h2>
          <ul className="grid gap-x-6 gap-y-3 border-t border-border pt-4 sm:grid-cols-2">
            {[{ href: "/", title: "Главная" }, ...Object.values(sections)].map(
              ({ href, title }) => (
                <li key={href}>
                  <Link href={href} className="text-link">
                    {title}
                  </Link>
                </li>
              ),
            )}
          </ul>
        </section>
      }
    >
      <p className="mt-7 max-w-[65ch]">{aboutText}</p>
    </SectionPage>
  );
}
