import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/site';

/**
 * Everything is open, including the answer engines. For a local contractor,
 * being quotable by ChatGPT, Claude, Perplexity and Google's AI surfaces is
 * free distribution — there is nothing here worth hiding from them.
 */
const AI_AGENTS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-User',
  'Claude-SearchBot',
  'anthropic-ai',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Applebot-Extended',
  'Bingbot',
  'CCBot',
  'Amazonbot',
  'meta-externalagent',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/api/'] },
      ...AI_AGENTS.map((ua) => ({ userAgent: ua, allow: '/' })),
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
