import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { ScoredRacket, RacketRole } from '@/lib/types';

type Props = {
  rank: 1 | 2 | 3;
  item: ScoredRacket;
  role: RacketRole;
  reason: string;
  showElbowNote: boolean;
};

const ROLE_LABEL: Record<RacketRole, string> = {
  best: '総合ベストマッチ',
  easier: 'もっと扱いやすく',
  aggressive: 'もっと攻めたいなら',
  alternative: 'こちらもおすすめ',
};

const RANK_COLOR: Record<number, string> = {
  1: 'bg-yellow-400 text-yellow-900',
  2: 'bg-gray-200 text-gray-700',
  3: 'bg-orange-300 text-orange-900',
};

export function ResultCard({ rank, item, role, reason, showElbowNote }: Props) {
  const { racket, score } = item;

  return (
    <Card className="w-full">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className={`text-xs font-bold px-2 py-1 rounded-full ${RANK_COLOR[rank]}`}>
            {ROLE_LABEL[role]}
          </span>
          <Badge variant="outline" className="text-xs">
            適合度 {Math.round(score)}%
          </Badge>
        </div>

        <div className="flex gap-4">
          {racket.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={racket.imageUrl}
              alt={racket.model}
              className="w-24 h-24 object-contain flex-shrink-0"
            />
          ) : (
            <div className="w-24 h-24 bg-gray-100 rounded-lg flex flex-col items-center justify-center flex-shrink-0 gap-1">
              <span className="text-xs font-bold text-gray-500">{racket.brand}</span>
              <span className="text-[10px] text-gray-400 text-center px-1 leading-tight">{racket.model}</span>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500">{racket.brand}</p>
            <h3 className="font-bold text-gray-900 text-lg leading-tight">{racket.model}</h3>
            <p className="text-sm text-gray-500 mt-1">
              {racket.weight}g / フェイス {racket.headSize}in² / {racket.pattern}
            </p>
          </div>
        </div>

        <p className="text-sm text-gray-700 mt-3 leading-relaxed">{reason}</p>

        {showElbowNote && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded text-sm text-amber-800">
            肘に不安がある場合、軽いラケットの方が負担が少なそうに感じますが、実際は軽いほど衝撃が腕に伝わります。ある程度の重量があり、フレームが柔らかいモデルを選んでいます。
            <br />
            <span className="text-xs mt-1 block text-amber-700">※本ツールは医療的助言を行うものではありません。痛みが続く場合は医療機関を受診してください。</span>
          </div>
        )}

        {(racket.affiliateUrl.rakuten || racket.affiliateUrl.amazon) && (
          <div className="flex gap-2 mt-4">
            {racket.affiliateUrl.rakuten && (
              <a
                href={racket.affiliateUrl.rakuten}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="flex-1 text-center text-sm bg-red-500 hover:bg-red-600 text-white py-2 px-3 rounded transition-colors"
              >
                楽天で価格を見る <span className="text-xs opacity-75">PR</span>
              </a>
            )}
            {racket.affiliateUrl.amazon && (
              <a
                href={racket.affiliateUrl.amazon}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="flex-1 text-center text-sm bg-amber-400 hover:bg-amber-500 text-gray-900 py-2 px-3 rounded transition-colors"
              >
                Amazonで見る <span className="text-xs opacity-75">PR</span>
              </a>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
