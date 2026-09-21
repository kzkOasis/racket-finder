import type { ReactElement } from 'react';
import { SITE_DOMAIN, SITE_NAME, SITE_TAGLINE } from './site';
import type { RacketSpec } from './types';

export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_CONTENT_TYPE = 'image/png';
export const OG_ALT = `${SITE_NAME} | ${SITE_TAGLINE}`;

const FONT_FAMILY = 'Noto Sans JP';

type OgFont = {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 700;
  style: 'normal';
};

async function fetchGoogleFont(weight: 400 | 700, text: string): Promise<ArrayBuffer> {
  // ImageResponse の標準フォントは日本語を含まないため、
  // Google Fonts から「画像に出す文字だけ」をサブセットとして取得する。
  const url =
    `https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@${weight}` +
    `&text=${encodeURIComponent(text)}`;
  const cssRes = await fetch(url, { cache: 'force-cache' });
  if (!cssRes.ok) throw new Error(`font css request failed: ${cssRes.status}`);
  const css = await cssRes.text();
  // Satori が読めるのは ttf / otf / woff のみ（woff2 は不可）
  const match = css.match(/src:\s*url\((.+?)\)\s*format\('(?:opentype|truetype)'\)/);
  if (!match) throw new Error('no ttf/otf font url in google fonts css');
  const fontRes = await fetch(match[1], { cache: 'force-cache' });
  if (!fontRes.ok) throw new Error(`font download failed: ${fontRes.status}`);
  return fontRes.arrayBuffer();
}

/**
 * 画像に描画する文字だけを含む Noto Sans JP（400 / 700）を読み込む。
 * 取得に失敗した場合は空配列を返し、呼び出し側はフォント指定なしで画像を返す。
 */
export async function loadOgFonts(...texts: string[]): Promise<OgFont[]> {
  const subset = Array.from(new Set(texts.join(''))).join('');
  if (!subset) return [];
  try {
    const [regular, bold] = await Promise.all([
      fetchGoogleFont(400, subset),
      fetchGoogleFont(700, subset),
    ]);
    return [
      { name: FONT_FAMILY, data: regular, weight: 400, style: 'normal' },
      { name: FONT_FAMILY, data: bold, weight: 700, style: 'normal' },
    ];
  } catch (e) {
    console.error('[og] failed to load Noto Sans JP:', e);
    return [];
  }
}

const frameStyle = {
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column' as const,
  justifyContent: 'space-between',
  backgroundColor: '#0f172a',
  backgroundImage: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 55%, #15803d 100%)',
  color: '#ffffff',
  padding: '64px 72px',
  fontFamily: FONT_FAMILY,
};

const eyebrowStyle = {
  display: 'flex',
  fontSize: 32,
  fontWeight: 700,
  color: '#bbf7d0',
  letterSpacing: 2,
};

const footerStyle = {
  display: 'flex',
  fontSize: 26,
  color: '#cbd5e1',
};

/** トップページ用・不正な回答用の共通画像。 */
export function siteOgElement(): ReactElement {
  return (
    <div style={frameStyle}>
      <div style={eyebrowStyle}>{SITE_DOMAIN}</div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', fontSize: 92, fontWeight: 700, lineHeight: 1.15 }}>
          {SITE_NAME}
        </div>
        <div style={{ display: 'flex', fontSize: 40, color: '#e2e8f0', marginTop: 24 }}>
          {SITE_TAGLINE}
        </div>
      </div>
      <div style={footerStyle}>Yonex / Wilson / Babolat / Head / Dunlop / Tecnifibre / Prince</div>
    </div>
  );
}

/** 診断結果用の画像。1位のブランド名・モデル名を大きく描画する。 */
export function resultOgElement(racket: RacketSpec): ReactElement {
  return (
    <div style={frameStyle}>
      <div style={eyebrowStyle}>{SITE_NAME}</div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', fontSize: 36, color: '#e2e8f0' }}>
          あなたにおすすめのラケットは
        </div>
        <div style={{ display: 'flex', fontSize: 44, fontWeight: 700, color: '#bbf7d0', marginTop: 20 }}>
          {racket.brand}
        </div>
        <div style={{ display: 'flex', fontSize: 88, fontWeight: 700, lineHeight: 1.15 }}>
          {racket.model}
        </div>
        <div style={{ display: 'flex', fontSize: 32, color: '#e2e8f0', marginTop: 20 }}>
          {`${racket.weight}g / フェイス ${racket.headSize}in² / ${racket.pattern}`}
        </div>
      </div>
      <div style={footerStyle}>{`${SITE_TAGLINE} - ${SITE_DOMAIN}`}</div>
    </div>
  );
}

/** siteOgElement が描画する文字の集合。 */
export function siteOgText(): string {
  return `${SITE_DOMAIN}${SITE_NAME}${SITE_TAGLINE}Yonex / Wilson / Babolat / Head / Dunlop / Tecnifibre / Prince`;
}

/** resultOgElement が描画する文字の集合。 */
export function resultOgText(racket: RacketSpec): string {
  return (
    `${SITE_NAME}あなたにおすすめのラケットは` +
    `${racket.brand}${racket.model}` +
    `${racket.weight}g / フェイス ${racket.headSize}in² / ${racket.pattern}` +
    `${SITE_TAGLINE} - ${SITE_DOMAIN}`
  );
}
