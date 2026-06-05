import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, FileText, Film, Link2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ToolId } from '../App';
import SpecialText from './SpecialText';

interface HomeProps {
  onSelectTool: (tool: ToolId) => void;
}

const TOOLS: { id: ToolId; title: string; description: string; icon: React.ReactNode }[] = [
  {
    id: 'logo',
    title: 'Logo Resizer',
    description: 'Resize & Overlay Text',
    icon: <ImageIcon strokeWidth={1.5} className="w-7 h-7 text-text-main" />,
  },
  {
    id: 'image_tools',
    title: 'Image & PDF',
    description: 'Extract & Split',
    icon: <FileText strokeWidth={1.5} className="w-7 h-7 text-text-main" />,
  },
  {
    id: 'stills_boards',
    title: 'Stills & Boards',
    description: 'Extract Frames & Boards',
    icon: <Film strokeWidth={1.5} className="w-7 h-7 text-text-main" />,
  },
  {
    id: 'ad_tools',
    title: 'Ad Tools',
    description: 'Stim Path & Downloading',
    icon: <Link2 strokeWidth={1.5} className="w-7 h-7 text-text-main" />,
  },
];

/** True when the device primary input is coarse (touch). */
function useIsTouchDevice() {
  const [isTouch, setIsTouch] = useState(false);
  useEffect(() => {
    setIsTouch(window.matchMedia('(hover: none)').matches);
  }, []);
  return isTouch;
}

export default function Home({ onSelectTool }: HomeProps) {
  const [hoveredId, setHoveredId] = useState<ToolId | null>(null);
  const isTouch = useIsTouchDevice();

  return (
    <div className="flex flex-col items-center justify-center min-h-full py-24 px-6">

      {/* ── Title ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="text-center mb-20 w-full"
      >
        <h1 className="text-[56px] md:text-[88px] font-medium mb-4 text-text-main tracking-tighter leading-none">
          <SpecialText speed={40}>Tool Kit</SpecialText>
        </h1>
        <div className="w-10 h-px bg-border-strong mx-auto" />
        <p className="mt-4 text-text-muted font-mono text-xs uppercase tracking-widest">
          v3.4
        </p>
      </motion.div>

      {/* ── Tool Cards ── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col md:flex-row flex-wrap items-stretch md:items-center justify-center gap-2 max-w-5xl w-full"
      >
        {TOOLS.map((tool) => {
          const isExpanded = isTouch ? true : hoveredId === tool.id;

          return isTouch ? (
            // ── Touch/Mobile: always-expanded static card ──
            <button
              key={tool.id}
              onClick={() => onSelectTool(tool.id)}
              className="w-full flex items-center gap-0 h-16 rounded-xl border border-border-color bg-bg-panel cursor-pointer overflow-hidden transition-all duration-200 hover:border-border-strong hover:bg-bg-hover active:scale-[0.98] text-left"
            >
              {/* Icon */}
              <div className="w-16 h-16 shrink-0 flex items-center justify-center">
                {tool.icon}
              </div>
              {/* Content */}
              <div className="flex flex-col justify-center flex-1 pr-5 min-w-0">
                <span className="font-medium text-base text-text-main tracking-tight leading-tight truncate">
                  {tool.title}
                </span>
                <span className="text-sm font-sans text-text-muted mt-1 truncate">
                  {tool.description}
                </span>
              </div>
              {/* Arrow */}
              <ArrowRight className="w-4 h-4 text-text-muted mr-5 shrink-0" />
            </button>
          ) : (
            // ── Desktop: animated expand card ──
            <motion.div
              key={tool.id}
              onClick={() => onSelectTool(tool.id)}
              onHoverStart={() => setHoveredId(tool.id)}
              onHoverEnd={() => setHoveredId(null)}
              layout
              initial={false}
              animate={{
                width: isExpanded ? 340 : 88,
                backgroundColor: isExpanded ? 'var(--color-bg-panel)' : 'var(--color-bg-main)',
                borderColor: isExpanded ? 'var(--color-border-strong)' : 'var(--color-border-color)',
              }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              className="h-[88px] rounded-xl border cursor-pointer overflow-hidden relative flex items-center shrink-0"
            >
              {/* Icon */}
              <motion.div
                layout
                className="w-[88px] h-[88px] shrink-0 flex items-center justify-center"
              >
                <motion.div
                  animate={{ scale: isExpanded ? 0.88 : 1 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                >
                  {tool.icon}
                </motion.div>
              </motion.div>

              {/* Expanded label */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, x: -16, filter: 'blur(4px)' }}
                    animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, x: -10, filter: 'blur(4px)' }}
                    transition={{ duration: 0.18, delay: 0.04 }}
                    className="flex flex-col justify-center whitespace-nowrap overflow-hidden pr-6 flex-1"
                  >
                    <h3 className="font-medium text-lg text-text-main tracking-tight truncate leading-tight">
                      <SpecialText>{tool.title}</SpecialText>
                    </h3>
                    <p className="text-sm font-sans text-text-muted truncate mt-1">
                      {tool.description}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Arrow */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-text-muted"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
