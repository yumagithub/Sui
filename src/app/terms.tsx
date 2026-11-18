import { LegalPage, type LegalSection } from "@/components/legal-page";
import { OPERATOR } from "@/constants/legal";

const SECTIONS: LegalSection[] = [
  {
    title: "この規約について",
    body: ["この規約は、Sui（以下「このサービス」）を使うすべての人に適用されます。使いはじめた時点で、この規約に同意したものとします。"],
  },
  {
    title: "このサービスでできること",
    body: [
      "条件に合う遊び場所の候補を出し、友達と投票して行き先を決められます。",
      "場所の情報（営業時間・料金・駐車場など）は変わることがあります。出かける前に、お店や施設の最新の情報を確かめてください。",
    ],
  },
  {
    title: "してはいけないこと",
    body: [
      "・ほかの人になりすますこと、人をいやな気持ちにさせる表示名を使うこと",
      "・おでかけや投票を機械的に大量に作るなど、サービスに負担をかけること",
      "・不正にアクセスすること、ほかの人の情報を集めること",
      "・法令や公序良俗に反すること",
    ],
  },
  {
    title: "責任について",
    body: [
      "運営は、このサービスの情報が正確であることや、いつも使えることを約束できません。",
      "おでかけ中の事故やトラブル、場所の情報のまちがいによって生じた損害について、運営は責任を負いません。ただし、運営に故意または重大な過失がある場合はこの限りではありません。",
    ],
  },
  {
    title: "データの出典",
    body: [
      "スポットの位置などの一部は、OpenStreetMap のデータを使っています（© OpenStreetMap contributors。データは Open Database License（ODbL）で提供されています）。",
    ],
  },
  {
    title: "サービスの変更・停止",
    body: ["運営は、事前に知らせずに、このサービスの内容を変えたり、止めたりすることがあります。"],
  },
  {
    title: "規約の変更",
    body: ["この規約を変えることがあります。変えたときは、このページでお知らせします。"],
  },
  {
    title: "準拠法",
    body: ["この規約は日本の法律にもとづいて解釈します。"],
  },
];

export default function Terms() {
  return (
    <LegalPage
      intro={`この利用規約は、${OPERATOR}（以下「運営」）が提供する Sui の使い方のルールです。`}
      sections={SECTIONS}
    />
  );
}

// Web 版のタイトルとリンクのプレビュー
export { generateMetadata } from "@/lib/metadata";
