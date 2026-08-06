# .agent — kit への参照

このリポジトリは、[ai-autodriving-kit](https://github.com/hajimegane/ai-autodriving-kit) の手法で開発する。kit は**別リポジトリ**にある（[ADR-0001](https://github.com/hajimegane/ai-autodriving-kit/blob/main/docs/adr/0001-two-repositories.md)）。

分けてある理由は、ある変更が「プロダクトの改善」なのか「仕組みの改善」なのかを記録上あいまいにしないため。二重ループはこの2つを分けて回すことが前提で、区別がつかなくなるとテレメトリが読めなくなる。

## 配置

kit をこのリポジトリの隣に置く。

```
workspace/
├── ai-autodriving-kit/    手法（スキル・境界・記録）
└── sample-app/            このリポジトリ
```

## 使うもの

| 何を | どこから |
|---|---|
| プロセススキル | `../ai-autodriving-kit/skills/` |
| 境界の現在状態 | `../ai-autodriving-kit/policy/boundaries.yaml` |
| 権限とフック | `../ai-autodriving-kit/policy/settings.json` |
| テレメトリ | `../ai-autodriving-kit/telemetry/` |

**テレメトリは kit 側に記録する。** プロダクトの記録と仕組みの記録が同じ場所にあると、どちらのループのものか判別できなくなる。作業単位IDで区別する。

```bash
export AAD_UNIT=AIA-1          # Tracker の作業単位ID
export AAD_ROOT=../ai-autodriving-kit
node ../ai-autodriving-kit/telemetry/record.ts <event> --skill implement --payload '{...}'
```

## ゲート

| ゲート | コマンド | 何を落とすか |
|---|---|---|
| typecheck | `npm run typecheck` | 型の不整合 |
| unit-test | `npm run test` | 振る舞いの退行 |
| build | `npm run build` | Worker としてビルドできない状態 |

`npm run check` が typecheck と test をまとめて走らせる。CI では [`.github/workflows/gates.yml`](../.github/workflows/gates.yml) が同じものを実行する。

**まだ無いゲート**（`missed_by: null` として記録される候補）:

- 視覚回帰。`modify:ui-appearance` は現在 `sampling-check`（人が見る）で、自動検出手段がない
- D1 に対する統合テスト。ストアの契約はメモリ実装に対してのみ検証している

## この題材で試したいこと

CRUD中心でテストが書きやすく、かつ**UIの崩れという自動検出しにくい事象が実際に発生する**。だから境界の運用（特に `sampling-check` 象限）を実地で試せる。API だけの題材ではこれができない。
