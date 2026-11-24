export function readingTime(body: readonly string[]) {
  const words = body.join(" ").trim().match(/\S+/g)?.length ?? 0;
  return `${Math.max(1, Math.ceil(words / 180))} мин чтения`;
}
