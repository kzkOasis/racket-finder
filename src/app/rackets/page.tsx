import Link from 'next/link';
import type { Metadata } from 'next';
import { brandLabel } from '@/lib/brands';
import { BRANDS } from '@/lib/share';
import type { RacketSpec } from '@/lib/types';
import racketData from '@/data/rackets.json';

const rackets = racketData as RacketSpec[];

export const metadata: Metadata = {
  title: `掲載ラケット一覧（${rackets.length}本） | テニスラケット診断`,
  description:
    `Yonex・Wilson・Babolat・Head・Dunlop・Tecnifibre・Prince の硬式テニスラケット${rackets.length}本を、` +
    'スペック（重さ・フェイス面積・フレーム厚・ストリングパターン）と6軸評価つきで掲載しています。',
  alternates: { canonical: '/rackets' },
  openGraph: { type: 'website', locale: 'ja_JP' },
};

export default function RacketsIndexPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <nav className="mb-4 text-sm text-gray-500">
          <Link href="/" className="hover:underline">診断</Link>
          <span className="mx-1">/</span>
          <span className="text-gray-700">ラケット一覧</span>
        </nav>

        <h1 className="mb-2 text-2xl font-bold text-gray-900">
          掲載ラケット一覧（{rackets.length}本）
        </h1>
        <p className="mb-6 text-sm text-gray-600">
          ブランド別に、重さ・フェイス面積などのスペックと6軸評価を掲載しています。
          どれが自分に合うか分からない場合は、
          <Link href="/" className="text-blue-600 hover:underline">8問の診断</Link>
          から3本の提案を受け取れます。
        </p>

        <nav className="mb-8 flex flex-wrap gap-2">
          {BRANDS.map(brand => (
            <a
              key={brand}
              href={`#${brand.toLowerCase()}`}
              className="rounded-full border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-100"
            >
              {brand}
            </a>
          ))}
        </nav>

        {BRANDS.map(brand => {
          const items = rackets
            .filter(r => r.brand === brand)
            .sort((a, b) => a.model.localeCompare(b.model));
          if (items.length === 0) return null;
          return (
            <section key={brand} id={brand.toLowerCase()} className="mb-8 scroll-mt-4">
              <h2 className="mb-3 font-bold text-gray-900">
                {brandLabel(brand)}（{items.length}本）
              </h2>
              <ul className="flex flex-col gap-2">
                {items.map(r => (
                  <li key={r.id} className="rounded-lg bg-white p-4 shadow-sm">
                    <Link href={`/rackets/${r.id}`} className="font-medium text-blue-600 hover:underline">
                      {r.model}
                    </Link>
                    <p className="mt-1 text-sm text-gray-500">
                      {r.weight}g / フェイス{r.headSize}平方インチ / {r.pattern} / {r.year}年
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
