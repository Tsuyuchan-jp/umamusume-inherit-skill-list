# AGENT_HANDOFF — 新チャット最初に読むこと

会話履歴なしで続けるための最短ブリーフ。利用者向けは [README.md](../README.md)。開発手順は [DEVELOP.md](./DEVELOP.md)。詳細仕様は [SPEC.md](./SPEC.md)。

## プロジェクト

| 項目 | 内容 |
|------|------|
| 名前 | umamusume-inherit-skill-list（継承白因子リスト） |
| パス | `C:\Users\PC1\Projects\umamusume-inherit-skill-list` |
| 形態 | 静的 HTML/JS + JSON。ルートで `npm run serve` → `/` が `/app/` へ飛ぶ |
| 目的 | ウマ娘DBでレンタル継承親を探すとき、スキルを OR 条件で並べる元リストをコピーする。中身は任意コース・脚質の U-tools 有効スキル（白∩共通）から本育成で取れる分を除いた先頭25件。貼り付け先は [rental-factor-fill](https://github.com/Tsuyuchan-jp/umamusume-rental-factor-fill) |
| 公開 | まだ。remote 未設定。push / Pages はユーザー明示時のみ |
| 言語 | ユーザー向け応答・コードコメントは日本語 |

**触らない:** `umamusume-sp-calc` 本体には機能追加しない。画像・ピッカー・JSON は流用済み。v1 の機能・見た目は完了。大きな UI 変更をしない。

関連: `C:\Users\PC1\Projects\umamusume-sp-calc` / `C:\Users\PC1\Projects\umamusume-rental-factor-fill`

## いま動いていること（実機OK・v1完了）

- コースは場チップ → 距離チップ（芝緑 / ダ茶・回り・距離区分）。**既定はデータありのみ**。「すべてのコースを見る」で140件。そのときデータなしは薄く、金ドットは全件表示の距離チップだけ。場チップにドットは付けない。切替は localStorage。脚質（逃/先/差/追）
- 一覧は 140 件（芝80 + ダート60）。U-tools のダート表記は「ダ」。`extract:courses` は「ダ」を取り `ground: "ダート"` に正規化する
- 育成ウマ娘（全カード画像）＋サポカ優先40種（タイプ絞込のみ）
- 白∩共通 − 本育成取得可能（金チェーン含む）→ 先頭25件コピー
- 先頭25件を行ごとに手動除外。下に「除外中」（戻す）。コピーは残件の先頭25件。除外はコース＋脚質ごとに localStorage
- 各行に獲得バ身と 100Pt あたりのバ/Pt（U-tools の expectedEffect / needSkillPoint）
- 行タップで詳細（チャンミ9 / リグヒ12 の順位ドット、効果・局面・脚質距離）。閉じた行は順位条件があるときだけ前/中後/その他
- 「U-tools の有効スキルを開く」→ `/race/courses/{courseId}/effects/{style}`。文言に場・距離（回り）・芝/ダ・脚質（例: 東京 2400m 左 芝・先行）
- 突き合わせの結果、リスト内容は問題なし（フィルタ近似は実用十分）
- 背景 z-index 修正済み
- **UI:** 全面イラストなし。暗い帽子ヘッダー＋白い机＋メッシュ下地（左上紫・右下金）。リード文はヘッダーに出さない
- **使い方:** 目的（ウマ娘DBでレンタル継承親を探すときの OR 元リスト）＋中身＋手順は常時表示。計上の前提・リストの見方は折りたたみ。extract は出さない。レンタル因子貼り付けへリンク。閉じるは×と外側クリック。非公式注記あり
- **結果枠:** 見出しは「不足しているかもしれないスキルリスト」。コピーは金ボタン「スキルリストをコピー」（幅100%・上限24rem。スマホ全幅／PCは左寄せ）。ウマ娘DBは白枠の補助ボタン

有効スキル JSON は U-tools コース一覧で金ドット（`course__effect`）が付く **36件×4脚質**。追加・更新は `npm run extract:effects -- --from-tracks`（既存はスキップ）または `--course ID`。起動時に U-tools へ取りに行かない。有無一覧は `data/effects/available.json`。選んだ courseId は従来どおり localStorage。

テスト: `npm test`（parse effects / inherit list / parse courses / obtainable）。

## 確定仕様

- フィルタ正本: U-tools で白スキル **かつ** 共通スキル（積集合）。継承固有の白は出さない
- サポカ: 40種のみ選択可。イベント UI なし → ヒント＋イベント全選択肢を「取れる」
- シナリオ UI なし → トレセン軒の **自動付与のみ** 除外。リンク6択・ラーメン3択は見ない
- コピー既定: 有効順の先頭25件（改行のスキル名。rental-factor-fill が解釈できる）。ボタン文言は「スキルリストをコピー」
- ウマ娘DB入力は既存ユーザースクリプト。このアプリに入れない（別オリジンのため不可）
- Git: 変更のたびコミット。PowerShell は `git add .` と `git commit` を別ステップ。push は明示時のみ
- Pages するときはリポジトリ全体。`app/` だけをルートにしない。ルート `index.html` が `/app/` へ飛ばす。`.nojekyll` 済み

U-tools URL: `https://xn--gck1f423k.xn--1bvt37a.tools/race/courses/{id}/effects/{style}`  
脚質: `runner` / `leader` / `betweener` / `chaser`

## 次にやること（この順・1つずつ）

正本は [TODO.md](./TODO.md)。UI を一度に大きく変えない。対話で1項目ずつ。いきなり実装しない。

**いま:** 公開前レビューの残りは CSS 間引きだけ。機能追加・見た目の作り直しはしない。push / Pages はユーザー明示時のみ。

合意メモ:

- コースチップ視認性は現状で足りる
- 全面壁紙はやめた。UmaTools寄せ。3（暗い帽子＋白い机）＋メッシュ採用・濃さOK
- ヘッダーのリード文は外し、使い方へ移した
- v1 機能・デザインは完了（実機OK）
- モック（`docs/mocks/`・`app/mock-course-ui.html`）は削除済み
- README は利用者向け。extract は `docs/DEVELOP.md`

後回し:

- **CSS 間引き**（`style.css` / `foundation.css` は sp-calc 由来が多い。ピッカー見た目が依存するので実機確認必須）
- 全コース分の `extract:effects` 一括（やらない。金ドット36件）
- アプリ内から extract
- GitHub Pages 公開そのもの（ユーザー明示時）
- フィルタ精密化

コース選択の大きな作り直しはしない（v1）。

手動除外の合意: コース＋脚質ごと。見える25件から外す。除外中は下に有効順。戻すは行のみ。コピーは残件の先頭25件。IDは残し、本育成で取れなくなった行は除外中に出さない。

## 主要ファイル

| 役割 | 場所 |
|------|------|
| UI | `app/index.html` `app/js/app.js` `app/js/deckUi.js` `app/css/inherit.css` |
| 差集合 | `app/js/obtainable.js` `app/js/inheritList.js` `app/js/skillDetail.js` |
| 抽出 | `scripts/parse_utools_effects.mjs` `extract_utools_effects.mjs` `extract_utools_courses.mjs` |
| データ | `data/effects/{courseId}/{style}.json` `data/effects/available.json` `data/courses.json` |
| 公開入口 | ルート `index.html`（`/app/` へ） `.nojekyll` |

## 新チャットの最初のメッセージ例

```
C:\Users\PC1\Projects\umamusume-inherit-skill-list をワークスペースにして、docs/AGENT_HANDOFF.md を読んでから続けてください。
v1 の機能とデザインは完了（実機OK）。公開前レビューの残りは CSS 間引き。
いきなり実装せず、案から。見た目の作り直しと機能追加はしない。
push / GitHub Pages はまだ。明示するまでやらない。
```
