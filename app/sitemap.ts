import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/site';
import { DIVISIONS } from '@/lib/divisions';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const statics: MetadataRoute.Sitemap = [
    { url: SITE.url, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE.url}/services`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${SITE.url}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${SITE.url}/about`, lastModified: now, changeFrequency: 'yearly', priority: 0.6 },
    {
      url: `${SITE.url}/service-area`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];

  const divisions: MetadataRoute.Sitemap = DIVISIONS.map((d) => ({
    url: `${SITE.url}/${d.slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.9,
  }));

  return [...statics, ...divisions];
}
