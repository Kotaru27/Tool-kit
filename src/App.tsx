import React, { useState, useEffect } from 'react';
import {
  LayoutGrid, Image as ImageIcon, FileText,
  Film, Link2, Box
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Core } from './utils/core';

import Home from './components/Home';
import LogoResizer from './components/LogoResizer';
import ImageAndPdf from './components/ImageAndPdf';
import StillsAndBoards from './components/StillsAndBoards';
import AdTools from './components/AdTools';
import ThemeToggle from './components/ThemeToggle';

export type ToolId = 'home' | 'logo' | 'image_tools' | 'stills_boards' | 'ad_tools';

const TOOL_META: Record<ToolId, { label: string; icon: React.ReactNode }> = {
  home:         { label: 'Home',         icon: <LayoutGrid strokeWidth={1.5} /> },
  logo:         { label: 'Logo Resizer', icon: <ImageIcon strokeWidth={1.5} /> },
  image_tools:  { label: 'Image Tools',  icon: <FileText strokeWidth={1.5} /> },
  stills_boards:{ label: 'Storyboards',  icon: <Film strokeWidth={1.5} /> },
  ad_tools:     { label: 'Ad Tools',     icon: <Link2 strokeWidth={1.5} /> },
};

const NAV_ITEMS: ToolId[] = ['logo', 'image_tools', 'stills_boards', 'ad_tools'];

export default function App() {
  const [activeTool, setActiveTool] = useState<ToolId>('home');

  useEffect(() => {
    const saved = Core.AppState.load('activeTool') as ToolId;
    if (saved && saved in TOOL_META) setActiveTool(saved);
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty('--accent', '#FFFFFF');
    document.documentElement.style.setProperty('--accent-hover', '#E5E5E5');
    document.documentElement.style.setProperty('--accent-rgb', '255, 255, 255');
    Core.AppState.save('activeTool', activeTool);
    return () => { Core.BlobRegistry.revokeAll(); };
  }, [activeTool]);

  const renderTool = () => {
    switch (activeTool) {
      case 'home':          return <Home onSelectTool={setActiveTool} />;
      case 'logo':          return <LogoResizer />;
      case 'image_tools':   return <ImageAndPdf />;
      case 'stills_boards': return <StillsAndBoards />;
      case 'ad_tools':      return <AdTools />;
      default:              return <Home onSelectTool={setActiveTool} />;
    }
  };

  const isHome = activeTool === 'home';

  return (
    <div className={`flex flex-col h-screen overflow-hidden bg-bg-main ${!isHome ? 'tool-active' : ''}`}>

      {/* ── Top Header (shown when inside a tool) ── */}
      {!isHome && (
        <motion.header
          initial={{ y: -64, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="h-[60px] border-b border-border-color flex items-center px-5 md:px-8 bg-bg-input shrink-0 z-50 justify-between gap-4"
          style={{ paddingTop: 'var(--safe-top)' }}
        >
          {/* Logo / back to home */}
          <button
            onClick={() => setActiveTool('home')}
            className="flex items-center gap-3 group cursor-pointer bg-transparent border-0 p-0 text-left"
            title="Back to Home"
          >
            <div className="w-8 h-8 flex items-center justify-center rounded-lg border border-border-color bg-bg-panel group-hover:border-border-strong group-hover:bg-bg-hover transition-all duration-200">
              <Box strokeWidth={1.5} className="text-text-main w-4 h-4" />
            </div>
            <span className="text-text-subtle text-sm font-mono tracking-tight hidden sm:block group-hover:text-text-subtle transition-colors duration-200">
              Tool Kit
            </span>
          </button>

          {/* Breadcrumb separator + current tool */}
          <div className="flex items-center gap-2 flex-1">
            <span className="text-border-strong text-sm hidden sm:block">/</span>
            <span className="text-text-main text-sm font-medium tracking-tight">
              {TOOL_META[activeTool].label}
            </span>
          </div>

          {/* Right slot */}
          <div className="flex items-center gap-3">
             <ThemeToggle />
          </div>
        </motion.header>
      )}

      {/* Floating Theme Toggle for Home view */}
      {isHome && (
        <div className="fixed top-6 right-6 z-50">
          <ThemeToggle />
        </div>
      )}

      <div className="flex flex-1 overflow-hidden relative">

        {/* ── Side Nav (desktop) / Bottom Nav (mobile) ── */}
        <AnimatePresence>
          {!isHome && (
            <motion.nav
              initial={{ x: -80, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -80, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              style={{
                willChange: 'transform, opacity',
                paddingBottom: 'max(0px, var(--safe-bottom))',
              } as React.CSSProperties}
              className={[
                // Desktop: left column
                'w-[72px] bg-bg-input border-r border-border-color',
                'flex flex-col items-center pt-6 gap-2 z-40 shrink-0',
                // Mobile: bottom bar
                'max-lg:w-full max-lg:fixed max-lg:bottom-0 max-lg:left-0 max-lg:right-0',
                'max-lg:h-auto max-lg:flex-row max-lg:justify-around max-lg:pt-0 max-lg:pb-0',
                'max-lg:border-t max-lg:border-r-0 max-lg:border-border-color',
                'max-lg:bg-bg-input',
              ].join(' ')}
            >
              {/* Home button — desktop only (mobile goes back via header) */}
              <NavItem
                icon={<LayoutGrid />}
                active={false}
                onClick={() => setActiveTool('home')}
                title="Home"
                className="max-lg:hidden"
              />
              <div className="h-px w-8 bg-[#151515] my-1 max-lg:hidden" />

              {NAV_ITEMS.map((id) => (
                <NavItem
                  key={id}
                  icon={TOOL_META[id].icon}
                  active={activeTool === id}
                  onClick={() => setActiveTool(id)}
                  title={TOOL_META[id].label}
                />
              ))}
            </motion.nav>
          )}
        </AnimatePresence>

        {/* ── Main Content ── */}
        <div className="flex-1 relative overflow-hidden flex flex-col bg-bg-main dark:bg-bg-main ">
          <AnimatePresence mode="wait">
            {isHome ? (
              <motion.div
                key="home"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98, filter: 'blur(5px)' }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                style={{ willChange: 'opacity, transform, filter' }}
                className="w-full h-full overflow-y-auto overflow-x-hidden"
              >
                <Home onSelectTool={setActiveTool} />
              </motion.div>
            ) : (
              <motion.div
                key={activeTool}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                style={{ willChange: 'transform, opacity' }}
                className="w-full h-full overflow-y-auto overflow-x-hidden p-4 md:p-8 pb-safe max-lg:pb-[88px] bg-bg-main dark:bg-bg-main  relative z-10"
              >
                {renderTool()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function NavItem({
  icon, active, onClick, title, className = '',
}: {
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
  title: string;
  className?: string;
  key?: React.Key;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      className={[
        'w-11 h-11 bg-transparent border border-transparent cursor-pointer rounded-xl',
        'flex items-center justify-center transition-all duration-200 relative group',
        'max-lg:w-12 max-lg:h-12 max-lg:my-2',
        active
          ? 'text-text-main bg-bg-hover border-border-strong'
          : 'text-text-subtle hover:text-text-main hover:bg-bg-hover hover:border-border-color',
        className,
      ].join(' ')}
    >
      {/* Active indicator dot */}
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 bg-text-main rounded-r-full max-lg:hidden max-lg:left-auto max-lg:bottom-0 max-lg:top-auto max-lg:translate-y-0 max-lg:left-1/2 max-lg:-translate-x-1/2 max-lg:w-4 max-lg:h-[2px] max-lg:rounded-t-full max-lg:rounded-r-none" />
      )}
      <div className="relative z-10 transition-transform duration-200 group-hover:scale-110">
        {React.cloneElement(icon as React.ReactElement, {
          strokeWidth: active ? 2 : 1.5,
          className: 'w-[18px] h-[18px]',
        } as any)}
      </div>
    </button>
  );
}
