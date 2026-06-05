/**
 * Layout Primitives
 * Responsive, composable building blocks for consistent spacing & structure.
 */
import React from 'react';
import { cn } from '../../lib/utils';

/* ─── Stack ──────────────────────────────────────────────────────────────── */

export interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  align?: 'start' | 'center' | 'end' | 'stretch';
  direction?: 'row' | 'col';
  wrap?: boolean;
}

const gapMap = {
  none: 'gap-0',
  xs:   'gap-2',
  sm:   'gap-4',
  md:   'gap-6',
  lg:   'gap-8',
  xl:   'gap-12',
};

const alignMap = {
  start:   'items-start',
  center:  'items-center',
  end:     'items-end',
  stretch: 'items-stretch',
};

export function Stack({
  className,
  gap = 'md',
  align = 'stretch',
  direction = 'col',
  wrap = false,
  ...props
}: StackProps) {
  return (
    <div
      className={cn(
        'flex',
        direction === 'col' ? 'flex-col' : 'flex-row',
        gapMap[gap],
        alignMap[align],
        wrap && 'flex-wrap',
        className
      )}
      {...props}
    />
  );
}

/* ─── Grid ───────────────────────────────────────────────────────────────── */

export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: 1 | 2 | 3 | 4 | 6 | 12;
  gap?: 'xs' | 'sm' | 'md' | 'lg';
  responsive?: boolean;
}

const colsMap = {
  1:  'grid-cols-1',
  2:  'grid-cols-1 md:grid-cols-2',
  3:  'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  4:  'grid-cols-1 md:grid-cols-2 xl:grid-cols-4',
  6:  'grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
  12: 'grid-cols-12',
};

export function Grid({ className, cols = 2, gap = 'md', ...props }: GridProps) {
  return (
    <div
      className={cn('grid', colsMap[cols], gapMap[gap], className)}
      {...props}
    />
  );
}

/* ─── Container ──────────────────────────────────────────────────────────── */

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  center?: boolean;
}

const containerSizes = {
  sm:   'max-w-2xl',
  md:   'max-w-4xl',
  lg:   'max-w-6xl',
  xl:   'max-w-[1440px]',
  full: 'max-w-full',
};

export function Container({
  className,
  size = 'xl',
  center = true,
  ...props
}: ContainerProps) {
  return (
    <div
      className={cn(
        'w-full px-4 md:px-8',
        containerSizes[size],
        center && 'mx-auto',
        className
      )}
      {...props}
    />
  );
}

/* ─── ScrollArea ─────────────────────────────────────────────────────────── */

export interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: 'x' | 'y' | 'both';
  hideScrollbar?: boolean;
}

export function ScrollArea({
  className,
  direction = 'y',
  hideScrollbar = false,
  ...props
}: ScrollAreaProps) {
  return (
    <div
      className={cn(
        direction === 'x'    ? 'overflow-x-auto overflow-y-hidden' :
        direction === 'y'    ? 'overflow-y-auto overflow-x-hidden' :
                               'overflow-auto',
        hideScrollbar && '[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]',
        className
      )}
      {...props}
    />
  );
}

/* ─── Spacer ─────────────────────────────────────────────────────────────── */

export function Spacer({ size = 'md', className }: { size?: StackProps['gap']; className?: string }) {
  const sizeMap = { none: 'h-0', xs: 'h-2', sm: 'h-4', md: 'h-6', lg: 'h-8', xl: 'h-12' };
  return <div className={cn(sizeMap[size ?? 'md'], className)} aria-hidden />;
}

/* ─── PageLayout ─────────────────────────────────────────────────────────── */

export function PageLayout({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col h-full overflow-y-auto overflow-x-hidden', className)}>
      {children}
    </div>
  );
}

/* ─── TwoColumnLayout ────────────────────────────────────────────────────── */

export function TwoColumnLayout({
  sidebar,
  main,
  sidebarWidth = 'w-72',
  className,
}: {
  sidebar: React.ReactNode;
  main: React.ReactNode;
  sidebarWidth?: string;
  className?: string;
}) {
  return (
    <div className={cn('flex gap-6 h-full', className)}>
      <aside className={cn('shrink-0 flex flex-col gap-4', sidebarWidth)}>
        {sidebar}
      </aside>
      <main className="flex-1 min-w-0">
        {main}
      </main>
    </div>
  );
}
