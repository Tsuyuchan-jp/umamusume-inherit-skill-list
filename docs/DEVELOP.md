# 開発者向け

利用者向けの説明はリポジトリ直下の [README.md](../README.md)。仕様は [SPEC.md](./SPEC.md)。引継ぎは [AGENT_HANDOFF.md](./AGENT_HANDOFF.md)。

公開 URL: https://Tsuyuchan-jp.github.io/umamusume-inherit-skill-list/app/

## ローカル起動

```powershell
npm run serve
```

ルートの `index.html` が `/app/` へ飛ばします。アプリ本体は `app/`、JSON は `data/`、カード画像は `assets/` です。この3つを同じオリジンに置く前提です。

## データ更新（手動）

起動のたびに U-tools へ取りに行きません。見たいコースを増やすときだけ実行します。

```powershell
npm run extract:courses
npm run extract:effects -- --from-tracks
npm run extract:effects -- --course 10606
```

`--from-tracks` は U-tools コース一覧の金ドット分を取り、既存はスキップします。`--cache-only` で `.cache/` の HTML だけ再パースできます。

## テスト

```powershell
npm test
```

parse effects（合成 HTML fixture）/ inherit list / parse courses / obtainable。

## GitHub Pages

- 公開 URL: https://Tsuyuchan-jp.github.io/umamusume-inherit-skill-list/app/
- アカウント: `Tsuyuchan-jp`。リポジトリ名はこのまま
- ソースは **リポジトリ全体**（`app/` だけをルートにすると `data/` と `assets/` が切れる）
- 公開 URL のトップは `/app/` へリダイレクトする
- Jekyll を避けるためルートに `.nojekyll` を置く
- 配信は `.github/workflows/deploy-pages.yml`（`master` push / `workflow_dispatch`。CI は `npm test` のみ）
- Settings → Pages → Source は GitHub Actions
