/**
 * The page shell.
 *
 * Styles are inline on purpose while this is a skeleton: a stylesheet split
 * across files is one more thing to wire up before there is anything to look
 * at. Splitting it out is work for a later unit, and until then this is the
 * one place a layout regression can come from -- which makes the
 * `modify:ui-appearance` boundary easy to reason about.
 */
import type { FC, PropsWithChildren } from "hono/jsx";

const STYLES = `
  :root { color-scheme: light dark; --line: #d8d4cd; --muted: #6b6660; --accent: #8c5a3c; }
  @media (prefers-color-scheme: dark) { :root { --line: #3a3730; --muted: #a7a199; --accent: #d99a72; } }
  * { box-sizing: border-box; }
  body { font-family: system-ui, sans-serif; line-height: 1.7; margin: 0; padding: 2rem 1.25rem; max-width: 52rem; margin-inline: auto; }
  h1 { font-size: 1.4rem; margin: 0 0 0.25rem; }
  nav { display: flex; gap: 1rem; margin: 1rem 0 2rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--line); }
  nav a { color: inherit; text-decoration: none; border-bottom: 2px solid transparent; padding-bottom: 0.25rem; }
  nav a[aria-current="page"] { border-bottom-color: var(--accent); }
  .muted { color: var(--muted); font-size: 0.9rem; }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: 0.6rem 0.5rem; border-bottom: 1px solid var(--line); vertical-align: top; }
  th { font-size: 0.85rem; color: var(--muted); font-weight: 600; }
  label { display: block; margin: 1rem 0 0.25rem; font-size: 0.9rem; }
  input, textarea, select { width: 100%; padding: 0.5rem; border: 1px solid var(--line); border-radius: 4px; background: transparent; color: inherit; font: inherit; }
  button { margin-top: 1.5rem; padding: 0.5rem 1.25rem; border: 0; border-radius: 4px; background: var(--accent); color: #fff; font: inherit; cursor: pointer; }
  .notice { border: 1px dashed var(--line); border-radius: 6px; padding: 1.25rem; color: var(--muted); }
`;

export const Layout: FC<PropsWithChildren<{ title: string; current?: string }>> = ({
  title,
  current,
  children,
}) => (
  <html lang="ja">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>{title} — 申請アプリ</title>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
    </head>
    <body>
      <h1>申請アプリ</h1>
      <p class="muted">社内向けの簡易な申請管理</p>
      <nav>
        <a href="/applications" aria-current={current === "list" ? "page" : undefined}>
          申請一覧
        </a>
        <a href="/applications/new" aria-current={current === "new" ? "page" : undefined}>
          新規申請
        </a>
      </nav>
      {children}
    </body>
  </html>
);

/**
 * Placeholder for a feature that has not been built yet.
 *
 * Takes no work-unit identifier on purpose. A placeholder that cites a ticket
 * number is only useful while the number is right, and the number cannot be
 * known before the Tracker issues it.
 */
export const NotBuiltYet: FC<{ what: string }> = ({ what }) => (
  <div class="notice">
    <p>
      <strong>{what}</strong> はまだ実装されていない。
    </p>
    <p>Tracker の作業単位として起票してから実装する。</p>
  </div>
);
