import { articles, type Article } from "./articles";
import type { ResearchSlug } from "./research";
import type { Material } from "./types";

export type Publication = Material & { researchSlug?: ResearchSlug };

const plannedMaterial: Publication = {
  slug: "renaissance-philosophy-materials",
  title: "Материалы по философии эпохи Возрождения",
  description: "Здесь появятся материалы первого исследования центра.",
  status: "planned",
  researchSlug: "renaissance-philosophy",
};

export const publications: readonly (Article | Publication)[] = [
  ...articles,
  plannedMaterial,
];

export function isArticle(
  publication: Publication | Article,
): publication is Article {
  return "imageKey" in publication;
}
