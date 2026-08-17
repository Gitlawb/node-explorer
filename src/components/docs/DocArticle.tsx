import { useLayoutEffect, useRef } from 'react';
import { MarkdownView } from '../repo-detail/MarkdownView';

/**
 * Rendered documentation, with the affordances a reader expects on a docs page.
 *
 * The markdown is sanitized HTML injected wholesale, so these are applied to
 * the DOM after it lands rather than expressed as JSX: each fence gets a header
 * naming its language and a copy button, and each section heading gets an
 * anchor link. Both are idempotent and marked with a data attribute, because
 * the effect re-runs whenever the document changes.
 *
 * The page header already prints the document's title, so a leading `<h1>` in
 * the markdown is removed — otherwise every doc opens with its name twice.
 */
interface DocArticleProps {
  html: string;
}

/** Human labels for the fence languages these docs actually use. */
const LANG_LABELS: Record<string, string> = {
  bash: 'shell',
  sh: 'shell',
  shell: 'shell',
  console: 'shell',
  json: 'json',
  jsonc: 'json',
  ts: 'typescript',
  typescript: 'typescript',
  js: 'javascript',
  javascript: 'javascript',
  toml: 'toml',
  yaml: 'yaml',
  yml: 'yaml',
  text: 'text',
  txt: 'text',
};

export function DocArticle({ html }: DocArticleProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const firstHeading = root.querySelector('h1');
    if (firstHeading && !firstHeading.previousElementSibling) firstHeading.remove();

    // No cleanup, deliberately. StrictMode runs this effect, tears it down, and
    // runs it again; a cleanup that detached the copy listeners would leave the
    // second run to hit the `data-enhanced` guard and skip re-attaching them,
    // so every button rendered but did nothing. There is nothing to leak: when
    // the document changes React replaces this subtree's innerHTML wholesale
    // and the old nodes are discarded along with their listeners.
    for (const pre of Array.from(root.querySelectorAll('pre'))) {
      if (pre.dataset.enhanced) continue;
      pre.dataset.enhanced = '1';

      const code = pre.querySelector('code');
      const langClass = Array.from(code?.classList ?? []).find(c => c.startsWith('language-'));
      const rawLang = langClass?.slice('language-'.length) ?? '';
      const label = LANG_LABELS[rawLang] ?? rawLang;

      const bar = document.createElement('div');
      bar.className = 'doc-fence-bar';

      const name = document.createElement('span');
      name.className = 'doc-fence-lang';
      name.textContent = label;
      bar.appendChild(name);

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'doc-fence-copy';
      button.textContent = 'Copy';
      button.setAttribute('aria-label', label ? `Copy ${label} snippet` : 'Copy snippet');

      // Held per button by the closure, so a second click restarts the label
      // reset rather than letting the first one clear it early.
      let resetTimer: ReturnType<typeof setTimeout> | undefined;
      const onCopy = async () => {
        try {
          await navigator.clipboard.writeText(code?.textContent ?? pre.textContent ?? '');
          button.textContent = 'Copied';
        } catch {
          // Clipboard is permission-gated and unavailable over plain http on
          // some hosts; say so rather than silently appearing to succeed.
          button.textContent = 'Press ⌘C';
        }
        clearTimeout(resetTimer);
        resetTimer = setTimeout(() => {
          button.textContent = 'Copy';
        }, 1600);
      };
      button.addEventListener('click', onCopy);
      bar.appendChild(button);

      // The bar sits inside a wrapper so it can be positioned against the
      // fence without the fence's own scrolling moving it.
      const wrapper = document.createElement('figure');
      wrapper.className = 'doc-fence';
      pre.replaceWith(wrapper);
      wrapper.appendChild(bar);
      wrapper.appendChild(pre);
    }

    for (const heading of Array.from(root.querySelectorAll('h2[id], h3[id]'))) {
      if (heading.querySelector('.doc-anchor')) continue;
      const link = document.createElement('a');
      link.className = 'doc-anchor';
      link.href = `#${heading.id}`;
      link.textContent = '#';
      link.setAttribute('aria-label', `Link to ${heading.textContent?.trim() ?? 'section'}`);
      heading.appendChild(link);
    }
  }, [html]);

  return (
    <div ref={rootRef}>
      <MarkdownView html={html} />
    </div>
  );
}
