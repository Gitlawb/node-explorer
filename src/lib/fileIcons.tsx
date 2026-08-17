import {
  FileCode, FileJson, FileText, Terminal, Database, Image,
  Lock, Scale, BookOpen, File,
  type LucideIcon,
} from 'lucide-react';

interface FileIconInfo {
  icon: LucideIcon;
  color: string;
}

const DOT = new Map<string, FileIconInfo>([
  ['js', { icon: FileCode, color: '#519aba' }],
  ['mjs', { icon: FileCode, color: '#519aba' }],
  ['cjs', { icon: FileCode, color: '#519aba' }],
  ['ts', { icon: FileCode, color: '#3070b0' }],
  ['tsx', { icon: FileCode, color: '#3070b0' }],
  ['jsx', { icon: FileCode, color: '#519aba' }],
  ['css', { icon: FileCode, color: '#cc6699' }],
  ['scss', { icon: FileCode, color: '#cc6699' }],
  ['less', { icon: FileCode, color: '#563d7c' }],
  ['html', { icon: FileCode, color: '#e44d26' }],
  ['htm', { icon: FileCode, color: '#e44d26' }],
  ['json', { icon: FileJson, color: '#c9a54b' }],
  ['jsonc', { icon: FileJson, color: '#c9a54b' }],
  ['md', { icon: BookOpen, color: '#3070b0' }],
  ['mdx', { icon: BookOpen, color: '#3070b0' }],
  ['py', { icon: FileCode, color: '#3572A5' }],
  ['rs', { icon: FileCode, color: '#dea584' }],
  ['go', { icon: FileCode, color: '#00ADD8' }],
  ['rb', { icon: FileCode, color: '#cc342d' }],
  ['php', { icon: FileCode, color: '#4F5D95' }],
  ['java', { icon: FileCode, color: '#b07219' }],
  ['kt', { icon: FileCode, color: '#A97BFF' }],
  ['swift', { icon: FileCode, color: '#F05138' }],
  ['c', { icon: FileCode, color: '#555555' }],
  ['h', { icon: FileCode, color: '#555555' }],
  ['cpp', { icon: FileCode, color: '#f34b7d' }],
  ['cxx', { icon: FileCode, color: '#f34b7d' }],
  ['hpp', { icon: FileCode, color: '#f34b7d' }],
  ['cs', { icon: FileCode, color: '#178600' }],
  ['yaml', { icon: FileCode, color: '#cb171e' }],
  ['yml', { icon: FileCode, color: '#cb171e' }],
  ['toml', { icon: FileCode, color: '#8c8c8c' }],
  ['sh', { icon: Terminal, color: '#4dab4d' }],
  ['bash', { icon: Terminal, color: '#4dab4d' }],
  ['zsh', { icon: Terminal, color: '#4dab4d' }],
  ['fish', { icon: Terminal, color: '#4dab4d' }],
  ['ps1', { icon: Terminal, color: '#4dab4d' }],
  ['bat', { icon: Terminal, color: '#4dab4d' }],
  ['sql', { icon: Database, color: '#4682b4' }],
  ['svg', { icon: Image, color: '#b06fba' }],
  ['png', { icon: Image, color: '#b06fba' }],
  ['jpg', { icon: Image, color: '#b06fba' }],
  ['jpeg', { icon: Image, color: '#b06fba' }],
  ['gif', { icon: Image, color: '#b06fba' }],
  ['ico', { icon: Image, color: '#b06fba' }],
  ['lock', { icon: Lock, color: '#8c8c8c' }],
  ['woff', { icon: FileText, color: '#8c8c8c' }],
  ['woff2', { icon: FileText, color: '#8c8c8c' }],
  ['ttf', { icon: FileText, color: '#8c8c8c' }],
  ['eot', { icon: FileText, color: '#8c8c8c' }],
  ['diff', { icon: FileCode, color: '#8c8c8c' }],
  ['patch', { icon: FileCode, color: '#8c8c8c' }],
  ['env', { icon: FileCode, color: '#f0ad4e' }],
  ['conf', { icon: FileCode, color: '#8c8c8c' }],
  ['cfg', { icon: FileCode, color: '#8c8c8c' }],
  ['ini', { icon: FileCode, color: '#8c8c8c' }],
  ['txt', { icon: FileText, color: '#8c8c8c' }],
  ['graphql', { icon: FileCode, color: '#e10098' }],
  ['vue', { icon: FileCode, color: '#41b883' }],
  ['svelte', { icon: FileCode, color: '#ff3e00' }],
  ['astro', { icon: FileCode, color: '#bd34fe' }],
]);

const NAME = new Map<string, FileIconInfo>([
  ['readme.md', { icon: BookOpen, color: '#3070b0' }],
  ['readme', { icon: BookOpen, color: '#3070b0' }],
  ['license', { icon: Scale, color: '#8bc34a' }],
  ['makefile', { icon: FileCode, color: '#8c8c8c' }],
  ['dockerfile', { icon: FileCode, color: '#0db7ed' }],
  ['gemfile', { icon: FileCode, color: '#8c8c8c' }],
  ['procfile', { icon: FileCode, color: '#8c8c8c' }],
  ['.env', { icon: FileCode, color: '#f0ad4e' }],
  ['.gitignore', { icon: FileCode, color: '#8c8c8c' }],
  ['.gitattributes', { icon: FileCode, color: '#8c8c8c' }],
  ['.gitmodules', { icon: FileCode, color: '#8c8c8c' }],
  ['.editorconfig', { icon: FileCode, color: '#8c8c8c' }],
  ['.dockerignore', { icon: FileCode, color: '#0db7ed' }],
]);

export function getFileIcon(name: string): { icon: LucideIcon; color: string } {
  const lower = name.toLowerCase();
  const byName = NAME.get(lower);
  if (byName) return byName;

  const i = lower.lastIndexOf('.');
  if (i === -1) return { icon: File, color: '#8c8c8c' };

  const ext = lower.slice(i + 1);
  const byExt = DOT.get(ext);
  if (byExt) return byExt;

  return { icon: File, color: '#8c8c8c' };
}
