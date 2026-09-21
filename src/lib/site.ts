/** 公開URL。本番では NEXT_PUBLIC_SITE_URL を設定する。 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://racket-finder-two.vercel.app';

/** OGP画像のフッターなどに出す表示用ドメイン。 */
export const SITE_DOMAIN = SITE_URL.replace(/^https?:\/\//, '').replace(/\/$/, '');

export const SITE_NAME = 'テニスラケット診断';
export const SITE_TAGLINE = '9問・約1分で、あなたに合うラケットを3本提案';
