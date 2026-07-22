import { useEffect } from 'react';
import { buildRepoSocialModel, type RepoSocialInput } from '../lib/repoSocial';
import type { Repository } from '../types/repo';

const SITE_NAME = 'gitlawb explorer';
const SITE_DESCRIPTION = 'Browse live repositories on the gitlawb network — clone over gitlawb://, inspect ownership, and verify push certificates.';

interface PageMetadata {
  title: string;
  description: string;
  canonicalUrl: string;
  imageUrl: string;
  imageAlt: string;
  robots: string;
}

function setMeta(attribute: 'name' | 'property', key: string, content: string): void {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.append(element);
  }
  element.content = content;
}

function setCanonical(href: string): void {
  let element = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!element) {
    element = document.createElement('link');
    element.rel = 'canonical';
    document.head.append(element);
  }
  element.href = href;
}

function applyMetadata(metadata: PageMetadata): void {
  document.title = metadata.title;
  setCanonical(metadata.canonicalUrl);
  setMeta('name', 'description', metadata.description);
  setMeta('name', 'robots', metadata.robots);
  setMeta('property', 'og:title', metadata.title);
  setMeta('property', 'og:description', metadata.description);
  setMeta('property', 'og:url', metadata.canonicalUrl);
  setMeta('property', 'og:image', metadata.imageUrl);
  setMeta('property', 'og:image:alt', metadata.imageAlt);
  setMeta('name', 'twitter:title', metadata.title);
  setMeta('name', 'twitter:description', metadata.description);
  setMeta('name', 'twitter:image', metadata.imageUrl);
  setMeta('name', 'twitter:image:alt', metadata.imageAlt);
}

function repoSocialInput(repo: Repository): RepoSocialInput {
  return {
    name: repo.name,
    owner_did: repo.owner,
    description: repo.description,
    is_public: repo.visibility === 'public',
    default_branch: repo.branch,
    star_count: repo.stars,
    created_at: repo.createdAtRaw,
    updated_at: repo.updatedAtRaw,
    forked_from: repo.isMirror ? 'fork' : null,
  };
}

function genericMetadata(origin: string): PageMetadata {
  return {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    canonicalUrl: origin,
    imageUrl: `${origin}/og.png`,
    imageAlt: 'gitlawb explorer — a terminal-style browser for live repositories on the gitlawb network',
    robots: 'index,follow',
  };
}

export function useRepositorySocialMetadata(repo: Repository | null): void {
  useEffect(() => {
    const origin = window.location.origin;
    if (!repo) return;

    const model = buildRepoSocialModel(repoSocialInput(repo));
    if (model.visibility === 'private') {
      applyMetadata({
        ...genericMetadata(origin),
        title: `private repository · ${SITE_NAME}`,
        canonicalUrl: new URL(model.canonicalPath, origin).href,
        robots: 'noindex,nofollow',
      });
    } else {
      const owner = encodeURIComponent(model.owner.canonicalSegment);
      const name = encodeURIComponent(model.canonicalName);
      const version = encodeURIComponent(model.cacheVersion);
      applyMetadata({
        title: model.title,
        description: model.description,
        canonicalUrl: new URL(model.canonicalPath, origin).href,
        imageUrl: `${origin}/og/repos/${owner}/${name}/${version}`,
        imageAlt: model.imageAlt,
        robots: 'index,follow',
      });
    }

    return () => applyMetadata(genericMetadata(origin));
  }, [repo]);
}
