import { useState, useEffect, useRef } from 'react';

interface PageHeaderProps {
  search: string;
  onSearchChange: (val: string) => void;
  typeFilter: string;
  onTypeChange: (val: string) => void;
  sortOrder: string;
  onSortChange: (val: string) => void;
}

function FilterDropdown({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={[
          'h-7 px-2.5 flex items-center gap-1.5 text-xs rounded-md border transition-colors duration-150 select-none',
          open
            ? 'bg-white/[0.08] border-white/20 text-[#E4E4E7]'
            : 'bg-white/[0.04] border-white/[0.08] text-[#A1A1AA] hover:bg-white/[0.06] hover:border-white/[0.14] hover:text-[#D4D4D8]',
        ].join(' ')}
      >
        <span>
          {label}: {current.label}
        </span>
        <svg
          width="9"
          height="9"
          viewBox="0 0 9 9"
          fill="none"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}
        >
          <path d="M1.5 3L4.5 6L7.5 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full mt-1.5 left-0 min-w-[130px] bg-[#1C1C22] border border-white/[0.1] rounded-lg shadow-2xl z-50 py-1">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={[
                'w-full px-3 py-1.5 text-left text-xs flex items-center justify-between gap-4 transition-colors duration-100',
                opt.value === value
                  ? 'text-[#E4E4E7]'
                  : 'text-[#8B8D97] hover:text-[#E4E4E7] hover:bg-white/[0.04]',
              ].join(' ')}
            >
              <span>{opt.label}</span>
              {opt.value === value && (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M1.5 5l2.5 2.5L8.5 2.5" stroke="#5E6AD2" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PageHeader({
  search,
  onSearchChange,
  typeFilter,
  onTypeChange,
  sortOrder,
  onSortChange,
}: PageHeaderProps) {
  return (
    <div className="pt-20 pb-6">
      <div className="mb-5">
        <h1 className="text-[26px] font-semibold text-[#F4F4F5] tracking-[-0.03em] leading-tight mb-1.5">
          Repositories
        </h1>
        <p className="text-[13px] leading-relaxed" style={{ color: '#8B8D97' }}>
          Browse and explore open-source repositories.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-[280px]">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#52525B] pointer-events-none">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.3" />
              <path d="M9 9l2.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Find a repository..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-7 pl-8 pr-3 text-xs bg-white/[0.04] border border-white/[0.08] rounded-md text-[#E4E4E7] placeholder:text-[#3F3F46] focus:outline-none focus:border-[#5E6AD2]/50 focus:bg-white/[0.06] transition-all duration-150"
          />
        </div>

        <FilterDropdown
          label="Type"
          value={typeFilter}
          onChange={onTypeChange}
          options={[
            { value: 'all', label: 'All' },
            { value: 'public', label: 'Public' },
            { value: 'private', label: 'Private' },
          ]}
        />

        <FilterDropdown
          label="Sort"
          value={sortOrder}
          onChange={onSortChange}
          options={[
            { value: 'updated', label: 'Updated' },
            { value: 'name', label: 'Name' },
          ]}
        />
      </div>
    </div>
  );
}
