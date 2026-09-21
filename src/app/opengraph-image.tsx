import { ImageResponse } from 'next/og';
import { OG_ALT, OG_CONTENT_TYPE, OG_SIZE, loadOgFonts, siteOgElement, siteOgText } from '@/lib/og';

export const alt = OG_ALT;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image() {
  const fonts = await loadOgFonts(siteOgText());
  return new ImageResponse(siteOgElement(), { ...size, fonts });
}
