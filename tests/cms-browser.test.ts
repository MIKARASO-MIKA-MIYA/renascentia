import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { existsSync } from "node:fs";
import { test } from "node:test";
import { setTimeout as wait } from "node:timers/promises";
import { chromium, expect, type Locator, type Page } from "@playwright/test";
import sharp from "sharp";
import {
  fixturePassword,
  fixturePublicKey,
  fixtureServiceKey,
  startFixture,
} from "./cms-http-fixture";

const base = "http://127.0.0.1:3186";
const edge = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";

async function signIn(page: Page, email: string) {
  await page.goto(base + "/admin/login");
  await page.getByLabel("Электронная почта").fill(email);
  await page.getByLabel("Пароль").fill(fixturePassword);
  await page.getByRole("button", { name: "Войти", exact: true }).click();
}

async function openEditor(page: Page, path: string) {
  await page.goto(base + path);
  await page
    .getByRole("main")
    .getByRole("button", { name: "Редактировать", exact: true })
    .first()
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  return dialog;
}

async function addBlock(dialog: Locator, type: string) {
  await dialog
    .getByRole("button", { name: /Добавить блок/ })
    .last()
    .click();
  await dialog.getByRole("button", { name: type, exact: true }).click();
}

test(
  "browser flow with a local PostgreSQL fixture and Supabase-compatible HTTP",
  { timeout: 210_000 },
  async () => {
    const fixture = await startFixture();
    const next = spawn(
      process.execPath,
      [
        "node_modules/next/dist/bin/next",
        "dev",
        "--hostname",
        "127.0.0.1",
        "--port",
        "3186",
      ],
      {
        env: {
          ...process.env,
          RENASCENTIA_BROWSER_TEST: "1",
          NEXT_TELEMETRY_DISABLED: "1",
          NODE_ENV: "development",
          NEXT_PUBLIC_SUPABASE_URL: fixture.url,
          NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: fixturePublicKey,
          SUPABASE_SERVICE_ROLE_KEY: fixtureServiceKey,
        },
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    let output = "";
    next.stdout.on("data", (chunk) => {
      output = (output + String(chunk)).slice(-25000);
    });
    next.stderr.on("data", (chunk) => {
      output = (output + String(chunk)).slice(-25000);
    });
    const browser = await chromium.launch({
      headless: true,
      executablePath:
        process.env.CMS_BROWSER_BIN || (existsSync(edge) ? edge : undefined),
    });
    let stage = "startup";
    try {
      const expires = Date.now() + 65_000;
      while (Date.now() < expires) {
        if (next.exitCode !== null) throw new Error("Next.js exited");
        try {
          if (
            (
              await fetch(base + "/admin/login", {
                signal: AbortSignal.timeout(5000),
              })
            ).ok
          )
            break;
        } catch {
          // The development server is still starting.
        }
        await wait(500);
      }
      stage = "visitor and responsive pages";
      const visitor = await browser.newPage();
      const ownerContext = await browser.newContext();
      const owner = await ownerContext.newPage();
      const editor = await browser.newPage();
      await owner
        .context()
        .route("https://www.youtube-nocookie.com/**", (route) =>
          route.fulfill({ body: "" }),
        );
      await visitor
        .context()
        .route("https://www.youtube-nocookie.com/**", (route) =>
          route.fulfill({ body: "" }),
        );
      const errors: string[] = [];
      for (const page of [visitor, owner, editor])
        page.on("pageerror", (error) => errors.push(error.message));
      for (const width of [360, 768, 1024, 1440, 1920]) {
        await visitor.setViewportSize({ width, height: 900 });
        const response = await visitor.goto(base + "/", {
          waitUntil: "domcontentloaded",
        });
        assert.equal(response?.status(), 200);
        await expect(
          visitor.getByRole("main").getByRole("heading", { level: 1 }),
        ).toBeVisible();
        assert.ok(
          await visitor.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth + 1,
          ),
          "Home overflow at " + width,
        );
        await expect(
          visitor.getByRole("button", { name: "Редактировать", exact: true }),
        ).toHaveCount(0);
      }
      await expect(visitor.getByRole("navigation").first()).toBeVisible();
      await visitor.goto(base + "/admin");
      await expect(visitor).toHaveURL(/\/admin\/login$/);
      assert.equal(
        (await visitor.request.get(base + "/admin/export")).status(),
        403,
      );
      await signIn(visitor, "visitor@example.test");
      await expect(visitor.getByRole("main").getByRole("alert")).toContainText(
        "не назначена роль",
      );

      stage = "owner and editor auth";
      await signIn(owner, "owner@example.test");
      await expect(
        owner.getByRole("heading", { name: "Редактор RENASCENTIA" }),
      ).toBeVisible();
      await signIn(editor, "editor@example.test");
      await expect(
        editor.getByRole("heading", { name: "Редактор RENASCENTIA" }),
      ).toBeVisible();
      await expect(
        editor.getByRole("link", { name: "Редакторы", exact: true }),
      ).toHaveCount(0);
      for (let program = 1; program <= 8; program++) {
        const panel = await openEditor(owner, "/research/rp-00" + program);
        await expect(
          panel.getByLabel("Заголовок", { exact: true }),
        ).not.toHaveValue("");
        await panel
          .getByRole("button", { name: "Выйти из редактора", exact: true })
          .click();
      }

      stage = "formatting, blocks, media and layout";
      const path = "/research/rp-001";
      const editorPanel = await openEditor(editor, path);
      await expect(
        editorPanel.getByRole("button", { name: "Опубликовать", exact: true }),
      ).toHaveCount(0);
      const panel = await openEditor(owner, path);
      for (const width of [360, 768, 1024, 1440, 1920]) {
        await owner.setViewportSize({ width, height: 900 });
        assert.ok(
          await panel.evaluate(
            (element) => element.scrollWidth <= element.clientWidth + 1,
          ),
          "Editor overflow at " + width,
        );
      }
      await owner.setViewportSize({ width: 1440, height: 900 });
      await panel
        .getByLabel("Заголовок", { exact: true })
        .fill("Имя программы для проверки CMS");
      await addBlock(panel, "Текст");
      const prosemirror = panel.getByRole("textbox", { name: "Текст блока" });
      await prosemirror.press("/");
      await expect(
        panel.getByRole("searchbox", { name: "Найти блок" }),
      ).toBeFocused();
      await panel.getByRole("button", { name: "Таблица", exact: true }).click();
      await expect(panel.locator(".ProseMirror table")).toBeVisible();
      await panel.locator(".ProseMirror th").first().click();
      await panel
        .getByRole("button", { name: "Добавить строку снизу", exact: true })
        .click();
      await expect(panel.locator(".ProseMirror tr")).toHaveCount(4);
      await addBlock(panel, "Заголовок");
      await prosemirror.fill("Уникальныйпроверочныйтекст");
      await prosemirror.press("Control+a");
      await panel.getByRole("button", { name: "Жирный", exact: true }).click();
      await expect(panel.locator(".ProseMirror h2 strong")).toContainText(
        "Уникальныйпроверочныйтекст",
      );
      await panel
        .getByRole("button", { name: "Переместить блок вверх", exact: true })
        .last()
        .click();
      await addBlock(panel, "Изображение");
      await panel
        .getByRole("button", { name: "Добавить изображение", exact: true })
        .click();
      const imageInput = panel.locator("input[type=file]");
      await imageInput.setInputFiles({
        name: "test.svg",
        mimeType: "image/svg+xml",
        buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'),
      });
      await expect(panel.getByRole("alert")).toContainText(/Формат|Файл/);
      const png = await sharp({
        create: { width: 80, height: 60, channels: 3, background: "#8c2020" },
      })
        .png()
        .toBuffer();
      await imageInput.setInputFiles({
        name: "test.png",
        mimeType: "image/png",
        buffer: png,
      });
      await expect(
        panel.getByText("Параметры изображения", { exact: true }),
      ).toBeVisible();
      const imageUrl = await panel
        .locator(".cms-resize-image img")
        .getAttribute("src");
      assert.ok(imageUrl?.startsWith("/cms/media/"));
      assert.equal((await visitor.request.get(base + imageUrl)).status(), 404);
      await panel.getByRole("button", { name: "50%", exact: true }).click();
      await expect(panel.getByLabel("Ширина, %", { exact: true })).toHaveValue(
        "50",
      );
      await panel
        .getByLabel("Альтернативный текст", { exact: true })
        .fill("Проверочное изображение");
      await addBlock(panel, "Видео");
      await panel
        .getByLabel("Ссылка на видео", { exact: true })
        .fill("https://www.youtube.com/shorts/PpvB0GJFHzY");
      await panel
        .getByRole("button", { name: "Добавить видео", exact: true })
        .click();
      await expect(panel.locator("iframe")).toHaveAttribute(
        "src",
        "https://www.youtube-nocookie.com/embed/PpvB0GJFHzY",
      );
      await expect(panel.locator("iframe")).toHaveClass(/cms-short/);

      stage = "autosave, preview, conflict and publication";
      try {
        await expect(panel.getByRole("status")).toHaveText(
          "Черновик сохранён",
          {
            timeout: 8_000,
          },
        );
      } catch (error) {
        throw new Error(
          "Autosave status: " +
            (await panel.getByRole("alert").allTextContents()).join(" "),
          { cause: error },
        );
      }
      await visitor.goto(
        base + path + "?cms-preview=" + encodeURIComponent(path),
      );
      await expect(visitor.getByRole("heading", { level: 1 })).not.toHaveText(
        "Имя программы для проверки CMS",
      );
      const preview = await ownerContext.newPage();
      await preview.goto(
        base + path + "?cms-preview=" + encodeURIComponent(path),
      );
      await expect(preview.getByRole("heading", { level: 1 })).toHaveText(
        "Имя программы для проверки CMS",
      );
      await preview.close();
      await editorPanel
        .getByLabel("Заголовок", { exact: true })
        .fill("Не должен перезаписать владельца");
      await editorPanel
        .getByRole("button", { name: "Сохранить черновик", exact: true })
        .click();
      await expect(editorPanel.getByRole("alert")).toContainText(
        "уже изменено",
      );
      await panel
        .getByRole("button", { name: "Опубликовать", exact: true })
        .click();
      await expect(panel.getByRole("status")).toHaveText("Опубликовано", {
        timeout: 12_000,
      });
      await visitor.goto(base + path);
      await expect(visitor.getByRole("heading", { level: 1 })).toHaveText(
        "Имя программы для проверки CMS",
      );
      assert.equal((await visitor.request.get(base + imageUrl)).status(), 200);
      for (const width of [360, 768, 1024, 1440, 1920]) {
        await visitor.setViewportSize({ width, height: 900 });
        assert.ok(
          await visitor.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth + 1,
          ),
          "Material overflow at " + width,
        );
      }
      await visitor.goto(
        base + "/search?q=" + encodeURIComponent("Уникальныйпроверочныйтекст"),
      );
      await expect(
        visitor.getByRole("link", { name: "Имя программы для проверки CMS" }),
      ).toBeVisible();

      stage = "history and owner export";
      await panel.getByRole("button", { name: "История", exact: true }).click();
      await expect(
        panel.getByRole("heading", { name: "История изменений" }),
      ).toBeVisible();
      await panel
        .getByRole("button", { name: /Версия \d+ · Публикация/ })
        .first()
        .click();
      await panel
        .getByRole("button", { name: "Сравнить с текущим текстом" })
        .click();
      await expect(panel.getByText("Содержимое совпадает.")).toBeVisible();
      owner.once("dialog", (dialog) => void dialog.accept());
      await panel
        .getByRole("button", { name: "Восстановить в черновик" })
        .click();
      await expect(panel.getByRole("status")).toHaveText("Черновик сохранён");
      const json = await owner.request.get(
        base + "/admin/export?key=" + encodeURIComponent(path),
      );
      assert.equal(json.status(), 200);
      assert.equal(
        (await json.json()).entries[0].body.title,
        "Имя программы для проверки CMS",
      );
      const markdown = await owner.request.get(
        base +
          "/admin/export?format=markdown&key=/publications/florence-and-renaissance",
      );
      assert.equal(markdown.status(), 200);
      assert.match(await markdown.text(), /^# /);

      stage = "new publication, home cards and backup import";
      const newPath = "/publications/cms-browser-test";
      const newTitle = "Новая публикация для главной";
      await owner.goto(base + "/admin?tab=publications");
      await owner.getByText("Создать материал", { exact: true }).click();
      await owner.getByLabel("Заголовок", { exact: true }).fill(newTitle);
      await owner.getByLabel("Адрес", { exact: true }).fill(newPath);
      await owner
        .getByRole("button", { name: "Создать черновик", exact: true })
        .click();
      await expect(
        owner.getByRole("heading", { name: newTitle }),
      ).toBeVisible();
      assert.equal((await visitor.request.get(base + newPath)).status(), 404);
      const publication = await openEditor(owner, newPath);
      await publication
        .getByRole("button", { name: "Опубликовать", exact: true })
        .click();
      await expect(publication.getByRole("status")).toHaveText("Опубликовано");
      await visitor.goto(base + "/publications");
      await expect(visitor.getByRole("link", { name: newTitle })).toBeVisible();

      await owner.goto(base + "/");
      const featured = owner.locator(".cms-region").filter({
        has: owner.getByRole("heading", {
          name: "Главные исследования",
          exact: true,
        }),
      });
      await featured
        .getByRole("button", { name: "Редактировать", exact: true })
        .click();
      const home = owner.getByRole("dialog");
      await expect(home).toBeVisible();
      await home
        .getByLabel("Позиция 1", { exact: true })
        .selectOption("cms-browser-test");
      await home
        .getByRole("button", { name: "Опубликовать", exact: true })
        .click();
      await expect(home.getByRole("status")).toHaveText("Опубликовано");
      await visitor.goto(base + "/");
      await expect(
        visitor.getByRole("link", { name: new RegExp(newTitle) }),
      ).toBeVisible();

      const newBackup = await owner.request.get(
        base + "/admin/export?key=" + encodeURIComponent(newPath),
      );
      assert.equal(newBackup.status(), 200);
      const backup = await newBackup.json();
      const restoredTitle = "Заголовок из резервной копии";
      backup.entries[0].body.title = restoredTitle;
      await owner.goto(base + "/admin?tab=settings");
      await owner
        .getByLabel("Резервная копия JSON", { exact: true })
        .setInputFiles({
          name: "backup.json",
          mimeType: "application/json",
          buffer: Buffer.from(JSON.stringify(backup)),
        });
      await owner
        .getByLabel("Заменить текущие черновики новыми версиями из файла", {
          exact: true,
        })
        .check();
      await owner
        .getByRole("button", { name: "Восстановить черновики", exact: true })
        .click();
      await expect(owner.getByRole("status")).toContainText(
        "Записей восстановлено",
      );
      const restored = await openEditor(owner, newPath);
      await expect(
        restored.getByLabel("Заголовок", { exact: true }),
      ).toHaveValue(restoredTitle);
      await visitor.goto(base + newPath);
      await expect(visitor.getByRole("heading", { level: 1 })).toHaveText(
        newTitle,
      );
      assert.equal(errors.length, 0, errors.join("\n"));
    } catch (error) {
      throw new Error("Browser stage: " + stage + "\n" + output, {
        cause: error,
      });
    } finally {
      await browser.close();
      next.kill();
      await Promise.race([once(next, "exit"), wait(3000)]);
      await fixture.close();
    }
  },
);
