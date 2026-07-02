export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-12 flex items-center px-6 border-b border-white/[0.06] bg-[#16161A]/80 backdrop-blur-xl">
      <div className="flex items-center gap-2.5">
        <div className="w-[18px] h-[18px] rounded-[4px] bg-[#5E6AD2] flex items-center justify-center flex-shrink-0">
          <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
            <path d="M1.5 1.5h6M1.5 4.5h6M1.5 7.5h4" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </div>
        <span className="text-[13px] font-medium text-[#F4F4F5] tracking-[-0.01em]">
          node-explorer
        </span>
      </div>
    </nav>
  );
}
