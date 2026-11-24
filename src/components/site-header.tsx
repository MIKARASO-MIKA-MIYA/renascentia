import { sections } from "@/config/site";
import { articles } from "@/content/articles";
import { materialHref } from "@/lib/materials";
import { Brand } from "./brand";
import { ExploreMegaMenu } from "./explore-mega-menu";
import { HeaderNavigation } from "./header-navigation";
import { NavigationDropdown } from "./navigation-dropdown";
import { SearchBar } from "./search-bar";

export function SiteHeader() {
  const dropdowns = [
    {
      id: "publications",
      title: sections.publications.title,
      content: (
        <NavigationDropdown
          links={[
            { href: sections.publications.href, title: "Все публикации" },
            ...articles.slice(0, 2).map(({ slug, title }) => ({
              href: materialHref("publications", slug),
              title,
            })),
          ]}
        />
      ),
    },
    {
      id: "multimedia",
      title: sections.multimedia.title,
      content: (
        <NavigationDropdown
          links={[
            sections.multimedia,
            {
              href: "/multimedia#featured-video",
              title: "Рекомендуемое видео",
            },
            { href: "/archive#gallery", title: "Историческая галерея" },
          ]}
        />
      ),
    },
    {
      id: "about",
      title: sections.about.title,
      content: (
        <NavigationDropdown
          links={[sections.about, sections.team, sections.sources]}
        />
      ),
    },
  ];

  return (
    <HeaderNavigation
      brand={<Brand />}
      search={<SearchBar compact />}
      explore={<ExploreMegaMenu />}
      dropdowns={dropdowns}
    />
  );
}
