import { ManagedPage, managedMetadata } from "@/components/cms/managed-page";

export async function generateMetadata({
  params,
}: PageProps<"/thinkers/[slug]">) {
  return managedMetadata("/thinkers/" + (await params).slug, "biography");
}

export default async function BiographyPage({
  params,
}: PageProps<"/thinkers/[slug]">) {
  return (
    <ManagedPage path={"/thinkers/" + (await params).slug} kind="biography" />
  );
}
