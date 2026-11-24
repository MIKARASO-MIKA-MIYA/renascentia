import { programs } from "./programs";
import type { Material } from "./types";

export const overview = {
  slug: "renaissance-philosophy",
  title: "Философия эпохи Возрождения",
  description:
    "Исследовательский обзор античной традиции, гуманизма и способов изучать человека и природу в эпоху Возрождения.",
  status: "published",
  body: [
    "В центре исследования — чтение философских текстов и работа с историческими источниками. Мы рассматриваем, как переводчики, гуманисты и натурфилософы использовали античные тексты для постановки новых вопросов.",
    "В каталоге восемь программ. Для каждого направления сформулированы исследовательские вопросы. Статьи и музейные материалы помогают выбрать источники для самостоятельной работы.",
  ],
} as const satisfies Material;

export const research = [overview, ...programs] as const;
export type ResearchSlug = (typeof research)[number]["slug"];
