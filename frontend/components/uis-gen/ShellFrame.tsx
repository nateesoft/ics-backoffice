'use client';
import type { NavPosition } from '@/types/uisGen';

export interface ShellNavLink {
  path: string;
  label: string;
}

interface ShellFrameProps {
  hasNav: boolean;
  navPosition: NavPosition;
  themeColor: string;
  projectName: string;
  navLinks: ShellNavLink[];
  activePath: string;
  onNavigate: (path: string) => void;
  children: React.ReactNode;
}

function Logo({ projectName, themeColor }: { projectName: string; themeColor: string }) {
  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      <span className="text-xl leading-none" style={{ color: themeColor }}>◆</span>
      <span className="text-base font-bold text-slate-800 truncate">{projectName}</span>
    </div>
  );
}

function NavLinks({
  navLinks, activePath, onNavigate, themeColor, direction,
}: {
  navLinks: ShellNavLink[];
  activePath: string;
  onNavigate: (path: string) => void;
  themeColor: string;
  direction: 'row' | 'column';
}) {
  if (navLinks.length === 0) {
    return <p className="text-xs text-slate-400 italic px-2">ยังไม่มี Content Page — เพิ่มได้จาก Sitemap Canvas</p>;
  }
  return (
    <nav className={`flex ${direction === 'row' ? 'flex-row items-center gap-1' : 'flex-col gap-1'}`}>
      {navLinks.map(link => {
        const active = link.path === activePath;
        return (
          <button
            key={link.path}
            type="button"
            onClick={() => onNavigate(link.path)}
            className="px-3 py-2 rounded-lg text-sm font-medium text-left transition truncate"
            style={active ? { backgroundColor: `${themeColor}1a`, color: themeColor } : undefined}
            onMouseEnter={e => { if (!active) e.currentTarget.style.backgroundColor = '#f1f5f9'; }}
            onMouseLeave={e => { if (!active) e.currentTarget.style.backgroundColor = ''; }}
          >
            {link.label}
          </button>
        );
      })}
    </nav>
  );
}

// UIs Gen's app shell is plain React chrome, not a JSONForms uiSchema — there are no form fields
// in the shell itself, so there's nothing to gain from routing it through JsonForms. The content
// region simply hosts a Content node's own live-rendered JsonForms tree as `children`.
export default function ShellFrame({ hasNav, navPosition, themeColor, projectName, navLinks, activePath, onNavigate, children }: ShellFrameProps) {
  if (!hasNav) {
    return (
      <div className="min-h-full flex flex-col bg-white">
        <div className="flex items-center justify-center px-4 py-4 border-b border-slate-100">
          <Logo projectName={projectName} themeColor={themeColor} />
        </div>
        <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
            {children}
          </div>
        </div>
      </div>
    );
  }

  const sideNav = navPosition === 'left' || navPosition === 'right';

  const appbar = (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 shadow-sm flex-shrink-0">
      <Logo projectName={projectName} themeColor={themeColor} />
      {navPosition === 'top' && <NavLinks navLinks={navLinks} activePath={activePath} onNavigate={onNavigate} themeColor={themeColor} direction="row" />}
      <span className="text-sm text-slate-400">Preview</span>
    </div>
  );

  const sidebar = sideNav && (
    <div className={`w-56 flex-shrink-0 bg-white p-3 ${navPosition === 'left' ? 'border-r' : 'border-l'} border-slate-200 overflow-auto`}>
      <NavLinks navLinks={navLinks} activePath={activePath} onNavigate={onNavigate} themeColor={themeColor} direction="column" />
    </div>
  );

  const bottomNav = navPosition === 'bottom' && (
    <div className="flex-shrink-0 px-4 py-2 bg-white border-t border-slate-200">
      <NavLinks navLinks={navLinks} activePath={activePath} onNavigate={onNavigate} themeColor={themeColor} direction="row" />
    </div>
  );

  return (
    <div className="min-h-full flex flex-col bg-white">
      {appbar}
      <div className="flex-1 flex overflow-hidden">
        {navPosition === 'left' && sidebar}
        <div className="flex-1 overflow-auto p-6 bg-slate-50">{children}</div>
        {navPosition === 'right' && sidebar}
      </div>
      {bottomNav}
    </div>
  );
}
