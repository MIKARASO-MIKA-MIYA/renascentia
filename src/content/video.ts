import type { ImageKey } from "./images";

export type FeaturedVideoConfig = {
  id: string;
  title: string;
  author: string;
  description: string;
};

export const featuredVideo: {
  cover: ImageKey;
  video: FeaturedVideoConfig | null;
} = {
  cover: "sanlorenzo",
  video: null,
};
