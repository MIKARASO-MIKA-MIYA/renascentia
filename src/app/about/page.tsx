import Link from "next/link";
import { SectionPage } from "@/components/section-page";
import { sections } from "@/config/site";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(sections.about);

export default function AboutPage() {
  return (
    <SectionPage section={sections.about}>
      <p className="mt-7 max-w-[65ch]">
        Восемь программ объединяют исследовательские вопросы, статьи и
        исторические источники. Для музейных объектов и репродукций указаны
        происхождение и условия использования.
      </p>
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
    </SectionPage>
  );
}
