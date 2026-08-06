# sample-app

社内向けの簡易な申請アプリ。[AIオートドライビング開発](https://github.com/hajimegane/ai-autodriving-kit)の題材。

機能は3つに限定する。CRUD中心でテストが書きやすく、かつUIの崩れという「自動検出しにくい」事象が実際に発生するため、境界の運用を試す題材として選んだ。

| 機能 | 状態 | 作業単位 |
|---|---|---|
| 申請一覧の表示 | 未実装（雛形のみ） | AIA-1 |
| 申請フォームの入力と登録 | 未実装（雛形のみ） | AIA-2 |
| 申請ステータスの変更 | 未実装（雛形のみ） | AIA-3 |

**いまは雛形。** 経路（スキーマ・ストア・レイアウト・ゲート・配布）は通っているが、3機能そのものは空。開発の進め方は [`.agent/README.md`](.agent/README.md)。

## 構成

```
src/
├── worker.ts        Worker のエントリ。D1 を束ねる
├── index.tsx        ルーティング
├── views/           サーバレンダリングのJSX
└── db/              ストアの契約と、D1 / メモリの2実装
migrations/          D1 のスキーマ
test/                ゲート。インフラなしで動く
```

ストアを差し替え可能にしてあるのは、**ゲートがデータベースなしで動くようにするため**。起動にインフラが要るテストは動かされなくなり、動かされないゲートはゲートではない。

## 動かす

```bash
npm ci
npm run check                  # typecheck + test
npm run db:migrate:local       # ローカルD1にスキーマを適用
npm run dev
```

Node 22.18 以降。デプロイには Cloudflare の認証（`wrangler login` または `CLOUDFLARE_API_TOKEN`）が要る。
