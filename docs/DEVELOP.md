# 開発者向け

利用者向けの説明はリポジトリ直下の [README.md](../README.md)。仕様は [SPEC.md](./SPEC.md)。引継ぎは [AGENT_HANDOFF.md](./AGENT_HANDOFF.md)。

公開 URL: https://Tsuyuchan-jp.github.io/umamusume-inherit-skill-list/app/

## ローカル起動

```powershell
npm run serve
```

ルートの `index.html` が `/app/` へ飛ばします。アプリ本体は `app/`、JSON は `data/`、カード画像は `assets/` です。カード系・コース一覧・effects 索引は起動時に `umamusume-data` を取り、失敗時は同梱を使います。各 `effects/{courseId}/{style}.json` は選んだ1本だけ取ります。

ハブを強制 / 切る:

- `?hub=local` … 同梱だけ
- `?hub=remote` … ハブ必須（失敗したら起動しない）

## データ更新（手動）

起動のたびに U-tools へ取りに行きません。コース一覧と effects の正本は工場（`umamusume-data-src` の `extract:courses` / `extract:effects`）。棚へ `publish` したあと、失敗時同梱の `data/effects/**` を揃えます。

## テスト

```powershell
npm test
```

inherit list / obtainable / hub。

## GitHub Pages

- 公開 URL: https://Tsuyuchan-jp.github.io/umamusume-inherit-skill-list/app/
- アカウント: `Tsuyuchan-jp`。リポジトリ名はこのまま
- ソースは **リポジトリ全体**（`app/` だけをルートにすると `data/` と `assets/` が切れる）
- 公開 URL のトップは `/app/` へリダイレクトする
- Jekyll を避けるためルートに `.nojekyll` を置く
- 配信は `.github/workflows/deploy-pages.yml`（`master` push / `workflow_dispatch`。CI は `npm test` のみ）
- Settings → Pages → Source は GitHub Actions
