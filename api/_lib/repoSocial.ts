/**
 * The subset of the repository API response needed to build social metadata.
 *
 * Keep this type independent from `lib/api.ts`: that module reads Vite's
 * `import.meta.env`, while these helpers are shared by the browser and server
 * functions.
 */
export interface RepoSocialInput {
  name: string;
  owner_did: string;
  description: string | null;
  is_public: boolean;
  default_branch: string;
  star_count: number;
  created_at: string;
  updated_at: string;
  forked_from: string | null;
}

export interface NormalizedRepoOwner {
  /** Full DID form used when talking to APIs that require one. */
  did: string;
  /** The unprefixed key. */
  key: string;
  /** Stable, unprefixed value used in canonical repository URLs. */
  canonicalSegment: string;
  /** Compact owner label used in titles and image copy. */
  display: string;
}

export interface RepoSocialModel {
  owner: NormalizedRepoOwner;
  /** Complete cleaned API/route identity; unlike `name`, this is not display-clamped. */
  canonicalName: string;
  /** Display-safe repository name used by titles and the OG renderer. */
  name: string;
  repositoryLabel: string;
  description: string;
  title: string;
  imageAlt: string;
  branch: string;
  visibility: 'public' | 'private';
  isFork: boolean;
  stars: number;
  createdAt: string;
  updatedAt: string;
  cacheVersion: string;
  canonicalPath: string;
}

const SITE_NAME = 'gitlawb explorer';
const DEFAULT_TEXT_LIMIT = 240;
const OWNER_LIMIT = 256;
const NAME_LIMIT = 96;
const ROUTE_NAME_LIMIT = 255;
const DESCRIPTION_LIMIT = 200;
const TITLE_LIMIT = 120;
const IMAGE_ALT_LIMIT = 300;

// Preserve ordinary whitespace for the collapsing pass below, but remove
// controls that can corrupt an HTML attribute or visually reorder metadata.
function stripUnsafeControls(value: string): string {
  return Array.from(value).filter(character => {
    const codePoint = character.codePointAt(0) ?? 0;
    const c0Control = codePoint <= 0x08
      || (codePoint >= 0x0b && codePoint <= 0x0c)
      || (codePoint >= 0x0e && codePoint <= 0x1f);
    const c1Control = codePoint >= 0x7f && codePoint <= 0x9f;
    const bidiControl = (codePoint >= 0x202a && codePoint <= 0x202e)
      || (codePoint >= 0x2066 && codePoint <= 0x2069);
    return !c0Control && !c1Control && !bidiControl && codePoint !== 0xfeff;
  }).join('');
}

function graphemes(value: string): string[] {
  // Segmenter keeps emoji families, flags, and combining-mark sequences whole.
  // Array.from is a safe fallback for runtimes without Segmenter support.
  if (typeof Intl.Segmenter === 'function') {
    const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
    return Array.from(segmenter.segment(value), part => part.segment);
  }
  return Array.from(value);
}

function clampText(value: string, maxLength: number): string {
  const limit = Number.isFinite(maxLength) ? Math.max(0, Math.floor(maxLength)) : 0;
  if (limit === 0) return '';

  const parts = graphemes(value);
  if (parts.length <= limit) return value;
  if (limit === 1) return '…';
  return `${parts.slice(0, limit - 1).join('').trimEnd()}…`;
}

function decodeOwner(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    // A stray percent sign should not make metadata generation fail.
    return value;
  }
}

function safeStars(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.trunc(value));
}

function repoLabel(repo: RepoSocialInput): string {
  const owner = normalizeRepoOwner(repo.owner_did);
  const name = cleanSocialText(repo.name, NAME_LIMIT) || 'untitled';
  return `${owner.display || 'unknown'}/${name}`;
}

/** Collapse unsafe/invisible controls and whitespace, normalize Unicode, and clamp by grapheme. */
export function cleanSocialText(
  value: string | null | undefined,
  maxLength = DEFAULT_TEXT_LIMIT,
): string {
  const normalized = stripUnsafeControls((value ?? '').normalize('NFC'))
    .replace(/\s+/gu, ' ')
    .trim();
  return clampText(normalized, maxLength);
}

/** Escape a value for both HTML text nodes and quoted metadata attributes. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Normalize raw z6… keys, full did:key values, and URL-encoded route values. */
export function normalizeRepoOwner(value: string): NormalizedRepoOwner {
  const decoded = cleanSocialText(decodeOwner(value.trim()), OWNER_LIMIT);
  const key = decoded.replace(/^did:key:/iu, '');
  const keyParts = graphemes(key);

  return {
    did: key ? `did:key:${key}` : '',
    key,
    canonicalSegment: key,
    display: keyParts.slice(0, 8).join(''),
  };
}

export function buildRepoTitle(repo: RepoSocialInput): string {
  const suffix = ` · ${SITE_NAME}`;
  const labelLimit = Math.max(1, TITLE_LIMIT - graphemes(suffix).length);
  return `${cleanSocialText(repoLabel(repo), labelLimit)}${suffix}`;
}

export function buildRepoDescription(repo: RepoSocialInput): string {
  const description = cleanSocialText(repo.description, DESCRIPTION_LIMIT);
  if (description) return description;
  return cleanSocialText(`Explore ${repoLabel(repo)} on ${SITE_NAME}.`, DESCRIPTION_LIMIT);
}

export function buildRepoImageAlt(repo: RepoSocialInput): string {
  const branch = cleanSocialText(repo.default_branch, 48) || 'default';
  const visibility = repo.is_public ? 'Public' : 'Private';
  const fork = repo.forked_from ? ' fork' : '';
  const stars = safeStars(repo.star_count);
  const starLabel = `${stars} ${stars === 1 ? 'star' : 'stars'}`;
  const description = cleanSocialText(repo.description, 120);
  const detail = description ? ` ${description}` : '';

  return cleanSocialText(
    `Repository preview for ${repoLabel(repo)}. ${visibility}${fork}, branch ${branch}, ${starLabel}.${detail}`,
    IMAGE_ALT_LIMIT,
  );
}

/**
 * Return a readable URL-safe cache key. It changes whenever either freshness
 * input changes, without depending on locale, clocks, or runtime APIs.
 */
export function repoCacheVersion(repo: Pick<RepoSocialInput, 'updated_at' | 'star_count'>): string {
  const timestamp = cleanSocialText(repo.updated_at, 80)
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${timestamp || 'unknown'}-${safeStars(repo.star_count)}`;
}

export function buildRepoCanonicalPath(owner: string, name: string): string {
  const normalizedOwner = normalizeRepoOwner(owner);
  const normalizedName = cleanSocialText(name, ROUTE_NAME_LIMIT) || 'untitled';
  return `/repos/${encodeURIComponent(normalizedOwner.canonicalSegment)}/${encodeURIComponent(normalizedName)}`;
}

export function buildRepoSocialModel(repo: RepoSocialInput): RepoSocialModel {
  const owner = normalizeRepoOwner(repo.owner_did);
  const canonicalName = cleanSocialText(repo.name, ROUTE_NAME_LIMIT) || 'untitled';
  const name = cleanSocialText(repo.name, NAME_LIMIT) || 'untitled';
  const stars = safeStars(repo.star_count);

  return {
    owner,
    canonicalName,
    name,
    repositoryLabel: `${owner.display || 'unknown'}/${name}`,
    description: buildRepoDescription(repo),
    title: buildRepoTitle(repo),
    imageAlt: buildRepoImageAlt(repo),
    branch: cleanSocialText(repo.default_branch, 48) || 'default',
    visibility: repo.is_public ? 'public' : 'private',
    isFork: Boolean(repo.forked_from),
    stars,
    createdAt: cleanSocialText(repo.created_at, 80),
    updatedAt: cleanSocialText(repo.updated_at, 80),
    cacheVersion: repoCacheVersion(repo),
    // Presentation copy is clamped, but the canonical identity must retain the
    // API's complete repository name.
    canonicalPath: buildRepoCanonicalPath(owner.canonicalSegment, canonicalName),
  };
}
