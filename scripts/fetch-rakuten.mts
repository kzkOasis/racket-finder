/**
 * 楽天市場商品検索APIで、各ラケットの「商品画像」と「アフィリエイトURL」を取得し、
 * src/data/rackets.json に書き戻す。
 *
 * ビルド前に手動で実行するスクリプト。本番のページ表示のたびにAPIを呼ばない。
 *
 *   npm run fetch:rakuten -- --dry-run      書き込まずに結果だけ表示（最初はこれで確認する）
 *   npm run fetch:rakuten -- --only <id>    1本だけ試す
 *   npm run fetch:rakuten -- --limit 5      先頭5本だけ
 *
 * 必要な環境変数（.env.local に置く。.gitignore 済みなのでコミットされない）:
 *   RAKUTEN_APP_ID        アプリID
 *   RAKUTEN_ACCESS_KEY    アクセスキー（2026年の仕様変更で必須になった）
 *   RAKUTEN_AFFILIATE_ID  楽天アフィリエイトID（渡すと affiliateUrl が返る）
 *
 * 任意の上書き:
 *   RAKUTEN_API_BASE / RAKUTEN_API_VERSION / RAKUTEN_GENRE_ID / RAKUTEN_AUTH_MODE / RAKUTEN_MIN_PRICE
 *
 * 取得結果は必ず `git diff` で目視確認してからコミットすること。
 * APIを使う場合、ページに楽天ウェブサービスのクレジット表記が必要（layout.tsx のフッター）。
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import type { RacketSpec } from '../src/lib/types';

// 2026年の仕様変更でエンドポイントが移行し、アクセスキーが必要になった。
// 最新の仕様は https://webservice.rakuten.co.jp/documentation/ichiba-item-search で確認する。
const DEFAULT_API_BASE = 'https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search';
const DEFAULT_API_VERSION = '20260701';
const DEFAULT_MIN_PRICE = 8000;

export type RakutenItem = {
  itemName: string;
  itemPrice: number;
  itemUrl: string;
  affiliateUrl?: string;
  imageUrl: string;
  shopName?: string;
};

function pickImageUrl(value: unknown): string {
  if (!Array.isArray(value) || value.length === 0) return '';
  const first = value[0];
  if (typeof first === 'string') return first;
  if (first && typeof first === 'object' && 'imageUrl' in first) {
    return String((first as { imageUrl: unknown }).imageUrl ?? '');
  }
  return '';
}

/** レスポンスから商品の配列を取り出す。formatVersion 1 / 2 のどちらの形でも受ける。 */
export function normalizeItems(json: unknown): RakutenItem[] {
  if (!json || typeof json !== 'object') return [];
  const container = json as Record<string, unknown>;
  const raw = Array.isArray(json) ? json : (container.Items ?? container.items);
  if (!Array.isArray(raw)) return [];

  return raw
    .map((entry): RakutenItem | null => {
      // formatVersion=1 は { Item: {...} }、2 は {...} が直接入る
      const item = (entry && typeof entry === 'object' && 'Item' in entry
        ? (entry as { Item: unknown }).Item
        : entry) as Record<string, unknown> | null;
      if (!item || typeof item.itemName !== 'string') return null;
      return {
        itemName: item.itemName,
        itemPrice: Number(item.itemPrice ?? 0),
        itemUrl: String(item.itemUrl ?? ''),
        affiliateUrl: typeof item.affiliateUrl === 'string' && item.affiliateUrl
          ? item.affiliateUrl
          : undefined,
        imageUrl: pickImageUrl(item.mediumImageUrls),
        shopName: typeof item.shopName === 'string' ? item.shopName : undefined,
      };
    })
    .filter((i): i is RakutenItem => i !== null);
}

/** 商品名に含まれていたら「ラケット本体ではない」と判断する語。 */
export const EXCLUDE_WORDS = [
  'ガットのみ', 'ストリング', 'ロールガット', 'グリップテープ', 'オーバーグリップ',
  'ラケットケース', 'ラケットバッグ', 'カバーのみ', '振動止め', 'ダンパー',
  'ボール', 'シューズ', 'ウェア', 'キャップ', '福袋', 'ジュニア', '子供用',
  '中古', 'USED', '訳あり', 'ソフトテニス', '軟式',
];

/** 楽天の商品名はカタカナ表記が多いので、ブランド名の別表記を持っておく。 */
export const BRAND_ALIASES: Record<string, string[]> = {
  Yonex: ['ヨネックス'],
  Wilson: ['ウイルソン', 'ウィルソン'],
  Babolat: ['バボラ'],
  Head: ['ヘッド'],
  Dunlop: ['ダンロップ'],
  Tecnifibre: ['テクニファイバー'],
  Prince: ['プリンス'],
};

/** その商品がラケット本体らしいかを採点する。-1 は除外。 */
export function scoreCandidate(item: RakutenItem, racket: RacketSpec): number {
  if (EXCLUDE_WORDS.some(w => item.itemName.toLowerCase().includes(w.toLowerCase()))) {
    return -1;
  }

  const name = item.itemName.toLowerCase();
  let score = 0;
  const brandNames = [racket.brand, ...(BRAND_ALIASES[racket.brand] ?? [])];
  if (brandNames.some(b => name.includes(b.toLowerCase()))) score += 2;

  for (const token of racket.model.split(/\s+/).filter(Boolean)) {
    if (name.includes(token.toLowerCase())) score += /^\d+$/.test(token) ? 1 : 2;
  }
  return score;
}

/**
 * 採用する1件を選ぶ。一致度が高いものを優先し、同点なら安いものを採る。
 * 画像が無い商品は（画像の差し替えが目的なので）採らない。
 */
export function pickBestItem(
  items: RakutenItem[],
  racket: RacketSpec,
  minPrice = DEFAULT_MIN_PRICE,
): RakutenItem | null {
  const scored = items
    .map(item => ({ item, score: scoreCandidate(item, racket) }))
    .filter(x => x.score > 0 && x.item.itemPrice >= minPrice && x.item.imageUrl !== '');
  if (scored.length === 0) return null;

  const best = Math.max(...scored.map(x => x.score));
  return scored
    .filter(x => x.score === best)
    .sort((a, b) => a.item.itemPrice - b.item.itemPrice)[0].item;
}

export function buildKeyword(racket: RacketSpec): string {
  return `${racket.brand} ${racket.model} 硬式 テニスラケット`;
}

/** 楽天のサムネイルURLには ?_ex=128x128 が付くので、大きいサイズに差し替える。 */
export function toLargeImageUrl(url: string): string {
  if (!url) return '';
  return `${url.split('?')[0]}?_ex=500x500`;
}

/**
 * 取得した商品をラケットに反映する。price は診断で使っていないので触らない。
 * アフィリエイトURLが返らなかった場合は、既存のリンクを壊さずそのまま残す。
 */
export function mergeRacket(racket: RacketSpec, item: RakutenItem): RacketSpec {
  return {
    ...racket,
    imageUrl: toLargeImageUrl(item.imageUrl) || racket.imageUrl,
    affiliateUrl: {
      ...racket.affiliateUrl,
      rakuten: item.affiliateUrl ?? racket.affiliateUrl.rakuten,
    },
  };
}

// ============================================================
// ここから下は実行時のみ（テストからは import されるだけで走らない）
// ============================================================

type AuthMode = 'query' | 'header' | 'bearer';
const AUTH_MODES: AuthMode[] = ['query', 'header', 'bearer'];

export function buildRequest(
  mode: AuthMode,
  params: URLSearchParams,
  creds: { appId: string; accessKey: string },
): { url: string; headers: Record<string, string> } {
  const base = process.env.RAKUTEN_API_BASE ?? DEFAULT_API_BASE;
  const version = process.env.RAKUTEN_API_VERSION ?? DEFAULT_API_VERSION;
  const q = new URLSearchParams(params);
  q.set('applicationId', creds.appId);
  const headers: Record<string, string> = { Accept: 'application/json' };

  if (mode === 'query') q.set('accessKey', creds.accessKey);
  if (mode === 'header') headers['x-rakuten-access-key'] = creds.accessKey;
  if (mode === 'bearer') headers['Authorization'] = `Bearer ${creds.accessKey}`;

  return { url: `${base}/${version}?${q.toString()}`, headers };
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const dryRun = argv.includes('--dry-run');
  const only = argv.includes('--only') ? argv[argv.indexOf('--only') + 1] : undefined;
  const limit = argv.includes('--limit') ? Number(argv[argv.indexOf('--limit') + 1]) : Infinity;
  const minPrice = Number(process.env.RAKUTEN_MIN_PRICE ?? DEFAULT_MIN_PRICE);

  try {
    process.loadEnvFile('.env.local');
  } catch {
    // .env.local が無ければ環境変数をそのまま使う
  }

  const appId = process.env.RAKUTEN_APP_ID;
  const accessKey = process.env.RAKUTEN_ACCESS_KEY ?? '';
  const affiliateId = process.env.RAKUTEN_AFFILIATE_ID;
  if (!appId) {
    console.error('RAKUTEN_APP_ID がありません。.env.local に書いてください。');
    process.exit(1);
  }
  if (!affiliateId) {
    console.warn('⚠ RAKUTEN_AFFILIATE_ID がありません。アフィリエイトURLは既存の値を残します。');
  }

  const dataPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/data/rackets.json');
  const rackets: RacketSpec[] = JSON.parse(readFileSync(dataPath, 'utf-8'));
  const targets = rackets.filter(r => !only || r.id === only).slice(0, limit);

  let authMode: AuthMode | null = (process.env.RAKUTEN_AUTH_MODE as AuthMode) ?? null;
  const updated = new Map<string, RacketSpec>();
  const report: string[] = [];

  for (const racket of targets) {
    const params = new URLSearchParams({
      keyword: buildKeyword(racket),
      hits: '20',
      sort: '+itemPrice',
      format: 'json',
      formatVersion: '2',
      imageFlag: '1',
      availability: '1',
    });
    if (affiliateId) params.set('affiliateId', affiliateId);
    if (process.env.RAKUTEN_GENRE_ID) params.set('genreId', process.env.RAKUTEN_GENRE_ID);

    let items: RakutenItem[] | null = null;
    let lastError = '';
    const modes: AuthMode[] = authMode ? [authMode] : AUTH_MODES;
    for (const mode of modes) {
      const { url, headers } = buildRequest(mode, params, { appId, accessKey });
      try {
        const res = await fetch(url, { headers });
        if (!res.ok) {
          lastError = `${mode}: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`;
          continue;
        }
        items = normalizeItems(await res.json());
        if (!authMode) {
          authMode = mode;
          console.log(`認証方式: ${mode}\n`);
        }
        break;
      } catch (e) {
        lastError = `${mode}: ${String(e)}`;
      }
    }

    if (items === null) {
      report.push(`✗ ${racket.id}: APIエラー ${lastError}`);
      console.error('  全ての認証方式が失敗する場合は、公式ドキュメントでキーの渡し方を確認し、');
      console.error('  RAKUTEN_AUTH_MODE=query|header|bearer や RAKUTEN_API_BASE で上書きしてください。');
      break; // 認証が通らない状態で40本叩いても無駄なので止める
    }

    const picked = pickBestItem(items, racket, minPrice);
    if (!picked) {
      report.push(`- ${racket.id}: 該当なし（${items.length}件中）。既存の値を維持`);
    } else {
      updated.set(racket.id, mergeRacket(racket, picked));
      report.push(`✓ ${racket.id}\n    ${picked.itemName.slice(0, 70)}\n    ¥${picked.itemPrice} / ${picked.shopName ?? '-'}`);
    }

    await new Promise(r => setTimeout(r, 1100)); // 楽天APIのレート制限に配慮
  }

  console.log('\n' + report.join('\n'));
  console.log(`\n${updated.size}/${targets.length} 本を更新${dryRun ? '（--dry-run のため書き込みなし）' : ''}`);

  if (!dryRun && updated.size > 0) {
    writeFileSync(dataPath, JSON.stringify(rackets.map(r => updated.get(r.id) ?? r), null, 2), 'utf-8');
    console.log('src/data/rackets.json を更新しました。git diff で確認してからコミットしてください。');
  }
}

if (process.argv[1] && import.meta.url === `file://${path.resolve(process.argv[1])}`) {
  await main();
}
