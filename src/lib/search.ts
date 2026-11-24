import { sections } from "@/config/site";
import { collectionNames, listMaterialLinks } from "./materials";
import { publishedEntries } from "./cms/data";
import { seedByKey } from "./cms/registry";
import { documentText } from "./cms/schema";

export const maxQueryLength = 120;

function normalize(text: string) {
  return text.normalize("NFC").toLocaleLowerCase("ru").replaceAll("ё", "е");
}

export async function searchMaterials(query: string) {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  if (!terms.length) return [];

  const published = await publishedEntries();
  const indexedSections = new Map<string, string[]>();
  for (const { path, body } of published) {
    const indexed = indexedSections.get(path) ?? [];
    indexed.push(documentText(body));
    indexedSections.set(path, indexed);
  }
  const mainEntries = new Map(
    published
      .filter((record) => record.key === record.path)
      .map((record) => [record.path, record]),
  );
  const originals = collectionNames.flatMap((collection) =>
    listMaterialLinks(collection).map((entry) => {
      const updated = mainEntries.get(entry.href);
      return {
        ...entry,
        category: sections[collection].title,
        title: updated?.body.title ?? entry.title,
        description: updated?.body.description ?? entry.description,
        status: updated ? ("published" as const) : entry.status,
      };
    }),
  );
  const originalPaths = new Set(originals.map(({ href }) => href));
  const extra = [...indexedSections.keys()].flatMap((path) => {
    if (originalPaths.has(path)) return [];
    const update = mainEntries.get(path);
    const body = update?.body ?? seedByKey.get(path)?.seed;
    if (!body) return [];
    return [
      {
        href: path,
        title: body.title,
        description: body.description,
        status: "published" as const,
        code: undefined,
        category:
          update?.kind === "publication"
            ? sections.publications.title
            : update?.kind === "biography"
              ? sections.thinkers.title
              : undefined,
      },
    ];
  });
  return [...originals, ...extra].filter(
    ({ href, title, description, code }) => {
      const text = normalize(
        [code, title, description, ...(indexedSections.get(href) ?? [])]
          .filter(Boolean)
          .join(" "),
      );
      return terms.every((term) => text.includes(term));
    },
  );
}
