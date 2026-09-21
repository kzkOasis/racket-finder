/** 日本語の検索に合わせて、ブランド名のカタカナ表記を画面にも出す。 */
export const BRAND_KANA: Record<string, string> = {
  Yonex: 'ヨネックス',
  Wilson: 'ウイルソン',
  Babolat: 'バボラ',
  Head: 'ヘッド',
  Dunlop: 'ダンロップ',
  Tecnifibre: 'テクニファイバー',
  Prince: 'プリンス',
};

export function brandLabel(brand: string): string {
  const kana = BRAND_KANA[brand];
  return kana ? `${brand}（${kana}）` : brand;
}
