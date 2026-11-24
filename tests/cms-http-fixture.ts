import { createHmac } from "node:crypto";
import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import { once } from "node:events";
import {
  asRole,
  editorId,
  ownerId,
  strangerId,
  testDatabase,
} from "./cms-database";

export const fixturePublicKey = "cms-test-public-key";
export const fixtureServiceKey = "cms-test-server-key";
export const fixturePassword = "editor-test-password";
const signingKey = "fixture-only-do-not-use-outside-tests";
const users = new Map([
  ["owner@example.test", ownerId],
  ["editor@example.test", editorId],
  ["visitor@example.test", strangerId],
]);

function user(id: string) {
  return {
    id,
    aud: "authenticated",
    role: "authenticated",
    email: [...users].find(([, userId]) => userId === id)?.[0],
    app_metadata: {},
    user_metadata: {},
    created_at: "2024-01-01T00:00:00Z",
  };
}

function token(id: string) {
  const json = (data: object) =>
    Buffer.from(JSON.stringify(data)).toString("base64url");
  const payload = json({
    sub: id,
    aud: "authenticated",
    role: "authenticated",
    exp: Math.floor(Date.now() / 1000) + 3600,
  });
  const input = json({ alg: "HS256", typ: "JWT" }) + "." + payload;
  return (
    input +
    "." +
    createHmac("sha256", signingKey).update(input).digest("base64url")
  );
}

function authId(value?: string) {
  const bearer = value?.replace(/^Bearer /, "");
  if (!bearer) return "";
  const parts = bearer.split(".");
  if (parts.length !== 3) return "";
  const signature = createHmac("sha256", signingKey)
    .update(parts.slice(0, 2).join("."))
    .digest("base64url");
  if (signature !== parts[2]) return "";
  return JSON.parse(Buffer.from(parts[1], "base64url").toString())
    .sub as string;
}

async function bytes(req: IncomingMessage) {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
}

async function body(req: IncomingMessage) {
  const data = await bytes(req);
  return data.length
    ? (JSON.parse(data.toString()) as Record<string, unknown>)
    : {};
}

function json(res: ServerResponse, code: number, value: unknown) {
  res.writeHead(code, { "content-type": "application/json" });
  res.end(JSON.stringify(value ?? null));
}

const functions = {
  cms_public: ["request_path"],
  cms_public_media: ["asset_id"],
  cms_dashboard: [],
  cms_export: [],
  cms_seed: ["entries"],
  cms_write: [
    "editor_id",
    "entry_key",
    "expected_revision",
    "intent",
    "proposed",
    "version_id",
    "media_ids",
  ],
  cms_create: ["editor_id", "new_path", "proposed"],
  cms_set_editor: [
    "owner_id",
    "target_id",
    "new_name",
    "may_publish",
    "remove_editor",
  ],
  cms_set_notice: ["owner_id", "notice"],
  cms_add_media: [
    "editor_id",
    "asset_id",
    "object_path",
    "file_title",
    "file_size",
    "file_mime",
  ],
  cms_update_media: ["editor_id", "asset_id", "fields"],
  cms_import: ["owner_id", "entries"],
};
const returnRows = new Set([
  "cms_public",
  "cms_dashboard",
  "cms_export",
  "cms_add_media",
]);
const tables = {
  profiles: ["role", "user_id", "display_name", "can_publish"],
  cms_settings: ["key", "value"],
  page_sections: ["page_key", "revision", "draft_version", "published_version"],
  content_versions: [
    "id",
    "revision",
    "page_key",
    "author_name",
    "event",
    "created_at",
    "restored_from",
    "body",
  ],
  media_assets: [
    "id",
    "path",
    "title",
    "mime",
    "size",
    "alt",
    "author",
    "source",
    "license",
    "created_at",
  ],
};

export async function startFixture() {
  const db = await testDatabase();
  const objects = new Map<string, Buffer>();
  const server = createServer((req, res) => {
    void handle(req, res).catch((error: { code?: string; message: string }) => {
      return json(
        res,
        error.code === "42501"
          ? 403
          : error.code === "23505" || error.code === "40001"
            ? 409
            : 400,
        { code: error.code, message: error.message },
      );
    });
  });

  async function handle(req: IncomingMessage, res: ServerResponse) {
    const url = new URL(req.url || "/", "http://127.0.0.1");
    const id = authId(req.headers.authorization);
    const service = req.headers.apikey === fixtureServiceKey;
    const role = service ? "service_role" : id ? "authenticated" : "anon";

    if (url.pathname === "/auth/v1/token") {
      const input = await body(req);
      const id = users.get(String(input.email));
      if (input.password !== fixturePassword || !id)
        return json(res, 400, {
          error_code: "invalid_credentials",
          message: "Invalid credentials",
        });
      return json(res, 200, {
        access_token: token(id),
        token_type: "bearer",
        expires_in: 3600,
        refresh_token: "test-" + id,
        user: user(id),
      });
    }
    if (url.pathname === "/auth/v1/user")
      return id
        ? json(res, 200, user(id))
        : json(res, 401, { message: "Missing identity" });
    if (url.pathname === "/auth/v1/logout") {
      res.writeHead(204);
      return res.end();
    }
    if (url.pathname.startsWith("/storage/v1/object/")) {
      const file = url.pathname.split("/").at(-1)!;
      if (url.pathname.startsWith("/storage/v1/object/sign/")) {
        if (req.method === "POST" && service && objects.has(file))
          return json(res, 200, {
            signedURL: "/object/sign/cms-images/" + file + "?token=test",
          });
        if (
          req.method === "GET" &&
          url.searchParams.get("token") === "test" &&
          objects.has(file)
        ) {
          res.writeHead(200, {
            "content-type": file.endsWith(".gif") ? "image/gif" : "image/webp",
          });
          return res.end(objects.get(file));
        }
      }
      if (req.method === "POST" && service) {
        objects.set(file, await bytes(req));
        return json(res, 200, { Key: "cms-images/" + file });
      }
      return json(res, 404, { message: "Storage object unavailable" });
    }
    const name = url.pathname.split("/").at(-1)!;
    const result = await asRole(db, role, id, async (connection) => {
      if (
        url.pathname.startsWith("/rest/v1/rpc/") &&
        Object.hasOwn(functions, name)
      ) {
        const input = await body(req);
        const inputKeys = functions[name as keyof typeof functions];
        const params = inputKeys.map((key) => {
          if (
            ["entries", "proposed", "fields"].includes(key) &&
            input[key] !== undefined
          )
            return JSON.stringify(input[key]);
          return input[key] ?? (key === "media_ids" ? [] : null);
        });
        const call =
          "public." +
          name +
          "(" +
          params.map((_, index) => "$" + (index + 1)).join(", ") +
          ")";
        const { rows } = await connection.query(
          returnRows.has(name)
            ? "select * from " + call
            : "select " + call + " as value",
          params,
        );
        if (returnRows.has(name))
          return name === "cms_add_media" ? rows[0] : rows;
        return (rows[0] as { value: unknown } | undefined)?.value;
      }
      if (!Object.hasOwn(tables, name))
        throw new Error("Unknown test endpoint " + name);
      const columns = tables[name as keyof typeof tables];
      const selected = (url.searchParams.get("select") ?? "")
        .split(",")
        .map((part) => part.trim());
      if (selected.some((column) => !columns.includes(column)))
        throw new Error("Unknown test column");
      const conditions: string[] = [];
      const values: unknown[] = [];
      const parameter = (value: unknown) => "$" + values.push(value);
      for (const column of columns) {
        const filter = url.searchParams.get(column);
        if (!filter) continue;
        if (filter.startsWith("in.(")) {
          const options = filter
            .slice(4, -1)
            .split(",")
            .map((value) => value.replace(/^"|"$/g, ""));
          conditions.push(
            column + " in (" + options.map(parameter).join(",") + ")",
          );
        } else {
          const operator = filter.startsWith("eq.")
            ? "="
            : filter.startsWith("lt.")
              ? "<"
              : filter.startsWith("ilike.")
                ? "ilike"
                : "";
          if (!operator) throw new Error("Unsupported test filter");
          conditions.push(
            column +
              " " +
              operator +
              " " +
              parameter(filter.slice(filter.indexOf(".") + 1)),
          );
        }
      }
      const order = (url.searchParams.get("order") ?? "")
        .split(",")
        .filter(Boolean)
        .map((item) => {
          const [column, direction] = item.split(".");
          if (!columns.includes(column)) throw new Error("Unknown test order");
          return column + (direction === "desc" ? " desc" : " asc");
        });
      const { rows } = await connection.query(
        "select " +
          selected.join(", ") +
          " from public." +
          name +
          (conditions.length ? " where " + conditions.join(" and ") : "") +
          (order.length ? " order by " + order.join(", ") : "") +
          " limit " +
          parameter(Number(url.searchParams.get("limit")) || 1000) +
          " offset " +
          parameter(Number(url.searchParams.get("offset")) || 0),
        values,
      );
      return req.headers.accept?.includes("vnd.pgrst.object") ? rows[0] : rows;
    });
    json(res, 200, result);
  }
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  if (!address || typeof address === "string")
    throw new Error("Test service did not start");
  return {
    url: "http://127.0.0.1:" + address.port,
    close: async () => {
      server.closeAllConnections();
      server.close();
      await db.close();
    },
  };
}
