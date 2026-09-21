import { ImageResponse } from 'next/og';
import type { NextRequest } from 'next/server';
import { getTopRacket } from '@/lib/result';
import {
  OG_SIZE,
  loadOgFonts,
  resultOgElement,
  resultOgText,
  siteOgElement,
  siteOgText,
} from '@/lib/og';

// 結果ページのOGP画像。`?a=` の回答を診断して1位のラケットを描画する。
// （opengraph-image.tsx はクエリ文字列を受け取れないため Route Handler で返す）
export async function GET(request: NextRequest) {
  const encoded = request.nextUrl.searchParams.get('a') ?? '';
  const racket = getTopRacket(encoded);

  // 回答が不正なときはサイト共通の画像を返す
  const element = racket ? resultOgElement(racket) : siteOgElement();
  const text = racket ? resultOgText(racket) : siteOgText();

  try {
    const fonts = await loadOgFonts(text);
    return new ImageResponse(element, {
      ...OG_SIZE,
      fonts,
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
      },
    });
  } catch (e) {
    console.error('[og] failed to generate image:', e);
    return new Response('Failed to generate the image', { status: 500 });
  }
}
