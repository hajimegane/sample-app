/**
 * Route-level gates.
 *
 * These run against the in-memory store, so they need no database and no
 * Workers runtime -- `npm test` works on a clean checkout. The placeholder
 * routes are asserted deliberately: they are the current contract, and a
 * change to them should fail here until the feature that replaces them lands.
 */
import { describe, expect, it } from "vitest";
import { createApp } from "../src/index.tsx";
import { MemoryApplicationStore } from "../src/db/applications.ts";

const app = () => createApp(new MemoryApplicationStore());

describe("health", () => {
  it("応答する", async () => {
    const response = await app().request("/health");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });
});

describe("routing", () => {
  it("ルートは申請一覧へ転送する", async () => {
    const response = await app().request("/");
    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("/applications");
  });

  it("存在しないパスは404を返す", async () => {
    expect((await app().request("/nope")).status).toBe(404);
  });
});

describe("未実装の3機能", () => {
  it("申請一覧は雛形を返す", async () => {
    const response = await app().request("/applications");
    expect(response.status).toBe(200);
    expect(await response.text()).toContain("まだ実装されていない");
  });

  it("申請フォームは雛形を返す", async () => {
    const response = await app().request("/applications/new");
    expect(response.status).toBe(200);
    expect(await response.text()).toContain("まだ実装されていない");
  });

  it("登録は501を返す", async () => {
    const response = await app().request("/applications", { method: "POST" });
    expect(response.status).toBe(501);
  });

  it("ステータス変更は501を返す", async () => {
    const response = await app().request("/applications/x/status", { method: "POST" });
    expect(response.status).toBe(501);
  });
});
