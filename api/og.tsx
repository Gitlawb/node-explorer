import { readFile } from 'node:fs/promises';

import { ImageResponse } from '@vercel/og';
import type { ImageResponseOptions } from '@vercel/og';
import { parse, type OpenTypeFont } from '@shuding/opentype.js';

import {
  buildRepoSocialModel,
  cleanSocialText,
  normalizeRepoOwner,
  type RepoSocialModel,
} from './_lib/repoSocial';
import { GenericOgCard, OG_HEIGHT, OG_WIDTH, RepositoryOgCard } from './_lib/og-layout';
import { fetchRepository } from './_lib/repository';

const IMMUTABLE_CACHE_CONTROL =
  'public, max-age=31536000, s-maxage=31536000, immutable, no-transform';
const REPOSITORY_CACHE_CONTROL =
  'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400, no-transform';
const FALLBACK_CACHE_CONTROL =
  'public, max-age=60, s-maxage=300, stale-while-revalidate=600, no-transform';

const regularFontUrl = new URL(
  '../node_modules/@expo-google-fonts/jetbrains-mono/400Regular/JetBrainsMono_400Regular.ttf',
  import.meta.url,
);
const boldFontUrl = new URL(
  '../node_modules/@expo-google-fonts/jetbrains-mono/700Bold/JetBrainsMono_700Bold.ttf',
  import.meta.url,
);

type OgFonts = NonNullable<ImageResponseOptions['fonts']>;

interface FontAssets {
  fonts: OgFonts;
  regular: OpenTypeFont;
}

function exactArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

// Start both reads at module initialization so concurrent requests share the
// same work. TTF is intentional: Satori cannot render WOFF2 font data.
const fontAssetsPromise: Promise<FontAssets> = Promise.all([
  readFile(regularFontUrl),
  readFile(boldFontUrl),
]).then(([regular, bold]) => {
  const regularData = exactArrayBuffer(regular);
  const boldData = exactArrayBuffer(bold);
  return {
    fonts: [
      {
        name: 'JetBrains Mono',
        data: regularData,
        style: 'normal' as const,
        weight: 400 as const,
      },
      {
        name: 'JetBrains Mono',
        data: boldData,
        style: 'normal' as const,
        weight: 700 as const,
      },
    ],
    regular: parse(regularData),
  };
});

function sanitizeForFont(value: string, font: OpenTypeFont): string {
  const segments = typeof Intl.Segmenter === 'function'
    ? Array.from(
        new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(value),
        part => part.segment,
      )
    : Array.from(value);

  let missingRun = false;
  const output: string[] = [];

  for (const segment of segments) {
    if (Array.from(segment).every(character => font.charToGlyphIndex(character) > 0)) {
      output.push(segment);
      missingRun = false;
      continue;
    }

    const asciiFallback = segment.normalize('NFKD')
      .replace(/\p{Mark}/gu, '')
      .replace(/[^\x20-\x7E]/g, '');
    if (asciiFallback) {
      output.push(asciiFallback);
      missingRun = false;
    } else if (!missingRun) {
      output.push('?');
      missingRun = true;
    }
  }

  return output.join('');
}

function sanitizeModelForFont(model: RepoSocialModel, font: OpenTypeFont): RepoSocialModel {
  return {
    ...model,
    branch: sanitizeForFont(model.branch, font),
    description: sanitizeForFont(model.description, font),
    name: sanitizeForFont(model.name, font),
  };
}

interface RepositoryQuery {
  name: string;
  owner: string;
  version: string;
}

function parseRepositoryQuery(request: Request): RepositoryQuery | null {
  const search = new URL(request.url).searchParams;
  const rawOwner = search.get('owner');
  const rawName = search.get('name');

  if (!rawOwner || !rawName) return null;
  if (Array.from(rawOwner).length > 512 || Array.from(rawName).length > 256) return null;

  const owner = normalizeRepoOwner(rawOwner).canonicalSegment;
  const name = cleanSocialText(rawName, 256);
  if (!owner || !name) return null;

  return {
    name,
    owner,
    version: cleanSocialText(search.get('v'), 160),
  };
}

function cacheControl(model: RepoSocialModel | null, version: string): string {
  if (!model) return FALLBACK_CACHE_CONTROL;
  if (version && version === model.cacheVersion) return IMMUTABLE_CACHE_CONTROL;
  return REPOSITORY_CACHE_CONTROL;
}

/**
 * Render one public repository preview. Missing, private, malformed, and
 * upstream-error requests intentionally collapse to the same generic card so
 * private repository metadata is never disclosed through image generation.
 */
export async function GET(request: Request): Promise<Response> {
  const query = parseRepositoryQuery(request);
  let model: RepoSocialModel | null = null;

  if (query) {
    try {
      const result = await fetchRepository(query.owner, query.name, request.signal);
      if (result.status === 'ok' && result.repository.is_public) {
        model = buildRepoSocialModel(result.repository);
      }
    } catch {
      // Image crawlers should always receive a valid branded PNG, even if an
      // unexpected model or renderer input failure occurs upstream.
      model = null;
    }
  }

  const fontAssets = await fontAssetsPromise;
  const renderModel = model ? sanitizeModelForFont(model, fontAssets.regular) : null;
  const variant = model ? 'repository' : 'generic';
  const headers = {
    // Lower-case keys replace @vercel/og's defaults instead of being folded
    // into duplicate comma-separated values by the Headers constructor.
    'cache-control': cacheControl(model, query?.version ?? ''),
    'content-type': 'image/png',
    'x-content-type-options': 'nosniff',
    'x-gitlawb-og-variant': variant,
  };

  return new ImageResponse(
    renderModel ? <RepositoryOgCard model={renderModel} /> : <GenericOgCard />,
    {
      fonts: fontAssets.fonts,
      headers,
      height: OG_HEIGHT,
      width: OG_WIDTH,
    },
  );
}
