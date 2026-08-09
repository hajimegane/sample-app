/**
 * Store gates.
 *
 * The in-memory store is what the route gates run against, so its behaviour
 * has to match D1's or every test above it is testing a fiction. These
 * assertions are the shared contract; the D1 implementation is checked against
 * a real database in the preview.
 */
import { describe, expect, it } from "vitest";
import {
  MemoryApplicationStore,
  STATUSES,
  formatYen,
  isStatus,
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

describe("isStatus", () => {
  it("既定の3値だけを受け入れる", () => {
    for (const status of STATUSES) expect(isStatus(status)).toBe(true);
    expect(isStatus("deleted")).toBe(false);
    expect(isStatus("")).toBe(false);
  });
});

describe("formatYen", () => {
  it("3桁区切りに円記号をつける", () => {
    expect(formatYen(1_320)).toBe("¥1,320");
    expect(formatYen(1_234_567)).toBe("¥1,234,567");
  });

  it("0円も表示できる", () => {
    expect(formatYen(0)).toBe("¥0");
  });
});

describe("MemoryApplicationStore", () => {
  it("登録したものが取得できる", async () => {
    const store = new MemoryApplicationStore();
    const created = await store.create(claim());
    expect(created.status).toBe("pending");
    expect(created.amountYen).toBe(1_320);
    expect(await store.get(created.id)).toEqual(created);
  });

  it("存在しないIDは null を返す", async () => {
    expect(await new MemoryApplicationStore().get("missing")).toBeNull();
  });

  it("一覧は申請日の新しい順に並ぶ", async () => {
    const store = new MemoryApplicationStore();
    const old = await store.create(claim({ spentOn: "2026-07-01", title: "古い" }));
    const recent = await store.create(claim({ spentOn: "2026-08-05", title: "新しい" }));
    const middle = await store.create(claim({ spentOn: "2026-07-20", title: "中間" }));
    expect((await store.list()).map((a) => a.id)).toEqual([recent.id, middle.id, old.id]);
  });

  it("申請日が同じなら、登録の新しい順で決まる", async () => {
    // 出張1日分がまとめて起票されるとこうなる。並びが安定しないと
    // 一覧のテストが実装依存になる。
    const store = new MemoryApplicationStore();
    const first = await store.create(claim({ spentOn: "2026-08-03", title: "往路" }));
    await new Promise((resolve) => setTimeout(resolve, 2));
    const second = await store.create(claim({ spentOn: "2026-08-03", title: "復路" }));
    expect((await store.list()).map((a) => a.id)).toEqual([second.id, first.id]);
  });

  it("ステータスを変更できる", async () => {
    const store = new MemoryApplicationStore();
    const created = await store.create(claim());
    expect((await store.setStatus(created.id, "approved"))?.status).toBe("approved");
  });

  it("存在しないIDのステータス変更は null を返す", async () => {
    expect(await new MemoryApplicationStore().setStatus("missing", "approved")).toBeNull();
  });
});
