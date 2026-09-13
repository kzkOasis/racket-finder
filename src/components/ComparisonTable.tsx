import type { ScoredRacket } from '@/lib/types';

type Props = {
  items: ScoredRacket[];
};

const AXIS_LABELS = [
  { key: 'power', label: 'パワー' },
  { key: 'control', label: 'コントロール' },
  { key: 'spin', label: 'スピン' },
  { key: 'maneuverability', label: '操作性' },
  { key: 'comfort', label: '快適性' },
  { key: 'volley', label: 'ボレー' },
] as const;

export function ComparisonTable({ items }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2 pr-4 font-medium text-gray-600 w-24">項目</th>
            {items.map((item, i) => (
              <th key={i} className="text-center py-2 px-2 font-medium text-gray-900">
                {item.racket.model}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {AXIS_LABELS.map(({ key, label }) => (
            <tr key={key} className="border-b last:border-0">
              <td className="py-2 pr-4 text-gray-600">{label}</td>
              {items.map((item, i) => {
                const val = item.axisScores[key];
                const max = Math.max(...items.map(it => it.axisScores[key]));
                const isMax = val === max;
                return (
                  <td key={i} className={`text-center py-2 px-2 ${isMax ? 'font-bold text-blue-600' : 'text-gray-700'}`}>
                    {Math.round(val)}
                  </td>
                );
              })}
            </tr>
          ))}
          <tr className="border-t-2">
            <td className="py-2 pr-4 text-gray-600 font-medium">適合度</td>
            {items.map((item, i) => (
              <td key={i} className="text-center py-2 px-2 font-bold text-gray-900">
                {Math.round(item.score)}%
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
