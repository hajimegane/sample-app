/**
 * Route-level gates.
 *
 * These run against the in-memory store, so they need no database and no
 * Workers runtime -- `npm test` works on a clean checkout.
 *
 * The list assertions are written against the acceptance criteria of AIA-3,
 * one test per criterion, so a failure names the criterion it broke.
 */
import { describe, expect, it } from "vitest";
import { createApp } from "../src/index.tsx";
import {
  MemoryApplicationStore,
  type Application,
  type NewApplication,
} from "../src/db/applications.ts";

const claim = (overrides: Partial<NewApplication> = {}): NewApplication => ({
  title: "客先訪問の交通費",
  applicant: "山田",
  spentOn: "2026-08-03",
  category: "旅費交通費",
  payee: "JR東日本",
  amountYen: 1_320,
  reason: "A社定例",
  ...overrides,
});

async function withClaims(...claims: NewApplication[]) {
  const store = new MemoryApplicationStore();
  const created: Application[] = [];
  for (const c of claims) {
    created.push(await store.create(c));
    await new Promise((resolve) => setTimeout(resolve, 2)); // 登録順を確定させる
  }
  return { app: createApp(store), store, created };
}

const listHtml = async (app: ReturnType<typeof createApp>) =>
  (await app.request("/applications")).text();

describe("health と routing", () => {
  it("health が応答する", async () => {
    const { app } = await withClaims();
    const response = await app.request("/health");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });

  it("ルートは申請一覧へ転送する", async () => {
    const { app } = await withClaims();
    const response = await app.request("/");
    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("/applications");
  });

  it("存在しないパスは404を返す", async () => {
    const { app } = await withClaims();
    expect((await app.request("/nope")).status).toBe(404);
  });
});

describe("経費申請の一覧（AIA-3）", () => {
  it("7つの項目がすべて表示される", async () => {
    const { app } = await withClaims(claim());
    const html = await listHtml(app);
    for (const [label, value] of [
      ["申請日", "2026-08-03"],
      ["費目", "旅費交通費"],
      ["支払先", "JR東日本"],
      ["金額", "¥1,320"],
      ["用途", "客先訪問の交通費"],
      ["申請者", "山田"],
      ["ステータス", "承認待ち"],
    ]) {
      expect(html, `${label} が表示されていない`).toContain(value);
    }
  });

  it("申請日の新しい順に並ぶ", async () => {
    const { app } = await withClaims(
      claim({ spentOn: "2026-07-01", title: "古い出張" }),
      claim({ spentOn: "2026-08-05", title: "新しい出張" }),
      claim({ spentOn: "2026-07-20", title: "中間の出張" }),
    );
    const html = await listHtml(app);
    const order = ["新しい出張", "中間の出張", "古い出張"].map((t) => html.indexOf(t));
    expect(order.every((i) => i >= 0)).toBe(true);
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  it("金額が3桁区切りで円記号つきになる", async () => {
    const { app } = await withClaims(claim({ amountYen: 1_234_567 }));
    const html = await listHtml(app);
    expect(html).toContain("¥1,234,567");
    expect(html, "生の数値が露出している").not.toContain(">1234567<");
  });

  it("ステータスが日本語で表示される", async () => {
    const { app, store, created } = await withClaims(
      claim({ title: "承認されたもの" }),
      claim({ title: "却下されたもの" }),
      claim({ title: "待っているもの" }),
    );
    await store.setStatus(created[0]!.id, "approved");
    await store.setStatus(created[1]!.id, "rejected");
    const html = await listHtml(app);
    for (const label of ["承認済み", "却下", "承認待ち"]) {
      expect(html, `${label} が出ていない`).toContain(label);
    }
    expect(html, "英語のステータスが露出している").not.toMatch(/>(pending|approved|rejected)</);
  });

  it("1件も無いとき、空であることが分かる", async () => {
    const { app } = await withClaims();
    const html = await listHtml(app);
    expect(html).toContain("まだ1件もない");
    expect(html, "空なのに表の見出しが出ている").not.toContain("<thead>");
  });

  it("固定値ではなく、ストアの内容を読んでいる", async () => {
    // 実装がハードコードした行を返していないことの確認。
    // 受け入れ条件「D1に保存された実データを読んで表示する」に対応する。
    const { app } = await withClaims(claim({ payee: "たまたま入れた一意な支払先" }));
    expect(await listHtml(app)).toContain("たまたま入れた一意な支払先");
  });
});

describe("未実装の2機能", () => {
  it("申請フォームは雛形を返す", async () => {
    const { app } = await withClaims();
    const response = await app.request("/applications/new");
    expect(response.status).toBe(200);
    expect(await response.text()).toContain("まだ実装されていない");
  });

  it("登録は501を返す", async () => {
    const { app } = await withClaims();
    expect((await app.request("/applications", { method: "POST" })).status).toBe(501);
  });

  it("ステータス変更は501を返す", async () => {
    const { app } = await withClaims();
    expect((await app.request("/applications/x/status", { method: "POST" })).status).toBe(501);
  });
});
