import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { computeAxisScores } from '@/lib/axes';
import { describeCautions, describeStrengths, specSummary } from '@/lib/suitability';
import { brandLabel } from '@/lib/brands';
import { SITE_URL } from '@/lib/site';
import { AxisBars } from '@/components/AxisBars';
import type { RacketSpec } from '@/lib/types';
import racketData from '@/data/rackets.json';

const rackets = racketData as RacketSpec[];

// データは固定なので、未知のIDは404にする
export const dynamicParams = false;

export function generateStaticParams() {
  return rackets.map(r => ({ id: r.id }));
}

function findRacket(id: string): RacketSpec | undefined {
  return rackets.find(r => r.id === id);
}

export async function generateMetadata(
  props: PageProps<'/rackets/[id]'>,
): Promise<Metadata> {
  const { id } = await props.params;
  const racket = findRacket(id);
  if (!racket) return {};

  const title = `${racket.brand} ${racket.model} のスペックと特徴`;
  const description =
    `${brandLabel(racket.brand)} ${racket.model}（${racket.year}年モデル）のスペックと6軸評価。` +
    `${specSummary(racket)}。どんな人に向いているかも掲載しています。`;

  return {
    title: `${title} | テニスラケット診断`,
    description,
    alternates: { canonical: `/rackets/${racket.id}` },
    openGraph: { title, description, type: 'article', locale: 'ja_JP' },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function RacketPage(props: PageProps<'/rackets/[id]'>) {
  const { id } = await props.params;
  const racket = findRacket(id);
  if (!racket) notFound();

  const scores = computeAxisScores(rackets).get(racket.id)!;
  const strengths = describeStrengths(scores);
  const cautions = describeCautions(scores);
  const sameBrand = rackets.filter(r => r.brand === racket.brand && r.id !== racket.id).slice(0, 6);

  const specs: Array<[string, string]> = [
    ['重さ（ガット張り上げ前）', `${racket.weight}g`],
    ['バランス', `${racket.balance}mm`],
    ['スイングウェイト', `${racket.swingWeight}`],
    ['フェイス面積', `${racket.headSize}平方インチ`],
    ['フレーム硬さ（RA）', `${racket.ra}`],
    ['フレーム厚', `${racket.beamWidth}mm`],
    ['ストリングパターン', racket.pattern],
    ['発売年', `${racket.year}年`],
  ];

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'テニスラケット診断', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'ラケット一覧', item: `${SITE_URL}/rackets` },
      { '@type': 'ListItem', position: 3, name: `${racket.brand} ${racket.model}` },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className="mx-auto max-w-2xl px-4 py-8">
        <nav className="mb-4 text-sm text-gray-500">
          <Link href="/" className="hover:underline">診断</Link>
          <span className="mx-1">/</span>
          <Link href="/rackets" className="hover:underline">ラケット一覧</Link>
          <span className="mx-1">/</span>
          <span className="text-gray-700">{racket.model}</span>
        </nav>

        <header className="mb-6">
          <p className="text-sm text-gray-500">{brandLabel(racket.brand)}</p>
          <h1 className="text-2xl font-bold text-gray-900">{racket.model}</h1>
          <p className="mt-1 text-sm text-gray-500">{specSummary(racket)}</p>
        </header>

        <div className="mb-6 rounded-lg bg-white p-5 shadow-sm">
          <div className="flex gap-4">
            {racket.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={racket.imageUrl}
                alt={`${racket.brand} ${racket.model}`}
                className="h-32 w-32 flex-shrink-0 object-contain"
              />
            ) : (
              <div className="flex h-32 w-32 flex-shrink-0 flex-col items-center justify-center gap-1 rounded-lg bg-gray-100">
                <span className="text-xs font-bold text-gray-500">{racket.brand}</span>
                <span className="px-1 text-center text-[10px] leading-tight text-gray-400">
                  {racket.model}
                </span>
              </div>
            )}
            <div className="flex-1">
              <h2 className="mb-2 font-bold text-gray-900">こんな人に向いています</h2>
              <ul className="flex list-disc flex-col gap-2 pl-4 text-sm leading-relaxed text-gray-700">
                {strengths.map(s => <li key={s}>{s}</li>)}
              </ul>
            </div>
          </div>

          {cautions.length > 0 && (
            <div className="mt-4 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <p className="mb-1 font-bold">注意点</p>
              <ul className="flex list-disc flex-col gap-1 pl-4">
                {cautions.map(c => <li key={c}>{c}</li>)}
              </ul>
            </div>
          )}

          {racket.affiliateUrl.rakuten && (
            <a
              href={racket.affiliateUrl.rakuten}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="mt-4 block w-full rounded bg-red-500 px-3 py-3 text-center font-medium text-white transition-colors hover:bg-red-600"
            >
              楽天で価格を見る <span className="text-xs opacity-75">PR</span>
            </a>
          )}
        </div>

        <section className="mb-6 rounded-lg bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-bold text-gray-900">6軸評価</h2>
          <AxisBars scores={scores} />
          <p className="mt-3 text-xs text-gray-500">
            掲載している{rackets.length}本のラケットの中での相対評価（0〜100）です。
          </p>
        </section>

        <section className="mb-6 rounded-lg bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-bold text-gray-900">スペック</h2>
          <table className="w-full text-sm">
            <tbody>
              {specs.map(([label, value]) => (
                <tr key={label} className="border-b border-gray-100 last:border-0">
                  <th scope="row" className="py-2 text-left font-normal text-gray-600">{label}</th>
                  <td className="py-2 text-right tabular-nums text-gray-900">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <Link
          href="/"
          className="mb-6 block w-full rounded-lg bg-blue-500 px-4 py-3 text-center font-medium text-white transition-colors hover:bg-blue-600"
        >
          このラケットが自分に合うか診断する（8問・約1分）
        </Link>

        {sameBrand.length > 0 && (
          <section className="rounded-lg bg-white p-5 shadow-sm">
            <h2 className="mb-3 font-bold text-gray-900">{brandLabel(racket.brand)}の他のラケット</h2>
            <ul className="flex flex-col gap-2 text-sm">
              {sameBrand.map(r => (
                <li key={r.id}>
                  <Link href={`/rackets/${r.id}`} className="text-blue-600 hover:underline">
                    {r.model}
                  </Link>
                  <span className="ml-2 text-gray-500">{r.weight}g / {r.headSize}平方インチ</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
