import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminForm, AdminUpload } from "@/components/cms/admin-form";
import { CmsEdit } from "@/components/cms/region";
import { getEditor } from "@/lib/cms/clients";
import { cmsSeeds, seedByKey } from "@/lib/cms/registry";
import {
  changeEditor,
  createEntry,
  importBackup,
  saveNotice,
  signOut,
  updateMedia,
} from "./actions";
import { listMedia } from "./media-actions";

const tabs = {
  overview: "Обзор",
  pages: "Страницы",
  programs: "Программы",
  publications: "Публикации",
  biographies: "Мыслители",
  media: "Медиатека",
  drafts: "Черновики",
  history: "История",
  editors: "Редакторы",
  settings: "Настройки",
} as const;
type Tab = keyof typeof tabs;
type Row = {
  key: string;
  path: string;
  kind: string;
  title: string;
  revision: number;
  has_draft: boolean;
  has_public: boolean;
};

const first = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] : value;

export default async function AdminPage({ searchParams }: PageProps<"/admin">) {
  const editor = await getEditor();
  if (!editor) redirect("/admin/login");
  const params = await searchParams;
  const requestedTab = first(params.tab) ?? "overview";
  const tab =
    Object.hasOwn(tabs, requestedTab) &&
    (editor.owner || !["settings", "editors"].includes(requestedTab))
      ? (requestedTab as Tab)
      : "overview";
  const query = (first(params.q) ?? "").trim().slice(0, 100);
  const edit = first(params.edit);
  const mediaPage = Math.min(
    10000,
    Math.max(0, Number.parseInt(first(params.page) ?? "", 10) || 0),
  );
  const [{ data, error }, { data: settings }, media, users, audits] =
    await Promise.all([
      editor.client.rpc("cms_dashboard"),
      editor.client
        .from("cms_settings")
        .select("value")
        .eq("key", "editor_notice")
        .maybeSingle(),
      tab === "media" ? listMedia(query, mediaPage) : undefined,
      tab === "editors"
        ? editor.client
            .from("profiles")
            .select("user_id, display_name, role, can_publish")
            .order("display_name")
        : undefined,
      tab === "history"
        ? editor.client
            .from("content_versions")
            .select("id, page_key, revision, author_name, event, created_at")
            .order("id", { ascending: false })
            .limit(40)
        : undefined,
    ]);
  const map = new Map(
    ((data as Row[] | null) ?? []).map((row) => [row.key, row]),
  );
  for (const seed of cmsSeeds) {
    if (!map.has(seed.key))
      map.set(seed.key, {
        key: seed.key,
        path: seed.path,
        kind: seed.kind,
        title: seed.seed.title,
        revision: 0,
        has_draft: false,
        has_public: true,
      });
  }
  const all = [...map.values()];
  const kinds: Partial<Record<Tab, string[]>> = {
    pages: ["page", "section"],
    programs: ["program"],
    publications: ["publication"],
    biographies: ["biography"],
  };
  const rows = all
    .filter(
      (row) =>
        (!edit || row.key === edit) &&
        (!kinds[tab] || kinds[tab].includes(row.kind)) &&
        (tab !== "drafts" || row.has_draft) &&
        (tab !== "history" || row.revision > 0) &&
        (!query ||
          (row.title + " " + row.key)
            .toLowerCase()
            .includes(query.toLowerCase())),
    )
    .sort((a, b) => a.key.localeCompare(b.key));
  const list = !["media", "editors", "settings"].includes(tab);
  return (
    <>
      <div className="section-row">
        <div>
          <h1>Редактор RENASCENTIA</h1>
          <p>
            {editor.name} · {editor.owner ? "Владелец" : "Редактор"}
          </p>
        </div>
        <form action={signOut}>
          <button type="submit">Выйти из аккаунта</button>
        </form>
      </div>
      <nav aria-label="Разделы CMS">
        {Object.entries(tabs)
          .filter(
            ([key]) => editor.owner || !["editors", "settings"].includes(key),
          )
          .map(([key, label]) => (
            <Link
              key={key}
              href={"/admin?tab=" + key}
              aria-current={tab === key ? "page" : undefined}
            >
              {label}
            </Link>
          ))}
      </nav>
      {error && (
        <p role="alert" className="cms-error">
          Не удалось загрузить список материалов из Supabase.
        </p>
      )}
      {tab === "overview" && settings?.value && (
        <p className="mb-4">{settings.value}</p>
      )}
      {tab === "overview" && !edit && !query && (
        <p className="mb-4">
          {all.length} записей · {all.filter((row) => row.has_draft).length}{" "}
          черновиков
        </p>
      )}
      {list && (
        <>
          <div className="section-row">
            <h2>{edit ? "Выбранный материал" : tabs[tab]}</h2>
            {editor.owner && (
              <Link href="/admin/export">Скачать резервную копию JSON</Link>
            )}
          </div>
          {edit ? (
            <Link href={"/admin?tab=" + tab}>Показать все материалы</Link>
          ) : (
            <form className="cms-tools mt-4">
              <input type="hidden" name="tab" value={tab} />
              <input
                type="search"
                name="q"
                maxLength={100}
                defaultValue={query}
                placeholder="Название или адрес"
                aria-label="Поиск материалов"
              />
              <button type="submit">Найти</button>
            </form>
          )}
          {["overview", "pages", "publications", "biographies"].includes(tab) &&
            !edit && (
              <details className="cms-native">
                <summary>Создать материал</summary>
                <AdminForm action={createEntry} label="Создать черновик">
                  <label>
                    Заголовок
                    <input name="title" maxLength={220} required />
                  </label>
                  <label>
                    Адрес
                    <input
                      name="path"
                      placeholder="/publications/nazvanie"
                      maxLength={100}
                      required
                    />
                  </label>
                  <p className="text-sm">
                    Допустимы /publications/…, /thinkers/… и /pages/…
                  </p>
                  <label>
                    Описание
                    <textarea name="description" maxLength={1200} />
                  </label>
                </AdminForm>
              </details>
            )}
          {audits?.error && <p role="alert">Не удалось загрузить историю.</p>}
          {audits?.data?.length ? (
            <details className="cms-native">
              <summary>Последние изменения на портале</summary>
              <ul className="cms-admin-list">
                {audits.data.map((row) => (
                  <li key={row.id}>
                    <Link
                      href={"/admin?edit=" + encodeURIComponent(row.page_key)}
                    >
                      {row.page_key}
                    </Link>
                    <span>
                      Версия {row.revision} · {row.author_name} ·{" "}
                      {new Date(row.created_at).toLocaleString("ru", {
                        timeZone: "UTC",
                      })}{" "}
                      UTC
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
          {!rows.length && <p className="mt-5">Материалы не найдены.</p>}
          <ul className="cms-admin-list">
            {rows.map((row) => (
              <li key={row.key}>
                <h3>{row.title}</h3>
                <p className="text-sm">
                  {row.key} · {row.has_public ? "Опубликовано" : "Скрыто"}
                  {row.has_draft ? " · Есть черновик" : ""}
                  {row.revision ? " · Версия " + row.revision : ""}
                </p>
                <div className="cms-tools">
                  <CmsEdit name={row.key} inline />
                  <Link href={row.path}>Открыть страницу</Link>
                  {editor.owner && (
                    <Link
                      href={"/admin/export?key=" + encodeURIComponent(row.key)}
                    >
                      JSON
                    </Link>
                  )}
                  {editor.owner && row.kind === "publication" && (
                    <Link
                      href={
                        "/admin/export?format=markdown&key=" +
                        encodeURIComponent(row.key)
                      }
                    >
                      Markdown
                    </Link>
                  )}
                  {!seedByKey.has(row.key) && (
                    <span className="text-sm">Создано в CMS</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
      {tab === "media" && (
        <>
          <h2>Медиатека</h2>
          <AdminUpload />
          <form className="cms-tools mt-4">
            <input type="hidden" name="tab" value="media" />
            <input
              type="search"
              name="q"
              defaultValue={query}
              maxLength={100}
              aria-label="Поиск по медиатеке"
            />
            <button type="submit">Найти</button>
          </form>
          {media && !media.ok && <p role="alert">{media.message}</p>}
          {media?.ok && (
            <ul className="cms-admin-list">
              {media.data.map((item) => (
                <li key={item.id}>
                  <h3>
                    <a
                      href={"/cms/media/" + item.id}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {item.title}
                    </a>
                  </h3>
                  <p>
                    {item.mime} · {Math.ceil(item.size / 1024)} КБ
                  </p>
                  <details>
                    <summary>Данные изображения</summary>
                    <AdminForm action={updateMedia} label="Сохранить данные">
                      <input type="hidden" name="id" value={item.id} />
                      <label>
                        Название
                        <input
                          name="title"
                          defaultValue={item.title}
                          required
                          maxLength={240}
                        />
                      </label>
                      <label>
                        Альтернативный текст
                        <input
                          name="alt"
                          defaultValue={item.alt}
                          maxLength={420}
                        />
                      </label>
                      <label>
                        Автор
                        <input
                          name="author"
                          defaultValue={item.author}
                          maxLength={220}
                        />
                      </label>
                      <label>
                        Источник
                        <input
                          name="source"
                          type="url"
                          defaultValue={item.source}
                          maxLength={2048}
                        />
                      </label>
                      <label>
                        Лицензия
                        <input
                          name="license"
                          defaultValue={item.license}
                          maxLength={220}
                        />
                      </label>
                    </AdminForm>
                  </details>
                </li>
              ))}
            </ul>
          )}
          <div className="cms-tools">
            {mediaPage > 0 && (
              <Link
                href={`/admin?tab=media&q=${encodeURIComponent(query)}&page=${mediaPage - 1}`}
              >
                Предыдущая страница
              </Link>
            )}
            {media?.ok && media.data.length === 24 && (
              <Link
                href={`/admin?tab=media&q=${encodeURIComponent(query)}&page=${mediaPage + 1}`}
              >
                Следующая страница
              </Link>
            )}
          </div>
        </>
      )}
      {tab === "editors" && (
        <>
          <h2>Редакторы</h2>
          <p>
            Создайте аккаунт в Supabase Auth, затем добавьте его UUID и
            назначьте право публикации.
          </p>
          <AdminForm action={changeEditor} label="Сохранить права">
            <label>
              UUID аккаунта
              <input name="id" required />
            </label>
            <label>
              Имя
              <input name="name" required maxLength={180} />
            </label>
            <label className="cms-check">
              <input type="checkbox" name="publish" /> Может публиковать
            </label>
          </AdminForm>
          {users?.error && (
            <p role="alert">Не удалось загрузить список редакторов.</p>
          )}
          <ul className="cms-admin-list">
            {users?.data?.map((user) => (
              <li key={user.user_id}>
                <h3>
                  {user.display_name} ·{" "}
                  {user.role === "owner" ? "Владелец" : "Редактор"}
                </h3>
                <p>
                  {user.user_id} ·{" "}
                  {user.role === "owner" || user.can_publish
                    ? "Может публиковать"
                    : "Работает с черновиками"}
                </p>
                {user.role === "editor" && (
                  <details>
                    <summary>Отозвать доступ к CMS</summary>
                    <AdminForm action={changeEditor} label="Отозвать доступ">
                      <input type="hidden" name="id" value={user.user_id} />
                      <input type="hidden" name="operation" value="remove" />
                      <label className="cms-check">
                        <input type="checkbox" required /> Подтверждаю отзыв
                        доступа
                      </label>
                    </AdminForm>
                  </details>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
      {tab === "settings" && (
        <>
          <h2>Настройки</h2>
          <AdminForm action={saveNotice} label="Сохранить заметку">
            <label>
              Объявление для редакторов
              <textarea
                name="notice"
                maxLength={500}
                defaultValue={settings?.value ?? ""}
              />
            </label>
          </AdminForm>
          <section className="mt-8">
            <h2>Резервное копирование</h2>
            <Link href="/admin/export">Скачать JSON</Link>
            <AdminForm action={importBackup} label="Восстановить черновики">
              <label>
                Резервная копия JSON
                <input
                  type="file"
                  name="backup"
                  accept=".json,application/json"
                  required
                />
              </label>
              <label className="cms-check">
                <input type="checkbox" name="confirm" required /> Заменить
                текущие черновики новыми версиями из файла
              </label>
            </AdminForm>
          </section>
        </>
      )}
    </>
  );
}
