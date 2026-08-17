# 継承白因子リスト

ウマ娘DBでレンタルの継承親を探すとき、スキルを OR 条件で並べる元リストをコピーするブラウザツールです。

任意コースの U-tools 有効スキル（**白スキル ∩ 共通スキル**）から、本育成で取れる分を除いた先頭25件を出します。コピー結果は [レンタル因子貼り付け](https://github.com/Tsuyuchan-jp/umamusume-rental-factor-fill) に貼り、ウマ娘DBの高度フレンド検索へ入れます。

非公式・非商用です。ウマ娘プリティーダービー、U-tools、ウマ娘DB およびゲームの権利は各権利者に帰属します。

## 使う（公開版）

**インストール不要。** 次の URL をブラウザで開くだけです。

**https://Tsuyuchan-jp.github.io/umamusume-inherit-skill-list/app/**

| 項目 | URL |
|------|-----|
| アプリ入口 | https://Tsuyuchan-jp.github.io/umamusume-inherit-skill-list/app/ |
| リポジトリ直下 | https://Tsuyuchan-jp.github.io/umamusume-inherit-skill-list/ → `/app/` へ自動移動 |
| ソース | https://github.com/Tsuyuchan-jp/umamusume-inherit-skill-list |

1. コースと脚質を選ぶ
2. 必要なら「U-tools の有効スキルを開く」で同じ条件のページと突き合わせる（白と共通にチェック）
3. 育成ウマ娘と本育成サポカ（優先40種）を選ぶ
4. いらないスキルは行から外す
5. 「スキルリストをコピー」→ レンタル因子貼り付けへ貼る → ウマ娘DBで人が検索する

編成 UI とカード画像は `umamusume-sp-calc` から流用しています。

## 開発者向け

データ更新（extract）は [docs/DEVELOP.md](docs/DEVELOP.md)。新チャットの引継ぎは [docs/AGENT_HANDOFF.md](docs/AGENT_HANDOFF.md)。次タスクは [docs/TODO.md](docs/TODO.md)。
