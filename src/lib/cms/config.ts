export const cookieName = "renascentia-auth";
export const mediaBucket = "cms-images";
export const publishedTag = "cms-published";
export const previewHeader = "x-renascentia-cms-preview";

export function supabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  return url && key ? { url, key } : null;
}
