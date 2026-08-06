/**
 * Store gates.
 *
 * The in-memory store is what the other gates run against, so its behaviour has
 * to match D1's or every test above it is testing a fiction. These assertions
 * are the shared contract; the D1 implementation is checked against a real
 * database in the preview.
 */
import { describe, expect, it } from "vitest";
import { MemoryApplicationStore, STATUSES, isStatus } from "../src/db/applications.ts";

describe("isStatus", () => {
  it("既定の3値だけを受け入れる", () => {
    for (const status of STATUSES) expect(isStatus(status)).toBe(true);
    expect(isStatus("deleted")).toBe(false);
    expect(isStatus("")).toBe(false);
  });
});

describe("MemoryApplicationStore", () => {
  it("登録したものが取得できる", async () => {
    const store = new MemoryApplicationStore();
    const created = await store.create({ title: "備品購入", applicant: "山田", reason: "椅子が壊れた" });
    expect(created.status).toBe("pending");
    expect(await store.get(created.id)).toEqual(created);
  });

  it("存在しないIDは null を返す", async () => {
    expect(await new MemoryApplicationStore().get("missing")).toBeNull();
  });

  it("一覧は新しい順に並ぶ", async () => {
    const store = new MemoryApplicationStore();
    const first = await store.create({ title: "1件目", applicant: "山田", reason: "" });
    await new Promise((resolve) => setTimeout(resolve, 2));
    const second = await store.create({ title: "2件目", applicant: "鈴木", reason: "" });
    expect((await store.list()).map((a) => a.id)).toEqual([second.id, first.id]);
  });

  it("ステータスを変更できる", async () => {
    const store = new MemoryApplicationStore();
    const created = await store.create({ title: "出張", applicant: "佐藤", reason: "客先訪問" });
    const updated = await store.setStatus(created.id, "approved");
    expect(updated?.status).toBe("approved");
  });

  it("存在しないIDのステータス変更は null を返す", async () => {
    expect(await new MemoryApplicationStore().setStatus("missing", "approved")).toBeNull();
  });
});
