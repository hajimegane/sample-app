/**
 * Routing for the application app.
 *
 * The three features named in the brief -- submit a request, list requests,
 * change a request's status -- have routes and no behaviour. That is
 * deliberate: this unit builds the path (schema, store, layout, gates), and
 * the features are the work that step 2b measures. Shipping them here would
 * leave nothing to measure.
 *
 * The placeholders deliberately do *not* name a work unit. An earlier version
 * cited AIA-1/2/3 before those issues existed; the Tracker then handed those
 * numbers to something else, and the pages pointed at the wrong tickets. Do
 * not reference an identifier the Tracker has not actually issued.
 *
 * The app is created from a store rather than reading a global binding, so the
 * gates can run it against the in-memory store with no infrastructure.
 */

import { Hono } from "hono";
import type { ApplicationStore } from "./db/applications.ts";
import { Layout, NotBuiltYet } from "./views/layout.tsx";

export interface Env {
  DB: D1Database;
}

export function createApp(store: ApplicationStore) {
  const app = new Hono();

  // Liveness, used by the Preview port to decide a試写先 is actually up.
  app.get("/health", (c) => c.json({ ok: true }));

  app.get("/", (c) => c.redirect("/applications"));

  app.get("/applications", (c) =>
    c.html(
      <Layout title="申請一覧" current="list">
        <NotBuiltYet what="申請一覧の表示" />
      </Layout>,
    ),
  );

  app.get("/applications/new", (c) =>
    c.html(
      <Layout title="新規申請" current="new">
        <NotBuiltYet what="申請フォームの入力と登録" />
      </Layout>,
    ),
  );

  app.post("/applications", (c) => c.text("未実装", 501));

  app.post("/applications/:id/status", (c) => c.text("未実装", 501));

  app.notFound((c) =>
    c.html(
      <Layout title="見つかりません">
        <div class="notice">そのページはない。</div>
      </Layout>,
      404,
    ),
  );

  // The store is unused until the features land. Referencing it here keeps the
  // wiring honest -- the app genuinely depends on it, and a broken store shows
  // up at construction rather than at the first request in production.
  void store;

  return app;
}
