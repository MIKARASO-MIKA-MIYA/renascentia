import { ManagedPage, managedMetadata } from "@/components/cms/managed-page";

export async function generateMetadata({ params }: PageProps<"/pages/[slug]">) {
  return managedMetadata("/pages/" + (await params).slug, "page");
}

export default async function Page({ params }: PageProps<"/pages/[slug]">) {
  return <ManagedPage path={"/pages/" + (await params).slug} kind="page" />;
}
