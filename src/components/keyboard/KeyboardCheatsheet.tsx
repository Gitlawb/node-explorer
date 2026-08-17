import { Kbd as HeroKbd, Button } from '../register/controls';
import { Modal } from '../ui/Modal';
import { MicroLabel } from '../ui/MicroLabel';
import { modifierKeyLabel } from '../../lib/platform';

function Kbd({ children }: { children: string }) {
  return <HeroKbd><HeroKbd.Content>{children}</HeroKbd.Content></HeroKbd>;
}

function Row({ keys, desc }: { keys: string[]; desc: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5">
      <dt className="m-0 text-[12.5px] text-muted">{desc}</dt>
      <dd className="m-0 flex gap-1 shrink-0">
        {keys.map(k => <Kbd key={k}>{k}</Kbd>)}
      </dd>
    </div>
  );
}

interface KeyboardCheatsheetProps {
  open: boolean;
  onClose: () => void;
}

export function KeyboardCheatsheet({ open, onClose }: KeyboardCheatsheetProps) {
  return (
    <Modal open={open} onClose={onClose} label="keyboard shortcuts">
      <div className="flex items-center justify-between px-5 h-11 border-b border-border">
        <MicroLabel>keyboard shortcuts</MicroLabel>
        <Button
          onPress={onClose}
          aria-label="close"
          variant="tertiary"
          size="sm"
        >
          esc
        </Button>
      </div>
      <dl className="m-0 grid sm:grid-cols-2 gap-x-10 gap-y-4 p-5">
        <div>
          <MicroLabel className="block mb-2">global</MicroLabel>
          <Row keys={[modifierKeyLabel(), 'K']} desc="command palette" />
          <Row keys={['?']} desc="this cheatsheet" />
          <Row keys={['j', 'k']} desc="move through list rows" />
          <Row keys={['↵']} desc="open focused row" />
        </div>
        <div>
          <MicroLabel className="block mb-2">repository</MicroLabel>
          <Row keys={['t']} desc="find file" />
          <Row keys={['1', '…', '6']} desc="switch tabs" />
          <Row keys={['⌫']} desc="up one directory" />
        </div>
        <div className="sm:col-span-2">
          <MicroLabel className="block mb-2">file viewer</MicroLabel>
          <Row keys={['y']} desc="copy link to file (with selected lines)" />
          <Row keys={['click', '⇧ click']} desc="select line / extend range in gutter" />
        </div>
      </dl>
    </Modal>
  );
}
