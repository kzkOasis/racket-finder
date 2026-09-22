import { describe, it, expect } from 'vitest';
import {
  normalizeItems,
  scoreCandidate,
  pickBestItem,
  buildKeyword,
  toLargeImageUrl,
  mergeRacket,
  buildRequest,
  type RakutenItem,
} from '../fetch-rakuten.mjs';
import type { RacketSpec } from '../../src/lib/types';

const racket: RacketSpec = {
  id: 'yonex-ezone-100-2024',
  brand: 'Yonex',
  series: 'EZONE',
  model: 'EZONE 100',
  year: 2024,
  weight: 300,
  balance: 320,
  swingWeight: 300,
  headSize: 100,
  ra: 68,
  beamWidth: 23,
  pattern: '16x19',
  character: 'power',
  popularity: 'high',
  price: 38000,
  imageUrl: 'https://img.tennis-warehouse.com/watermark/rs.php?path=EZ10BB-1.jpg&nw=455',
  affiliateUrl: { rakuten: 'https://hb.afl.rakuten.co.jp/ichiba/OLD/?pc=old', amazon: '' },
};

function item(over: Partial<RakutenItem> = {}): RakutenItem {
  return {
    itemName: 'ヨネックス EZONE 100 硬式テニスラケット',
    itemPrice: 34800,
    itemUrl: 'https://item.rakuten.co.jp/shop/ez100/',
    affiliateUrl: 'https://hb.afl.rakuten.co.jp/ichiba/NEW/?pc=new',
    imageUrl: 'https://thumbnail.image.rakuten.co.jp/@0_mall/shop/cabinet/ez100.jpg?_ex=128x128',
    shopName: 'テニスショップ',
    ...over,
  };
}

describe('normalizeItems', () => {
  it('formatVersion=2（商品が直接入る形）を読める', () => {
    const items = normalizeItems({
      Items: [{
        itemName: 'ヨネックス EZONE 100',
        itemPrice: 34800,
        itemUrl: 'https://item.rakuten.co.jp/shop/a/',
        affiliateUrl: 'https://hb.afl.rakuten.co.jp/x',
        mediumImageUrls: ['https://thumbnail.image.rakuten.co.jp/a.jpg?_ex=128x128'],
      }],
    });
    expect(items).toHaveLength(1);
    expect(items[0].itemPrice).toBe(34800);
    expect(items[0].imageUrl).toContain('a.jpg');
  });

  it('formatVersion=1（{ Item: {...} } で包まれる形）も読める', () => {
    const items = normalizeItems({
      Items: [{
        Item: {
          itemName: 'ヨネックス EZONE 100',
          itemPrice: 34800,
          itemUrl: 'https://item.rakuten.co.jp/shop/a/',
          mediumImageUrls: [{ imageUrl: 'https://thumbnail.image.rakuten.co.jp/a.jpg?_ex=128x128' }],
        },
      }],
    });
    expect(items).toHaveLength(1);
    expect(items[0].imageUrl).toContain('a.jpg');
  });

  it('想定外のレスポンスでも落ちずに空配列を返す', () => {
    expect(normalizeItems(null)).toEqual([]);
    expect(normalizeItems({})).toEqual([]);
    expect(normalizeItems({ Items: 'なにか' })).toEqual([]);
    expect(normalizeItems({ Items: [{ itemName: 123 }] })).toEqual([]);
  });
});

describe('scoreCandidate', () => {
  it('カタカナのブランド名でも一致する', () => {
    expect(scoreCandidate(item(), racket)).toBeGreaterThan(0);
  });

  it('ガット・ケース・ジュニアなどラケット本体でないものを除外する', () => {
    for (const name of [
      'ヨネックス EZONE 100 専用ラケットケース',
      'ヨネックス ストリング ポリツアープロ',
      'ヨネックス EZONE 100 ジュニア',
      '【中古】ヨネックス EZONE 100',
      'ヨネックス EZONE 100 ソフトテニス用',
    ]) {
      expect(scoreCandidate(item({ itemName: name }), racket), name).toBe(-1);
    }
  });

  it('別のモデルより、モデル名が一致する商品の方が高い点になる', () => {
    const exact = scoreCandidate(item({ itemName: 'ヨネックス EZONE 100' }), racket);
    const other = scoreCandidate(item({ itemName: 'ヨネックス VCORE 98' }), racket);
    expect(exact).toBeGreaterThan(other);
  });
});

describe('pickBestItem', () => {
  it('一致度が同じなら安い方を採る', () => {
    const picked = pickBestItem(
      [item({ itemPrice: 39800 }), item({ itemPrice: 34800 }), item({ itemPrice: 36000 })],
      racket,
    );
    expect(picked?.itemPrice).toBe(34800);
  });

  it('安くても一致度が低い商品より、高くても一致する商品を採る', () => {
    const picked = pickBestItem(
      [item({ itemName: 'テニスラケット 100', itemPrice: 9000 }), item({ itemPrice: 34800 })],
      racket,
    );
    expect(picked?.itemPrice).toBe(34800);
  });

  it('画像がない商品は採らない（画像の差し替えが目的のため）', () => {
    expect(pickBestItem([item({ imageUrl: '' })], racket)).toBeNull();
  });

  it('下限価格より安い商品は採らない（部品や別商品を弾く）', () => {
    expect(pickBestItem([item({ itemPrice: 3000 })], racket)).toBeNull();
  });

  it('該当がなければ null（呼び出し側で既存の値を維持する）', () => {
    expect(pickBestItem([], racket)).toBeNull();
    expect(pickBestItem([item({ itemName: 'ダンロップ CX 200' })], racket)).toBeNull();
  });
});

describe('mergeRacket', () => {
  it('画像とアフィリエイトURLを差し替え、price は触らない', () => {
    const merged = mergeRacket(racket, item());
    expect(merged.imageUrl).toBe('https://thumbnail.image.rakuten.co.jp/@0_mall/shop/cabinet/ez100.jpg?_ex=500x500');
    expect(merged.imageUrl).not.toContain('tennis-warehouse');
    expect(merged.affiliateUrl.rakuten).toBe('https://hb.afl.rakuten.co.jp/ichiba/NEW/?pc=new');
    expect(merged.price).toBe(racket.price);
    expect(merged.weight).toBe(racket.weight);
  });

  it('アフィリエイトURLが返らなければ既存のリンクを壊さない', () => {
    const merged = mergeRacket(racket, item({ affiliateUrl: undefined }));
    expect(merged.affiliateUrl.rakuten).toBe(racket.affiliateUrl.rakuten);
  });
});

describe('その他', () => {
  it('検索キーワードに「硬式 テニスラケット」を付ける', () => {
    expect(buildKeyword(racket)).toBe('Yonex EZONE 100 硬式 テニスラケット');
  });

  it('サムネイルURLを大きいサイズに差し替える', () => {
    expect(toLargeImageUrl('https://x.jp/a.jpg?_ex=128x128')).toBe('https://x.jp/a.jpg?_ex=500x500');
    expect(toLargeImageUrl('https://x.jp/a.jpg')).toBe('https://x.jp/a.jpg?_ex=500x500');
    expect(toLargeImageUrl('')).toBe('');
  });

  it('認証方式ごとにキーの渡し方が変わる', () => {
    const params = new URLSearchParams({ keyword: 'test' });
    const creds = { appId: 'APP', accessKey: 'KEY' };

    const q = buildRequest('query', params, creds);
    expect(q.url).toContain('applicationId=APP');
    expect(q.url).toContain('accessKey=KEY');

    const h = buildRequest('header', params, creds);
    expect(h.headers['x-rakuten-access-key']).toBe('KEY');
    expect(h.url).not.toContain('accessKey=KEY');

    const b = buildRequest('bearer', params, creds);
    expect(b.headers['Authorization']).toBe('Bearer KEY');
  });
});
