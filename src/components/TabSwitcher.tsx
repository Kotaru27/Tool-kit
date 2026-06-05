/**
 * TabSwitcher — shared expandable tab bar used in AdTools, ImageAndPdf,
 * StillsAndBoards. Replaces three copies of identical code.
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface TabItem {
  id: string;
  title: string;
  icon: React.ReactNode;
}

interface TabSwitcherProps {
  tabs: readonly TabItem[];
  activeTab: string;
  onTabChange: (id: string) => void;
  className?: string;
}

export default function TabSwitcher({
  tabs, activeTab, onTabChange, className = '',
}: TabSwitcherProps) {
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  return (
    <div className={`flex justify-center mb-8 shrink-0 relative z-20 ${className}`}>
      {/* Scrollable on very small screens */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 px-1 max-w-full">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const isHovered = hoveredTab === tab.id;
          const isExpanded = isActive || isHovered;

          return (
            <motion.button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              onHoverStart={() => setHoveredTab(tab.id)}
              onHoverEnd={() => setHoveredTab(null)}
              layout
              initial={false}
              animate={{
                width: isExpanded ? 220 : 56,
                backgroundColor: isActive ? 'var(--color-text-main)' : isHovered ? 'var(--color-bg-hover)' : 'var(--color-bg-main)',
                borderColor: isActive ? 'var(--color-text-main)' : isHovered ? 'var(--color-border-strong)' : 'var(--color-border-color)',
              }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              className="h-14 rounded-xl border cursor-pointer overflow-hidden flex items-center shrink-0 focus-visible:ring-2 focus-visible:ring-text-muted/30"
              aria-selected={isActive}
              role="tab"
            >
              {/* Icon */}
              <motion.div
                layout
                className="w-14 h-14 shrink-0 flex items-center justify-center"
              >
                <motion.div
                  animate={{ scale: isExpanded ? 0.88 : 1 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                >
                  {React.cloneElement(tab.icon as React.ReactElement, {
                    className: `w-5 h-5 transition-colors duration-200 ${isActive ? 'text-bg-main' : 'text-text-main'}`,
                  } as any)}
                </motion.div>
              </motion.div>

              {/* Label */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.span
                    initial={{ opacity: 0, x: -10, filter: 'blur(4px)' }}
                    animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, x: -10, filter: 'blur(4px)' }}
                    transition={{ duration: 0.16, delay: 0.04 }}
                    className={`font-mono text-[13px] uppercase tracking-widest font-bold pr-5 flex-1 whitespace-nowrap overflow-hidden text-ellipsis transition-colors duration-200 ${
                      isActive ? 'text-bg-main' : 'text-text-main'
                    }`}
                  >
                    {tab.title}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
