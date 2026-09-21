import type { MetadataRoute } from 'next';
import { SITE_URL as BASE_URL } from '@/lib/site';
import type { RacketSpec } from '@/lib/types';
import racketData from '@/data/rackets.json';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const rackets = racketData as RacketSpec[];

  return [
    {
      url: BASE_URL,
      lastModified,
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: `${BASE_URL}/rackets`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    ...rackets.map(r => ({
      url: `${BASE_URL}/rackets/${r.id}`,
      lastModified,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ];
}
