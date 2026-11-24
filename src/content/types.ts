export type Material = {
  slug: string;
  title: string;
  description: string;
  status: "planned" | "published";
  body?: readonly string[];
};
