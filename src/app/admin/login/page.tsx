import { redirect } from "next/navigation";
import { AdminForm } from "@/components/cms/admin-form";
import { getEditor, writerConfigured } from "@/lib/cms/clients";
import { signIn } from "../actions";

export default async function AdminLogin() {
  if (await getEditor()) redirect("/admin");
  return (
    <section>
      <h1>Вход для редакторов</h1>
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
    </section>
  );
}
