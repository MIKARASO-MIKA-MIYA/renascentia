import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeading } from "@/components/page-heading";
import { getEditor } from "@/lib/cms/clients";

export const metadata: Metadata = {
  title: "Мой профиль",
  robots: { index: false, follow: false },
};

export default async function ProfilePage() {
  const editor = await getEditor();
  if (!editor) redirect("/admin/login");

  return (
    <section className="page-container page-spacing">
      <PageHeading title="Мой профиль" />
      <dl className="mt-7 max-w-lg divide-y divide-border border-y border-border">
        <div className="py-3">
          <dt className="text-sm text-muted">Имя</dt>
          <dd className="font-bold wrap-break-word">{editor.name}</dd>
        </div>
        {editor.email && (
          <div className="py-3">
            <dt className="text-sm text-muted">Электронная почта</dt>
            <dd className="font-bold wrap-break-word">{editor.email}</dd>
          </div>
        )}
        <div className="py-3">
          <dt className="text-sm text-muted">Роль</dt>
          <dd className="font-bold">
            {editor.owner ? "Владелец" : "Редактор"}
          </dd>
        </div>
        <div className="py-3">
          <dt className="text-sm text-muted">Режим редактирования</dt>
          <dd>{editor.editing ? "Включён" : "Выключен"}</dd>
        </div>
      </dl>
      <Link href="/admin" className="text-link mt-5 inline-block">
        Административная панель
      </Link>
    </section>
  );
}
