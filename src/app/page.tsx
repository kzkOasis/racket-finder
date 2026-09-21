'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { QuestionStep } from '@/components/QuestionStep';
import type { Level, PlayStyle, SwingSize, Problem, ElbowCondition, CurrentWeight, StringType } from '@/lib/types';
import { encodeAnswers, BRANDS } from '@/lib/share';

type Answers = {
  q1: Level | null;
  q2: PlayStyle | null;
  q3: SwingSize | null;
  q4: Problem[];
  q5: ElbowCondition | null;
  q6: CurrentWeight | null;
  q7: StringType | null;
  q9: string[];
};

const TOTAL = 8;

export default function Home() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<Answers>({
    q1: null,
    q2: null,
    q3: null,
    q4: [],
    q5: null,
    q6: null,
    q7: null,
    q9: [],
  });

  function goNext() {
    if (step < TOTAL) {
      setStep(s => s + 1);
    } else {
      const a = {
        q1: answers.q1!,
        q2: answers.q2!,
        q3: answers.q3!,
        q4: answers.q4,
        q5: answers.q5!,
        q6: answers.q6!,
        q7: answers.q7!,
        q9: answers.q9,
      };
      const encoded = encodeAnswers(a);
      router.push(`/result?a=${encoded}`);
    }
  }

  function goBack() {
    setStep(s => s - 1);
  }

  if (step === 1) {
    return (
      <QuestionStep
        questionNumber={1}
        total={TOTAL}
        question="テニス歴・レベルを教えてください"
        options={[
          { value: 'beginner' as Level, label: '初級（〜1年 / 週1未満）' },
          { value: 'beginnerIntermediate' as Level, label: '初中級（1〜3年）' },
          { value: 'intermediate' as Level, label: '中級（3〜10年 / 草トー出る）' },
          { value: 'advanced' as Level, label: '中上級以上（10年〜 / 試合中心）' },
        ]}
        selected={answers.q1 ? [answers.q1] : []}
        maxSelect={1}
        onSelect={(v) => setAnswers(a => ({ ...a, q1: v as Level }))}
        onBack={null}
        onNext={goNext}
      />
    );
  }

  if (step === 2) {
    return (
      <QuestionStep
        questionNumber={2}
        total={TOTAL}
        question="どんなプレーが多いですか"
        options={[
          { value: 'baseline' as PlayStyle, label: 'ベースライン中心', description: 'ストロークで粘るプレー' },
          { value: 'allround' as PlayStyle, label: 'オールラウンド', description: 'どちらもこなす' },
          { value: 'net' as PlayStyle, label: 'ネット中心・ダブルス主体', description: 'ボレーやスマッシュが多い' },
        ]}
        selected={answers.q2 ? [answers.q2] : []}
        maxSelect={1}
        onSelect={(v) => setAnswers(a => ({ ...a, q2: v as PlayStyle }))}
        onBack={goBack}
        onNext={goNext}
      />
    );
  }

  if (step === 3) {
    return (
      <QuestionStep
        questionNumber={3}
        total={TOTAL}
        question="スイングはどちらに近いですか"
        options={[
          { value: 'compact' as SwingSize, label: 'コンパクト（当てる・ブロック気味）' },
          { value: 'standard' as SwingSize, label: '標準' },
          { value: 'full' as SwingSize, label: 'フルスイング（大きく振り切る）' },
        ]}
        selected={answers.q3 ? [answers.q3] : []}
        maxSelect={1}
        onSelect={(v) => setAnswers(a => ({ ...a, q3: v as SwingSize }))}
        onBack={goBack}
        onNext={goNext}
      />
    );
  }

  if (step === 4) {
    return (
      <QuestionStep
        questionNumber={4}
        total={TOTAL}
        question="いま一番困っていることは？（最大2つまで）"
        options={[
          { value: 'noPower' as Problem, label: 'ボールが飛ばない' },
          { value: 'tooMuchPower' as Problem, label: '飛びすぎる・アウトする' },
          { value: 'noSpin' as Problem, label: '回転がかからない' },
          { value: 'lateBall' as Problem, label: '振り遅れる' },
          { value: 'armPain' as Problem, label: '手や腕に衝撃が響く' },
        ]}
        selected={answers.q4}
        maxSelect={2}
        onSelect={(v) => {
          setAnswers(a => {
            const cur = a.q4;
            const val = v as Problem;
            if (cur.includes(val)) return { ...a, q4: cur.filter(x => x !== val) };
            if (cur.length >= 2) return a;
            return { ...a, q4: [...cur, val] };
          });
        }}
        onBack={goBack}
        onNext={goNext}
      />
    );
  }

  if (step === 5) {
    return (
      <QuestionStep
        questionNumber={5}
        total={TOTAL}
        question="肘や肩に不安はありますか"
        options={[
          { value: 'none' as ElbowCondition, label: '特にない' },
          { value: 'sometimes' as ElbowCondition, label: 'たまに気になる' },
          { value: 'painful' as ElbowCondition, label: '痛みがある / 治療中' },
        ]}
        selected={answers.q5 ? [answers.q5] : []}
        maxSelect={1}
        onSelect={(v) => setAnswers(a => ({ ...a, q5: v as ElbowCondition }))}
        onBack={goBack}
        onNext={goNext}
      />
    );
  }

  if (step === 6) {
    return (
      <QuestionStep
        questionNumber={6}
        total={TOTAL}
        question="いま使っているラケットの重さは？"
        options={[
          { value: 'under275' as CurrentWeight, label: '〜275g' },
          { value: '275to290' as CurrentWeight, label: '275〜290g' },
          { value: '290to305' as CurrentWeight, label: '290〜305g' },
          { value: 'over305' as CurrentWeight, label: '305g〜' },
          { value: 'unknown' as CurrentWeight, label: 'わからない / 持っていない' },
        ]}
        selected={answers.q6 ? [answers.q6] : []}
        maxSelect={1}
        onSelect={(v) => setAnswers(a => ({ ...a, q6: v as CurrentWeight }))}
        onBack={goBack}
        onNext={goNext}
      />
    );
  }

  if (step === 7) {
    return (
      <QuestionStep
        questionNumber={7}
        total={TOTAL}
        question="張る予定のストリングは？"
        options={[
          { value: 'poly' as StringType, label: 'ポリエステル', description: '硬くてスピン向き' },
          { value: 'nylon' as StringType, label: 'ナイロン・マルチフィラメント', description: '柔らかくて標準的' },
          { value: 'unknown' as StringType, label: 'わからない' },
        ]}
        selected={answers.q7 ? [answers.q7] : []}
        maxSelect={1}
        onSelect={(v) => setAnswers(a => ({ ...a, q7: v as StringType }))}
        onBack={goBack}
        onNext={goNext}
      />
    );
  }

  // step === 8
  return (
    <QuestionStep
      questionNumber={8}
      total={TOTAL}
      question="気になるブランドはありますか？（任意・複数選択可）"
      options={[
        { value: 'any', label: 'こだわらない' },
        ...BRANDS.map(b => ({ value: b, label: b })),
      ]}
      selected={answers.q9.length === 0 ? ['any'] : answers.q9}
      maxSelect={BRANDS.length}
      onSelect={(v) => {
        setAnswers(a => {
          if (v === 'any') return { ...a, q9: [] };
          const cur = a.q9;
          const val = v as string;
          if (cur.includes(val)) {
            return { ...a, q9: cur.filter(x => x !== val) };
          }
          return { ...a, q9: [...cur, val] };
        });
      }}
      onBack={goBack}
      onNext={goNext}
      canSkip
    />
  );
}
