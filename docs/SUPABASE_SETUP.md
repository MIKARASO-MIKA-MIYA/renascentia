# Подключение CMS

Понадобятся Node.js 24.x, проект Supabase и проект Vercel. Публичный сайт доступен без переменных CMS на локальных материалах.

## Supabase

1. Создайте проект Supabase. В настройках Authentication выключите **Allow new users to sign up** и **Allow anonymous sign-ins**. Оставьте Email как способ входа.
2. В SQL Editor примените миграции по возрастанию номера. Для нового проекта выполните [создание CMS](../supabase/migrations/20261125000100_content_editor.sql), затем [изменение лимита документа в 0.0.5](../supabase/migrations/20261125000200_cms_document_size.sql). Для действующей CMS 0.0.3 или 0.0.4 нужна только вторая миграция. В проекте, привязанном к Supabase CLI, миграции можно применить через `supabase db push`.
3. В Authentication → Users создайте первого пользователя вручную и подтвердите его email. Скопируйте UUID пользователя.
4. В SQL Editor привяжите роль владельца к этому UUID. Замените пример идентификатором созданного пользователя.

```sql
insert into public.profiles (user_id, display_name, role)
values ('00000000-0000-4000-8000-000000000000', 'Владелец', 'owner')
on conflict (user_id) do nothing;
```

5. Создайте локальный `.env.local` по образцу. Ключ `SUPABASE_SERVICE_ROLE_KEY` используют только сервер и скрипт переноса. В него можно передать серверный secret key проекта Supabase или ключ `service_role` при работе с прежними ключами.

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-server-secret-key
```

6. Выполните `npm ci`, затем `npm run cms:seed`. Скрипт добавит исходные записи, которых ещё нет. Его можно запустить повторно после прерванной загрузки.
7. Запустите `npm run dev`. Откройте `http://localhost:3000/admin/login`, войдите под аккаунтом владельца и проверьте сохранение черновика. Выдавайте доступ новым редакторам в панели «Редакторы» после создания их аккаунтов в Supabase.

[Настройки Auth](https://supabase.com/docs/guides/auth/general-configuration) · [Ключи Supabase](https://supabase.com/docs/guides/api/api-keys)

## Vercel

1. Подключите репозиторий к проекту с пресетом Next.js и Node.js 24.x.
2. В Settings → Environment Variables добавьте те же три переменные. Сохраните серверный ключ как секрет. Для Preview используйте отдельный Supabase-проект, если редакторы будут тестировать публикацию.
3. Укажите `SITE_URL` с публичным доменом при необходимости и выполните новое развёртывание. Переменные `NEXT_PUBLIC_*` нужны при сборке.
4. Проверьте вход, сохранение черновика, загрузку изображения, публикацию и вид гостя. Загрузка ограничена 3 МБ на изображение. Серверный запрос содержит сам файл и служебные поля.

[Переменные окружения Vercel](https://vercel.com/docs/environment-variables) · [Лимиты функций Vercel](https://vercel.com/docs/functions/limitations)
