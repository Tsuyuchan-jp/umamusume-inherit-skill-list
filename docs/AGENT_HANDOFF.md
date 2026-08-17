# AGENT_HANDOFF — 新チャット最初に読むこと

会話履歴なしで続けるための最短ブリーフ。詳細は [SPEC.md](./SPEC.md) とリポジトリ直下 [README.md](../README.md)。

## プロジェクト

| 項目 | 内容 |
|------|------|
| 名前 | umamusume-inherit-skill-list（継承白因子リスト） |
| パス | `C:\Users\PC1\Projects\umamusume-inherit-skill-list` |
| 形態 | 静的 HTML/JS + JSON。ルートで `npm run serve` → `/app/` |
| 目的 | 任意コース・脚質の U-tools 有効スキル（白∩共通）から本育成で取れる分を除き、先頭25件を [rental-factor-fill](https://github.com/Tsuyuchan-jp/umamusume-rental-factor-fill) へコピーする |
| 公開 | まだ。push / Pages はユーザー明示時のみ |
| 言語 | ユーザー向け応答・コードコメントは日本語 |

**触らない:** `umamusume-sp-calc` 本体には機能追加しない。画像・ピッカー・JSON は流用済み。

関連: `C:\Users\PC1\Projects\umamusume-sp-calc` / `C:\Users\PC1\Projects\umamusume-rental-factor-fill`

## いま動いていること（実機OK）

- コースは場チップ → 距離チップ（芝緑 / ダ茶・回り・距離区分）。**既定はデータありのみ**（実機OK）。「すべてのコースを見る」で140件。そのときデータなしは薄く、金ドットは全件表示の距離チップだけ。場チップにドットは付けない。切替は localStorage。脚質（逃/先/差/追）
- 一覧は 140 件（芝80 + ダート60）。U-tools のダート表記は「ダ」。`extract:courses` は「ダ」を取り `ground: "ダート"` に正規化する
- 育成ウマ娘（全カード画像）＋サポカ優先40種（タイプ絞込のみ）
- 白∩共通 − 本育成取得可能（金チェーン含む）→ 先頭25件コピー
- 先頭25件を行ごとに手動除外。下に「除外中」（戻す）。コピーは残件の先頭25件。除外はコース＋脚質ごとに localStorage
- 各行に獲得バ身と 100Pt あたりのバ/Pt（U-tools の expectedEffect / needSkillPoint）
- 行タップで詳細（チャンミ9 / リグヒ12 の順位ドット、効果・局面・脚質距離）。閉じた行は順位条件があるときだけ前/中後/その他
- 「U-tools の有効スキルを開く」→ `/race/courses/{courseId}/effects/{style}`
- 突き合わせの結果、リスト内容は問題なし（フィルタ近似は実用十分）
- 背景 z-index 修正済み（コース選択・結果が隠れていた）

有効スキル JSON は U-tools コース一覧で金ドット（`course__effect`）が付く **36件×4脚質**。追加・更新は `npm run extract:effects -- --from-tracks`（既存はスキップ）または `--course ID`。起動時に U-tools へ取りに行かない。有無一覧は `data/effects/available.json`。選んだ courseId は従来どおり localStorage。

## 確定仕様

- フィルタ正本: U-tools で白スキル **かつ** 共通スキル（積集合）。継承固有の白は出さない
- サポカ: 40種のみ選択可。イベント UI なし → ヒント＋イベント全選択肢を「取れる」
- シナリオ UI なし → トレセン軒の **自動付与のみ** 除外。リンク6択・ラーメン3択は見ない
- コピー既定: 有効順の先頭25件（改行のスキル名。rental-factor-fill が解釈できる）
- ウマ娘DB入力は既存ユーザースクリプト。このアプリに入れない（別オリジンのため不可）
- Git: 変更のたびコミット。PowerShell は `git add .` と `git commit` を別ステップ。push は明示時のみ

U-tools URL: `https://xn--gck1f423k.xn--1bvt37a.tools/race/courses/{id}/effects/{style}`  
脚質: `runner` / `leader` / `betweener` / `chaser`

## 次にやること（この順・1つずつ）

正本は [TODO.md](./TODO.md)。UI を一度に大きく変えない。対話で1項目ずつ。

**いま:** 背景差し替え + ヘッダー。本体未着手。比較モック [mocks/header-bg-options.html](./mocks/header-bg-options.html)（`npm run serve` → `/docs/mocks/header-bg-options.html`）。

合意メモ:

- コースチップ視認性は現状で足りる（「すべて見る」は常用しない）
- 背景は差し替え必須。同じ `uma-world` の色変えでは足りない
- ヘッダーのリード文は外す。使い方改修（後で）に同趣旨を入れる
- 色は未定。モックで金 / ティール / 紫を切替
- デザイン寄りはモック複数案比較で進める

後回し:

- 全コース分の `extract:effects` 一括（やらない。金ドット36件）
- アプリ内から extract / GitHub Pages / フィルタ精密化

コース選択の大きな作り直しはしない（v1）。

手動除外の合意: コース＋脚質ごと。見える25件から外す。除外中は下に有効順。戻すは行のみ。コピーは残件の先頭25件。IDは残し、本育成で取れなくなった行は除外中に出さない。

## 主要ファイル

| 役割 | 場所 |
|------|------|
| UI | `app/index.html` `app/js/app.js` `app/js/deckUi.js` `app/css/inherit.css` |
| 差集合 | `app/js/obtainable.js` `app/js/inheritList.js` `app/js/skillDetail.js` |
| 抽出 | `scripts/parse_utools_effects.mjs` `extract_utools_effects.mjs` `extract_utools_courses.mjs` |
| データ | `data/effects/{courseId}/{style}.json` `data/effects/available.json` `data/courses.json` |
| 背景ヘッダー比較 | `docs/mocks/header-bg-options.html` |

## 新チャットの最初のメッセージ例

```
C:\Users\PC1\Projects\umamusume-inherit-skill-list をワークスペースにして、docs/AGENT_HANDOFF.md を読んでから続けてください。
背景＋ヘッダーはモック比較中（本体未着手）。docs/mocks/header-bg-options.html から続けて。
```
