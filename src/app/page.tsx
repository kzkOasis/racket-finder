import type { Metadata } from 'next';
import Link from 'next/link';
import { Diagnosis } from '@/components/Diagnosis';
import { BRANDS } from '@/lib/share';
import type { RacketSpec } from '@/lib/types';
import racketData from '@/data/rackets.json';

const RACKET_COUNT = (racketData as RacketSpec[]).length;

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

/**
 * 見出しとリード文。クライアントコンポーネントに渡すが、描画はサーバー側なので初期HTMLに入る。
 * 「診断を始める」ボタンはこのすぐ下に出る。
 */
function Lead() {
  return (
    <section>
      <h1 className="text-2xl font-bold text-gray-900">
        テニスラケット診断
      </h1>
      <p className="mt-3 leading-relaxed text-gray-700">
        8問・約1分。レベルやプレースタイル、いま困っていること、肘や肩の状態から、
        あなたに合う硬式テニスラケットを{RACKET_COUNT}本の中から3本提案します。
      </p>
    </section>
  );
}

/** 特徴と対応ブランド。ボタンより下に置く。 */
function Features() {
  return (
    <section>
      <ul className="flex flex-col gap-3">
        <li className="rounded-lg bg-white p-4 text-sm leading-relaxed text-gray-700 shadow-sm">
          <span className="font-bold text-gray-900">6つの軸で相性を計算</span>
          <br />
          パワー・コントロール・スピン・操作性・快適性・ボレーの6軸で、
          あなたの理想値とラケットのスペックのギャップを点数にします。
        </li>
        <li className="rounded-lg bg-white p-4 text-sm leading-relaxed text-gray-700 shadow-sm">
          <span className="font-bold text-gray-900">1本ではなく3本を提案</span>
          <br />
          総合ベストマッチに加えて「もっと扱いやすい方向」「もっと攻めたい方向」の
          2本を、別シリーズから選んで並べます。
        </li>
        <li className="rounded-lg bg-white p-4 text-sm leading-relaxed text-gray-700 shadow-sm">
          <span className="font-bold text-gray-900">肘や肩に不安がある人にも</span>
          <br />
          痛みがある場合は、軽さよりもフレームの柔らかさと適度な重量を優先して選びます
          （本ツールは医療的助言を行うものではありません）。
        </li>
      </ul>

      <p className="mt-4 text-sm text-gray-500">
        対応ブランド: {BRANDS.join(' / ')}（全{RACKET_COUNT}本）
      </p>
    </section>
  );
}

/** ラケット選びの基礎知識。検索から来た人向けの読み物でもある。 */
function Guide() {
  return (
    <section>
      <h2 className="mb-4 text-xl font-bold text-gray-900">ラケット選びの3つのポイント</h2>

      <div className="flex flex-col gap-4">
        <article className="rounded-lg bg-white p-5 shadow-sm">
          <h3 className="font-bold text-gray-900">1. 重さ</h3>
          <p className="mt-2 text-sm leading-relaxed text-gray-700">
            標準は300g前後（ガットを張る前）。軽いほど扱いやすいと思われがちですが、
            軽いラケットほど打球の衝撃が腕に伝わります。
            振り切れる範囲でできるだけ重い方が、面がブレにくく、球も安定します。
            285g未満は取り回し重視、305g以上は安定性重視の目安です。
          </p>
        </article>

        <article className="rounded-lg bg-white p-5 shadow-sm">
          <h3 className="font-bold text-gray-900">2. フェイス面積</h3>
          <p className="mt-2 text-sm leading-relaxed text-gray-700">
            100平方インチが標準。105平方インチ以上は飛びとスイートスポットに余裕があり、
            当たりが安定しない時期でも扱いやすくなります。
            98平方インチ以下は飛びを抑えたぶん、狙ったところへ収まりやすくなります。
          </p>
        </article>

        <article className="rounded-lg bg-white p-5 shadow-sm">
          <h3 className="font-bold text-gray-900">3. フレームの硬さ（RA値）</h3>
          <p className="mt-2 text-sm leading-relaxed text-gray-700">
            数値が大きいほど硬く、少ない力でもボールが飛びますが、そのぶん衝撃も大きくなります。
            柔らかいフレームはボールを掴む感覚が出て腕への負担も小さい一方、
            自分でスイングスピードを出す必要があります。
          </p>
        </article>
      </div>

      <p className="mt-6 text-sm text-gray-600">
        スペックを自分で見比べたい場合は、
        <Link href="/rackets" className="text-blue-600 hover:underline">
          掲載している{RACKET_COUNT}本の一覧
        </Link>
        から各機種のページを開けます。
      </p>
    </section>
  );
}

export default function Home() {
  return <Diagnosis lead={<Lead />} features={<Features />} guide={<Guide />} />;
}
