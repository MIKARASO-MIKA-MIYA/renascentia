import { SectionPage } from "@/components/section-page";
import { sections } from "@/config/site";
import { cmsPageMetadata } from "@/lib/seo";

const events = [
  {
    date: "1436",
    title: "Завершение свода флорентийского собора",
    description:
      "Купол Филиппо Брунеллески завершил основной объём флорентийского собора.",
    href: "https://duomo.firenze.it/en/discover/dome",
  },
  {
    date: "Середина 1450-х",
    title: "Библия Гутенберга",
    description:
      "Ранняя европейская печатная книга, изготовленная с использованием подвижных металлических литер.",
    href: "https://www.loc.gov/item/2021666734/",
  },
  {
    date: "1508–1511",
    title: "Рафаэль расписывает Станцу делла Сеньятура",
    description:
      "«Афинская школа» посвящена философии и входит в ансамбль росписей комнаты.",
    href: "https://www.museivaticani.va/content/museivaticani/it/collezioni/musei/stanze-di-raffaello/stanza-della-segnatura/stanza-della-segnatura.html",
  },
];

export const generateMetadata = () => cmsPageMetadata(sections.timeline);

export default function TimelinePage() {
  return (
    <SectionPage section={sections.timeline}>
      <ol className="mt-8 max-w-3xl divide-y divide-border border-y border-border">
        {events.map(({ date, title, description, href }) => (
          <li key={date} className="grid gap-2 py-5 sm:grid-cols-[9.5rem_1fr]">
            <p className="font-extrabold">{date}</p>
            <div>
              <h2 className="font-extrabold">{title}</h2>
              <p className="mt-1 text-sm text-muted">{description}</p>
              <a href={href} className="text-link mt-2 inline-block text-sm">
                Исторический источник
              </a>
            </div>
          </li>
        ))}
      </ol>
    </SectionPage>
  );
}
