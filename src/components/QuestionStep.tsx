'use client';

import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

type Option = {
  value: string | number | null;
  label: string;
  description?: string;
};

type QuestionStepProps = {
  questionNumber: number;
  total: number;
  question: string;
  options: Option[];
  selected: (string | number | null)[];
  maxSelect: number;
  onSelect: (value: string | number | null) => void;
  onBack: (() => void) | null;
  onNext: () => void;
  canSkip?: boolean;
};

export function QuestionStep({
  questionNumber,
  total,
  question,
  options,
  selected,
  maxSelect,
  onSelect,
  onBack,
  onNext,
  canSkip = false,
}: QuestionStepProps) {
  const progress = ((questionNumber - 1) / total) * 100;
  const canNext = canSkip || selected.length > 0 || maxSelect === 0;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="w-full bg-white border-b px-4 py-3">
        <div className="max-w-xl mx-auto">
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>質問 {questionNumber} / {total}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-xl">
          <h2 className="text-xl font-bold text-gray-900 mb-6">{question}</h2>
          {maxSelect === 2 && (
            <p className="text-sm text-gray-500 mb-4">最大2つまで選べます</p>
          )}
          <div className="space-y-3">
            {options.map((opt) => {
              const isSelected = selected.includes(opt.value);
              return (
                <button
                  key={String(opt.value)}
                  onClick={() => onSelect(opt.value)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-900">{opt.label}</div>
                  {opt.description && (
                    <div className="text-sm text-gray-500 mt-1">{opt.description}</div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex justify-between mt-8">
            {onBack ? (
              <Button variant="outline" onClick={onBack}>
                戻る
              </Button>
            ) : (
              <div />
            )}
            <Button onClick={onNext} disabled={!canNext}>
              {questionNumber === total ? '診断する' : '次へ'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
