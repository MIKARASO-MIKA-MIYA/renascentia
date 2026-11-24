import { redirect } from "next/navigation";
import Link from "next/link";
import { AdminForm } from "@/components/cms/admin-form";
import { getEditor, writerConfigured } from "@/lib/cms/clients";
import { signIn } from "../actions";

export default async function AdminLogin() {
  if (await getEditor()) redirect("/");
  return (
    <section>
      <h1>Вход для владельца и редакторов</h1>
      {writerConfigured() ? (
        <AdminForm action={signIn} label="Войти">
          <label>
            Электронная почта
            <input
              type="email"
              name="email"
              autoComplete="username"
              maxLength={254}
              required
            />
          </label>
          <label>
            Пароль
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              maxLength={256}
              required
            />
          </label>
        </AdminForm>
      ) : (
        <p className="mt-4" role="status">
          Supabase ещё не настроен. Публичный портал использует материалы из
          проекта.
        </p>
      )}
      <Link href="/" className="text-link mt-5 inline-block">
        На главную
      </Link>
    </section>
  );
}
