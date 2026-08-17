/**
 * Which modifier this visitor's keyboard actually uses.
 *
 * The palette handler accepts `metaKey || ctrlKey`, so the shortcut works
 * everywhere — but the hint has to name the right key. Printing ⌘ to a Windows
 * or Linux visitor tells them to press a key their keyboard does not have.
 */
export function isApplePlatform(): boolean {
  if (typeof navigator === 'undefined') return false;
  // userAgentData is the modern signal; platform is the fallback and still
  // reports "MacIntel" on Apple Silicon.
  const uaPlatform =
    (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform ??
    navigator.platform ??
    '';
  return /mac|iphone|ipad|ipod/i.test(uaPlatform);
}

/** Display form of the palette modifier: "⌘" on Apple, "Ctrl" elsewhere. */
export function modifierKeyLabel(): string {
  return isApplePlatform() ? '⌘' : 'Ctrl';
}
