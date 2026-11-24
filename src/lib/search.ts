import { sections } from "@/config/site";
import { collectionNames, listMaterialLinks } from "./materials";

export const maxQueryLength = 120;

function normalize(text: string) {
  return text.normalize("NFC").toLocaleLowerCase("ru").replaceAll("ё", "е");
}

export function searchMaterials(query: string) {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  if (!terms.length) return [];

  return collectionNames.flatMap((collection) =>
    listMaterialLinks(collection)
      .filter(({ title, description, code }) => {
        const text = normalize(
          [code, title, description].filter(Boolean).join(" "),
        );
        return terms.every((term) => text.includes(term));
      })
      .map((entry) => ({ ...entry, category: sections[collection].title })),
  );
}
