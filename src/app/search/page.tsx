import { MaterialList } from "@/components/material-list";
import { SearchBar } from "@/components/search-bar";
import { SectionPage } from "@/components/section-page";
import { sections } from "@/config/site";
import { maxQueryLength, searchMaterials } from "@/lib/search";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({ ...sections.search, indexable: false });

export default async function SearchPage({
  searchParams,
}: PageProps<"/search">) {
  const { q } = await searchParams;
  const query =
    (Array.isArray(q) ? q[0] : q)?.trim().slice(0, maxQueryLength) ?? "";
  const results = await searchMaterials(query);

  return (
    <SectionPage section={sections.search}>
      <SearchBar query={query} />
      {query && (
        <section aria-labelledby="search-results" className="mt-10 max-w-3xl">
          <h2 id="search-results" className="mb-4 text-2xl font-bold">
            Результаты поиска
          </h2>
          {results.length ? (
            <MaterialList items={results} />
          ) : (
            <p className="wrap-break-word text-muted">
              По запросу «{query}» ничего не найдено.
            </p>
          )}
        </section>
      )}
    </SectionPage>
  );
}
