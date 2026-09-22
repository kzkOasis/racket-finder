'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { QuestionStep } from '@/components/QuestionStep';
import type { Level, PlayStyle, SwingSize, Problem, ElbowCondition, CurrentWeight, StringType, Gender } from '@/lib/types';
import { encodeAnswers, BRANDS } from '@/lib/share';

type Answers = {
  gender: Gender | null;
  q1: Level | null;
  q2: PlayStyle | null;
  q3: SwingSize | null;
  q4: Problem[];
  q5: ElbowCondition | null;
  q6: CurrentWeight | null;
  q7: StringType | null;
  q9: string[];
};

const LAST_STEP = 9;
/** ストリングの質問（step 8）は初級には答えられないので飛ばす */
const STRING_STEP = 8;

type Props = {
  /** 見出しとリード文。ボタンより上に出す */
  lead: ReactNode;
  /** 特徴と対応ブランド。ボタンより下 */
  features: ReactNode;
  /** ラケット選びの解説 */
  guide: ReactNode;
};

export function Diagnosis({ lead, features, guide }: Props) {
  const router = useRouter();
  // step 0 = スタート画面、1〜9 = 質問（初級はストリングを飛ばして8問）
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({
    gender: null,
    q1: null,
    q2: null,
    q3: null,
    q4: [],
    q5: null,
    q6: null,
    q7: null,
    q9: [],
  });

  // 初級は「スイングの大きさ」「ストリング」などを答えられないので、質問を差し替える
  const isBeginner = answers.q1 === 'beginner';
  const TOTAL = isBeginner ? LAST_STEP - 1 : LAST_STEP;
  /** 初級はストリングを飛ばすぶん、表示上の番号が1つずれる */
  const shown = (s: number) => (isBeginner && s > STRING_STEP ? s - 1 : s);

  function goNext() {
    if (step < LAST_STEP) {
      if (isBeginner && step === STRING_STEP - 1) {
        // 初級はストリングを聞かず、もっとも一般的なナイロンとして扱う
        setAnswers(a => ({ ...a, q7: 'nylon' }));
        setStep(STRING_STEP + 1);
        return;
      }
      setStep(s => s + 1);
    } else {
      const a = {
        gender: answers.gender!,
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
    setStep(s => (isBeginner && s === STRING_STEP + 1 ? STRING_STEP - 1 : s - 1));
  }

  if (step === 0) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-xl px-4 py-10">
          {lead}
          <button
            onClick={() => setStep(1)}
            className="my-6 w-full rounded-lg bg-blue-500 px-4 py-4 text-lg font-bold text-white transition-colors hover:bg-blue-600"
          >
            診断を始める（無料）
          </button>
          {features}
          <div className="my-8 border-t border-gray-200" />
          {guide}
          <button
            onClick={() => setStep(1)}
            className="mt-8 w-full rounded-lg bg-blue-500 px-4 py-4 text-lg font-bold text-white transition-colors hover:bg-blue-600"
          >
            診断を始める（無料）
          </button>
        </div>
      </main>
    );
  }

  if (step === 1) {
    return (
      <QuestionStep
        questionNumber={shown(1)}
        total={TOTAL}
        question="性別を教えてください"
        options={[
          { value: 'male' as Gender, label: '男性' },
          { value: 'female' as Gender, label: '女性' },
          { value: 'unspecified' as Gender, label: '回答しない' },
        ]}
        selected={answers.gender ? [answers.gender] : []}
        maxSelect={1}
        onSelect={(v) => setAnswers(a => ({ ...a, gender: v as Gender }))}
        onBack={null}
        onNext={goNext}
      />
    );
  }

  if (step === 2) {
    return (
      <QuestionStep
        questionNumber={shown(2)}
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
        onBack={goBack}
        onNext={goNext}
      />
    );
  }

  if (step === 3) {
    return (
      <QuestionStep
        questionNumber={shown(3)}
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

  if (step === 4) {
    // 初級はまだ自分のスイングを客観視できないので、運動経験から推定する
    return (
      <QuestionStep
        questionNumber={shown(4)}
        total={TOTAL}
        question={isBeginner ? '運動経験について教えてください' : 'スイングはどちらに近いですか'}
        options={
          isBeginner
            ? [
                { value: 'compact' as SwingSize, label: '運動はあまりしてこなかった', description: '体力にはあまり自信がない' },
                { value: 'standard' as SwingSize, label: '人並みには動ける', description: 'たまに体を動かす程度' },
                { value: 'full' as SwingSize, label: '他のスポーツをやっていた', description: '振り切る力には自信がある' },
              ]
            : [
                { value: 'compact' as SwingSize, label: 'コンパクト（当てる・ブロック気味）' },
                { value: 'standard' as SwingSize, label: '標準' },
                { value: 'full' as SwingSize, label: 'フルスイング（大きく振り切る）' },
              ]
        }
        selected={answers.q3 ? [answers.q3] : []}
        maxSelect={1}
        onSelect={(v) => setAnswers(a => ({ ...a, q3: v as SwingSize }))}
        onBack={goBack}
        onNext={goNext}
      />
    );
  }

  if (step === 5) {
    // 初級はまだ「困りごと」を言語化できないので、不安として聞き、飛ばせるようにする
    return (
      <QuestionStep
        questionNumber={shown(5)}
        total={TOTAL}
        question={
          isBeginner
            ? '不安に感じていることはありますか？（任意・最大2つまで）'
            : 'いま一番困っていることは？（最大2つまで）'
        }
        options={
          isBeginner
            ? [
                { value: 'noPower' as Problem, label: 'ボールが相手コートまで飛ばない' },
                { value: 'tooMuchPower' as Problem, label: '打つとコートから出てしまう' },
                { value: 'noSpin' as Problem, label: '回転のかけ方がわからない' },
                { value: 'lateBall' as Problem, label: '速いボールに振り遅れる' },
                { value: 'armPain' as Problem, label: '手や腕がしびれる・痛くなる' },
              ]
            : [
                { value: 'noPower' as Problem, label: 'ボールが飛ばない' },
                { value: 'tooMuchPower' as Problem, label: '飛びすぎる・アウトする' },
                { value: 'noSpin' as Problem, label: '回転がかからない' },
                { value: 'lateBall' as Problem, label: '振り遅れる' },
                { value: 'armPain' as Problem, label: '手や腕に衝撃が響く' },
              ]
        }
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
        canSkip={isBeginner}
      />
    );
  }

  if (step === 6) {
    return (
      <QuestionStep
        questionNumber={shown(6)}
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

  if (step === 7) {
    // 初級は自分のラケットの重さを知らないことが多いので「持っていない」を先頭に置く
    return (
      <QuestionStep
        questionNumber={shown(7)}
        total={TOTAL}
        question={isBeginner ? 'いまラケットは持っていますか？' : 'いま使っているラケットの重さは？'}
        options={
          isBeginner
            ? [
                { value: 'unknown' as CurrentWeight, label: 'まだ持っていない・わからない' },
                { value: 'under275' as CurrentWeight, label: '持っていて、かなり軽い', description: '〜275g' },
                { value: '275to290' as CurrentWeight, label: '持っていて、軽め', description: '275〜290g' },
                { value: '290to305' as CurrentWeight, label: '持っていて、標準的', description: '290〜305g' },
                { value: 'over305' as CurrentWeight, label: '持っていて、重め', description: '305g〜' },
              ]
            : [
                { value: 'under275' as CurrentWeight, label: '〜275g' },
                { value: '275to290' as CurrentWeight, label: '275〜290g' },
                { value: '290to305' as CurrentWeight, label: '290〜305g' },
                { value: 'over305' as CurrentWeight, label: '305g〜' },
                { value: 'unknown' as CurrentWeight, label: 'わからない / 持っていない' },
              ]
        }
        selected={answers.q6 ? [answers.q6] : []}
        maxSelect={1}
        onSelect={(v) => setAnswers(a => ({ ...a, q6: v as CurrentWeight }))}
        onBack={goBack}
        onNext={goNext}
      />
    );
  }

  if (step === 8) {
    return (
      <QuestionStep
        questionNumber={shown(8)}
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

  // step === 9
  return (
    <QuestionStep
      questionNumber={shown(9)}
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
