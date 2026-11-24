import Link from "next/link";
import { setEditingMode, signOut, viewSite } from "@/app/admin/actions";

export function AccountMenu({
  signedIn,
  editing,
}: {
  signedIn: boolean;
  editing: boolean;
}) {
  if (!signedIn) {
    return (
      <Link className="account-action" href="/admin/login" prefetch={false}>
        Войти как владелец или редактор
      </Link>
    );
  }

  return (
    <>
      <Link className="account-action" href="/profile">
        Мой профиль
      </Link>
      <form action={setEditingMode.bind(null, editing ? "view" : "edit")}>
        <button
          className="account-action account-mode"
          type="submit"
          role="switch"
          aria-checked={editing}
        >
          Режим редактирования
          <span className="account-switch" aria-hidden="true" />
        </button>
      </form>
      <form action={viewSite}>
        <button className="account-action" type="submit" data-close-account>
          Просмотр сайта
        </button>
      </form>
      <Link className="account-action" href="/admin">
        Административная панель
      </Link>
      <form action={signOut} className="account-sign-out">
        <button className="account-action" type="submit" data-close-account>
          Выйти из аккаунта
        </button>
      </form>
    </>
  );
}
