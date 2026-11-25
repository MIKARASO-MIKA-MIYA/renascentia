import assert from "node:assert/strict";
import { test } from "node:test";
import {
  cmsSeeds,
  seedByKey,
  validNativeFields,
} from "../src/lib/cms/registry";
import {
  documentSchema,
  isImageUrl,
  isLink,
  newPathSchema,
  richDoc,
  richParagraph,
  videoSource,
} from "../src/lib/cms/schema";
import { toMarkdown } from "../src/lib/cms/markdown";
import { normalizeDocument } from "../src/lib/cms/normalize-document";
import { exceedsDocumentTransport, richHeading } from "../src/lib/cms/schema";
import {
  asRole,
  editorId,
  imageId,
  ownerId,
  strangerId,
  testDatabase,
} from "./cms-database";

const sample = (title: string) => ({
  format: 1 as const,
  title,
  description: "",
  fields: {},
  blocks: [
    {
      id: "sample",
      type: "text" as const,
      doc: richDoc(richParagraph("Редакционная запись")),
    },
  ],
});

test("0.0.2 seeds retain the routes and pass the CMS schema", () => {
  assert.equal(new Set(cmsSeeds.map(({ key }) => key)).size, cmsSeeds.length);
  for (const { key, seed } of cmsSeeds) {
    const result = documentSchema.safeParse(seed);
    assert.ok(result.success, key + " " + JSON.stringify(result.error?.issues));
    assert.ok(validNativeFields(seed, key), key);
  }
  for (let number = 1; number <= 8; number++) {
    const key = "/research/rp-00" + number;
    assert.ok(seedByKey.has(key));
    assert.ok(seedByKey.has(key + "~questions"));
  }
});

test("content permits the supported media and URLs and rejects unsafe structure", () => {
  assert.equal(
    videoSource("https://youtube.com/shorts/PpvB0GJFHzY")?.type,
    "youtube",
  );
  assert.equal(
    videoSource("https://youtu.be/PpvB0GJFHzY")?.src,
    "https://www.youtube-nocookie.com/embed/PpvB0GJFHzY",
  );
  assert.equal(
    videoSource("https://example.com/movie.mp4?quality=2")?.type,
    "file",
  );
  assert.equal(
    videoSource("https://youtube.com.attacker.test/watch?v=PpvB0GJFHzY"),
    null,
  );
  for (const link of [
    "javascript:alert(1)",
    "data:text/html,a",
    "//example.org",
    "/\\example.com",
    "https://user@example.com",
    "https://example.org/" + String.fromCharCode(10),
  ]) {
    assert.equal(isLink(link), false, link);
  }
  assert.ok(isLink("/art#architecture"));
  assert.ok(isImageUrl("/cms/media/" + imageId));
  assert.ok(!isImageUrl("/uploads/raw.svg"));
  assert.ok(newPathSchema.safeParse("/publications/medici").success);
  assert.ok(!newPathSchema.safeParse("/admin/login").success);

  const invalid = {
    ...sample("Publication"),
    blocks: [
      {
        id: "sample",
        type: "text",
        doc: {
          type: "doc",
          content: [{ type: "iframe", attrs: { src: "https://example.com" } }],
        },
      },
    ],
  };
  assert.equal(documentSchema.safeParse(invalid).success, false);
  assert.equal(
    documentSchema.safeParse({
      ...sample("Publication"),
      blocks: [
        ...sample("Publication").blocks,
        ...sample("Publication").blocks,
      ],
    }).success,
    false,
  );
  assert.match(
    toMarkdown(sample("Заголовок")),
    /^# Заголовок\n\nРедакционная запись/m,
  );
});

test("normalization repairs pasted styles, repeated anchors and oversized media without dropping text", () => {
  const heading = {
    id: "same",
    type: "heading",
    doc: richDoc(richHeading("Одинаковый раздел"), richParagraph()),
  };
  const original = {
    ...sample(""),
    blocks: [
      heading,
      heading,
      {
        id: "formatted",
        type: "text",
        doc: {
          type: "doc",
          content: [
            {
              type: "paragraph",
              attrs: { textAlign: "start", indent: -2 },
              content: [
                {
                  type: "text",
                  text: "Сохранённый текст",
                  marks: [
                    {
                      type: "textStyle",
                      attrs: {
                        color: "rgb(255, 0, 0)",
                        fontFamily: '"Calibri", sans-serif',
                        fontSize: "14pt",
                        lineHeight: "150%",
                      },
                    },
                    { type: "bold" },
                    { type: "bold" },
                    {
                      type: "link",
                      attrs: { href: " http://example.org/source " },
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
      {
        id: "image",
        type: "image",
        doc: richDoc(),
        images: [{ url: "/images/florence.webp", width: "190%", height: 4500 }],
      },
      {
        id: "video",
        type: "video",
        doc: richDoc(),
        video: { url: "https://example.org/home" },
      },
    ],
  };
  const result = normalizeDocument(original);
  assert.ok(result.ok);
  const { body, notices } = result;
  assert.equal(body.title, "Без названия");
  assert.equal(body.blocks[0].anchor, "odinakovyy-razdel");
  assert.equal(body.blocks[1].anchor, "odinakovyy-razdel-2");
  assert.notEqual(body.blocks[0].id, body.blocks[1].id);
  assert.equal(body.blocks[0].doc.content?.[1]?.type, "paragraph");
  const marks = body.blocks[2].doc.content?.[0]?.content?.[0]?.marks;
  assert.deepEqual(marks?.[0], {
    type: "textStyle",
    attrs: {
      color: "#ff0000",
      fontFamily: "Arial",
      fontSize: "18px",
      lineHeight: "1.5",
    },
  });
  assert.equal(marks?.filter(({ type }) => type === "bold").length, 1);
  assert.deepEqual(marks?.at(-1), {
    type: "link",
    attrs: { href: "https://example.org/source" },
  });
  assert.equal(body.blocks[3].images?.[0]?.width, 100);
  assert.equal(body.blocks[3].images?.[0]?.height, 1800);
  assert.equal(body.blocks[4].video, undefined);
  assert.ok(
    notices.some(
      ({ level, field }) =>
        level === "warning" && field.includes("Альтернативный текст"),
    ),
  );
  assert.ok(
    notices.some(
      ({ level, field }) => level === "repair" && field.includes("Якорь"),
    ),
  );
  assert.ok(documentSchema.safeParse(body).success);
});

test("unsafe links and invalid structure identify the specific block and field", () => {
  const result = normalizeDocument({
    ...sample("Проверка"),
    blocks: [
      {
        id: "link",
        type: "text",
        doc: richDoc({
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "ссылка",
              marks: [{ type: "link", attrs: { href: "javascript:" } }],
            },
          ],
        }),
      },
    ],
  });
  assert.ok(!result.ok);
  assert.match(result.field, /Блок 1.*Адрес ссылки/);
  assert.match(result.message, /опасный протокол/);
  const invalid = normalizeDocument({
    ...sample("Структура"),
    blocks: [
      {
        id: "a",
        type: "text",
        doc: { type: "doc", content: [{ type: "iframe" }] },
      },
    ],
  });
  assert.ok(!invalid.ok);
  assert.match(invalid.field, /Блок 1.*узел 1/);
  assert.match(invalid.message, /iframe/);
});

test("article length follows the request byte budget instead of the former text and block limits", () => {
  const longText = "длинный абзац ".repeat(34000);
  const original = {
    ...sample("Длинная статья"),
    blocks: [
      {
        id: "long",
        type: "text",
        doc: richDoc(
          richParagraph(longText),
          ...Array.from({ length: 1850 }, () => richParagraph()),
        ),
      },
      ...Array.from({ length: 460 }, (_, index) => ({
        id: "section-" + index,
        type: "text",
        doc: richDoc(richParagraph("Раздел")),
      })),
    ],
  };
  const result = normalizeDocument(original);
  assert.ok(result.ok);
  assert.equal(result.body.blocks.length, 461);
  assert.equal(result.body.blocks[0].doc.content?.length, 1851);
  assert.equal(
    result.body.blocks[0].doc.content?.[0].content?.[0].text,
    longText,
  );
  const encoded = JSON.stringify(result.body);
  assert.ok(Buffer.byteLength(encoded) > 768 * 1024);
  assert.ok(!exceedsDocumentTransport(encoded));
  assert.ok(exceedsDocumentTransport("д".repeat(2200000)));
});

test("SQL RLS, drafts, publication rights, version locking, restore, unpublish and storage", async () => {
  const db = await testDatabase();
  try {
    const item = cmsSeeds.find(({ key }) => key === "/research/rp-001")!;
    const seeds = JSON.stringify([
      { key: item.key, path: item.path, kind: item.kind, seed: item.seed },
    ]);
    const entry = "/publications/test-cms";
    const writer = <T>(
      query: (connection: Pick<typeof db, "query">) => Promise<T>,
    ) => asRole(db, "service_role", "", query);
    const write = (
      actor: string,
      key: string,
      revision: number,
      intent: string,
      value?: string,
      version?: number,
      media: string[] = [],
    ) =>
      writer((connection) =>
        connection.query<{ value: number }>(
          "select public.cms_write($1, $2, $3, $4, $5, $6, $7) as value",
          [
            actor,
            key,
            revision,
            intent,
            value ? JSON.stringify(sample(value)) : null,
            version ?? null,
            media,
          ],
        ),
      );
    const publicRows = () =>
      asRole(db, "anon", "", (connection) =>
        connection.query<{ body: { title: string } }>(
          "select * from public.cms_public($1)",
          [entry],
        ),
      );
    assert.equal(
      (
        await writer((connection) =>
          connection.query<{ value: number }>(
            "select public.cms_seed($1) as value",
            [seeds],
          ),
        )
      ).rows[0].value,
      1,
    );
    assert.equal(
      (
        await writer((connection) =>
          connection.query<{ value: number }>(
            "select public.cms_seed($1) as value",
            [seeds],
          ),
        )
      ).rows[0].value,
      0,
    );
    await assert.rejects(
      asRole(db, "anon", "", (connection) =>
        connection.query("select * from public.content_versions"),
      ),
      /permission denied/,
    );
    await writer((connection) =>
      connection.query("select public.cms_create($1, $2, $3)", [
        editorId,
        entry,
        JSON.stringify(sample("Черновик 1")),
      ]),
    );
    assert.equal((await publicRows()).rows.length, 0);
    assert.equal(
      (
        await asRole(db, "authenticated", strangerId, (connection) =>
          connection.query("select * from public.content_versions"),
        )
      ).rows.length,
      0,
    );
    assert.equal(
      (
        await asRole(db, "authenticated", editorId, (connection) =>
          connection.query("select * from public.content_versions"),
        )
      ).rows.length,
      1,
    );
    await assert.rejects(
      write(strangerId, entry, 1, "draft", "Запрещено"),
      /cms_forbidden/,
    );
    await assert.rejects(
      write(editorId, entry, 1, "publish", "Запрещено"),
      /cms_forbidden/,
    );
    await assert.rejects(
      asRole(db, "authenticated", editorId, (connection) =>
        connection.query(
          "select public.cms_write($1, $2, 1, 'publish', '{}'::jsonb)",
          [ownerId, entry],
        ),
      ),
      /permission denied/,
    );
    await writer((connection) =>
      connection.query(
        "select * from public.cms_add_media($1, $2, $3, 'Фото', 1024, 'image/webp')",
        [editorId, imageId, imageId + ".webp"],
      ),
    );
    await db.query(
      "insert into storage.objects values ('cms-images', $1), ('other', 'other.webp')",
      [imageId + ".webp"],
    );
    assert.equal(
      (
        await asRole(db, "authenticated", editorId, (connection) =>
          connection.query(
            "select * from storage.objects where bucket_id = 'cms-images'",
          ),
        )
      ).rows.length,
      0,
    );
    await assert.rejects(
      asRole(db, "authenticated", editorId, (connection) =>
        connection.query(
          "insert into storage.objects values ('cms-images', 'forbidden.webp')",
        ),
      ),
      /row-level security/,
    );
    const publicImage = () =>
      asRole(db, "anon", "", (connection) =>
        connection.query<{ path: string | null }>(
          "select public.cms_public_media($1) as path",
          [imageId],
        ),
      );
    assert.equal((await publicImage()).rows[0].path, null);
    await writer((connection) =>
      connection.query(
        "select public.cms_set_editor($1, $2, 'Editor', true, false)",
        [ownerId, editorId],
      ),
    );
    assert.equal(
      (
        await write(editorId, entry, 1, "publish", "Опубликовано", undefined, [
          imageId,
        ])
      ).rows[0].value,
      2,
    );
    assert.equal((await publicRows()).rows[0].body.title, "Опубликовано");
    assert.equal((await publicImage()).rows[0].path, imageId + ".webp");
    assert.equal(
      (await write(editorId, entry, 2, "draft", "Новый черновик")).rows[0]
        .value,
      3,
    );
    assert.equal((await publicRows()).rows[0].body.title, "Опубликовано");
    await assert.rejects(
      write(ownerId, entry, 2, "draft", "Старый черновик"),
      /cms_conflict/,
    );
    const versions = await db.query<{ id: number }>(
      "select id from public.content_versions where page_key = $1 and revision = 1",
      [entry],
    );
    const originalId = versions.rows[0].id;
    await assert.rejects(
      write(editorId, entry, 3, "restore", undefined, originalId),
      /cms_forbidden/,
    );
    assert.equal(
      (await write(ownerId, entry, 3, "restore", undefined, originalId)).rows[0]
        .value,
      4,
    );
    assert.equal((await publicRows()).rows[0].body.title, "Опубликовано");
    const restored = await db.query<{ title: string }>(
      "select body->>'title' as title from public.content_versions where page_key = $1 and revision = 4",
      [entry],
    );
    assert.equal(restored.rows[0].title, "Черновик 1");
    await assert.rejects(
      writer((connection) =>
        connection.query("select public.cms_import($1, $2)", [
          editorId,
          JSON.stringify([{ key: entry, body: sample("Импорт"), expected: 4 }]),
        ]),
      ),
      /cms_forbidden/,
    );
    const backup = JSON.stringify([
      { key: entry, body: sample("Импорт"), expected: 4 },
    ]);
    await writer((connection) =>
      connection.query("select public.cms_import($1, $2)", [ownerId, backup]),
    );
    assert.equal((await publicRows()).rows[0].body.title, "Опубликовано");
    await write(ownerId, entry, 5, "unpublish");
    assert.equal((await publicRows()).rows.length, 0);
    assert.equal((await publicImage()).rows[0].path, null);
    assert.equal(
      (await db.query("select * from public.media_assets")).rows.length,
      1,
    );
    const longBody = sample("Исследование на 2,8 МБ");
    longBody.blocks[0].doc = richDoc(richParagraph("а".repeat(1400000)));
    const longJson = JSON.stringify(longBody);
    assert.ok(Buffer.byteLength(longJson) > 2600000);
    assert.ok(!exceedsDocumentTransport(longJson));
    await writer((connection) =>
      connection.query(
        "select public.cms_write($1, $2, 6, 'publish', $3::jsonb)",
        [ownerId, entry, longJson],
      ),
    );
    const visibleLength = await asRole(db, "anon", "", (connection) =>
      connection.query<{ length: number }>(
        "select length(body #>> '{blocks,0,doc,content,0,content,0,text}') as length from public.cms_public($1)",
        [entry],
      ),
    );
    assert.equal(visibleLength.rows[0].length, 1400000);
  } finally {
    await db.close();
  }
});
