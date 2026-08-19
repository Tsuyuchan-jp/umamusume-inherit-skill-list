# 不足白スキルメーカー

コースと脚質の有効白スキルから、本育成で取れる分を除いて出します。レンタルの継承親探しや、因子周回の候補整理に使えます。

任意コースの U-tools 有効スキル（**白スキル ∩ 共通スキル**）から、本育成で取れる分を除いた先頭25件です。

使い方の例:

- ウマ娘DBでレンタルの継承親を探す … コピー結果を [レンタル因子貼り付け](https://github.com/Tsuyuchan-jp/umamusume-rental-factor-fill) に貼り、高度フレンド検索へ入れる
- 因子周回で「親に欲しい白」を眺める … リストを候補として使う（コピーは任意）

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
5. 必要なら「スキルリストをコピー」→ レンタル因子貼り付けへ貼る → ウマ娘DBで人が検索する

編成 UI とカード画像は `umamusume-sp-calc` から流用しています。

## 開発者向け

データ更新（extract）は [docs/DEVELOP.md](docs/DEVELOP.md)。新チャットの引継ぎは [docs/AGENT_HANDOFF.md](docs/AGENT_HANDOFF.md)。次タスクは [docs/TODO.md](docs/TODO.md)。
