# CLAUDE.md — Tool Kit UI/UX Standards

> This file defines the canonical design system, architecture rules, and development standards for Tool Kit v3.4+.
> Read this before generating **any** UI code for this project.

---

## Project Overview

**Tool Kit** is an AMOLED-dark internal SaaS utility suite for creative production teams.
It processes images, video, PDFs, and ad assets entirely in the browser using WebAssembly and Web APIs.

**Stack**: React 19 + TypeScript + Vite 6 + Tailwind CSS v4 + Framer Motion + Radix UI primitives

---

## Design Identity

### Aesthetic: "Precision Dark"
- **Theme**: Pure AMOLED black — zero grey washes, no blue tints
- **Accent**: White (`#FFFFFF`) on black — high contrast, no color accents unless semantic
- **Mood**: Terminal-meets-Linear — minimal, fast, professional, zero decoration for decoration's sake
- **Reference products**: Linear, Vercel Dashboard, Raycast, Ghostty, Arc browser sidepanel

### Typography
- **Display/UI font**: `Geist` (replaces Space Grotesk and Inter)
- **Monospace**: `Geist Mono`
- Use `font-mono` + `uppercase` + `tracking-widest` for all labels, badges, and metadata
- Use `tracking-tight` on all headings
- Weight hierarchy: `font-medium` (500) for UI, `font-semibold` (600) only for CTAs

### Color Palette (hard rules — do not deviate)
```
#000000  bg-main      — app background, content areas
#050505  bg-input     — input backgrounds
#0A0A0A  bg-panel     — cards, panels, sidebars
#0D0D0D  bg-hover     — hover surface (not focus)
#111111  border-subtle — dividers
#1A1A1A  border-color  — default border (ONLY value for borders)
#2A2A2A  border-strong — hover/focus border state
#333333  text-subtle
#555555  text-muted    — secondary labels, hints
#FFFFFF  text-main     — primary text, icons when active
```

**Semantic colors** (use sparingly, with low opacity backgrounds):
```
#10B981  success  (emerald-500)
#F59E0B  warning  (amber-500)
#EF4444  danger   (red-500)
#3B82F6  info     (blue-500)
```

### Spacing — 8px Grid (non-negotiable)
Every margin, padding, and gap MUST be a multiple of 8px.
Use Tailwind scale: `gap-2` (8px), `gap-4` (16px), `gap-6` (24px), `gap-8` (32px), `gap-12` (48px)

### Border Radius
```
--radius-xs:   2px   → use on chips, tags
--radius-app:  8px   → default — buttons, inputs, cards (use this 90% of the time)
--radius-lg:   12px  → modals, floating panels
--radius-full: 9999px → pills, avatars
```
Never mix radius values within a single component group.

---

## Component Architecture

### Directory Structure
```
src/
├── components/
│   ├── ui/          ← Design system primitives (Button, Card, Dialog, etc.)
│   ├── layout/      ← Layout primitives (Stack, Grid, Container, etc.)
│   ├── shared/      ← Shared cross-tool components (DropZone, LoadingOverlay, etc.)
│   └── [Tool].tsx   ← Tool-specific components at root level
├── hooks/           ← Custom React hooks
├── lib/             ← Utilities (cn, formatBytes, ease curves)
├── utils/           ← App-level utilities (core.ts)
├── styles/          ← Additional CSS modules if needed
├── features/        ← Future: feature-specific subdirectories
└── App.tsx          ← Root router/layout
```

### Import Aliases
Always use path aliases, never relative `../../` hell:
```typescript
import { Button } from '@/components/ui'    // ← correct
import { Button } from '../../components/ui/button'  // ← wrong
import { cn } from '@/lib/utils'
import { useToggle } from '@/hooks'
```

---

## Component Usage Rules

### Button
```tsx
import { Button } from '@/components/ui';

// Variants
<Button variant="primary">Save</Button>         // white fill — primary CTA
<Button variant="default">Export</Button>        // panel fill — secondary
<Button variant="ghost">Cancel</Button>          // transparent — tertiary
<Button variant="danger">Delete</Button>         // red tinted — destructive
<Button variant="outline">View</Button>          // outline — alternative

// Sizes
<Button size="sm">Small</Button>                 // h-8, small labels
<Button size="md">Medium</Button>                // h-11, default
<Button size="lg">Large</Button>                 // h-14, hero CTAs
<Button size="icon"><Download /></Button>         // square icon-only

// State
<Button loading>Processing...</Button>           // shows spinner, disabled
<Button leftIcon={<Upload />}>Upload</Button>    // icon left of label
```

**NEVER use `liquid-btn` class in new components.** It exists only for backward compatibility.

### Card
```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui';

<Card variant="elevated" hoverable padding="lg">
  <CardHeader>
    <CardTitle>Logo Resizer</CardTitle>
    <CardDescription>Resize & Overlay Text</CardDescription>
  </CardHeader>
  <CardContent>...</CardContent>
  <CardFooter>...</CardFooter>
</Card>
```

### Dialog (replaces ConfirmModal)
```tsx
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui';

const [open, setOpen] = useState(false);

<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent size="md">
    <DialogHeader>
      <DialogTitle>Confirm deletion</DialogTitle>
    </DialogHeader>
    <DialogBody>Are you sure?</DialogBody>
    <DialogFooter>
      <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
      <Button variant="danger" onClick={handleDelete}>Delete</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Toast
```tsx
import { useToast } from '@/components/ui';

const { success, error, warning, info } = useToast();

success('Export complete', '5 files saved to disk');
error('Upload failed', 'File exceeds 50 MB limit');
warning('Almost done', 'Processing last batch...');
info('Tip', 'Hold Shift to select multiple files');
```

### Loading States
```tsx
import { Skeleton, SkeletonCard, Spinner, ProgressBar, InlineLoader } from '@/components/ui';

<Skeleton height={200} />                         // block skeleton
<Skeleton variant="text" lines={3} />             // text skeleton
<SkeletonCard />                                  // card skeleton
<Spinner size="sm|md|lg" />                       // inline spinner
<InlineLoader message="Processing..." />          // spinner + label
<ProgressBar value={45} showLabel label="Upload" /> // progress
```

### Form Fields
```tsx
import { Label, Input, Textarea, Select } from '@/components/ui';

<div className="flex flex-col gap-4">
  <div>
    <Label required>File Name</Label>
    <Input placeholder="output.png" leftIcon={<File />} />
  </div>
  <div>
    <Label>Format</Label>
    <Select>
      <option value="png">PNG</option>
      <option value="jpg">JPEG</option>
    </Select>
  </div>
</div>
```

### Empty & Error States
```tsx
import { EmptyState, ErrorState, Divider, SectionHeader } from '@/components/ui';

// No files yet
<EmptyState
  title="No files uploaded"
  description="Drop files above to get started"
  action={{ label: 'Browse Files', onClick: handleBrowse }}
/>

// Error
<ErrorState
  title="Export failed"
  message="Canvas size exceeds browser limit"
  onRetry={handleRetry}
/>
```

### Layout Primitives
```tsx
import { Stack, Grid, Container, ScrollArea } from '@/components/layout/primitives';

// Vertical stack
<Stack gap="md" align="stretch">...</Stack>

// 2-column responsive grid
<Grid cols={2} gap="md">...</Grid>

// Constrained container
<Container size="xl">...</Container>

// Scrollable area
<ScrollArea direction="y" className="h-64">...</ScrollArea>
```

---

## Motion Guidelines

### Easing curves — always use these, never raw cubic-bezier:
```typescript
import { ease } from '@/lib/utils';

transition={{ ease: ease.spring, duration: 0.4 }}  // enter/exit panels
transition={{ ease: ease.smooth, duration: 0.2 }}  // hover states
transition={{ ease: ease.snappy, duration: 0.15 }} // micro-interactions
```

### Animation patterns:
```typescript
// Page enter (tool content)
initial={{ opacity: 0, scale: 0.98 }}
animate={{ opacity: 1, scale: 1 }}
exit={{ opacity: 0, scale: 0.98 }}
transition={{ duration: 0.3, ease: ease.spring }}

// Element enter (staggered list)
// parent:
transition={{ staggerChildren: 0.05 }}
// child:
initial={{ opacity: 0, y: 12 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.4, ease: ease.spring }}

// Overlay/backdrop
initial={{ opacity: 0 }}
animate={{ opacity: 1 }}
transition={{ duration: 0.2 }}
```

### What NOT to animate:
- `width`, `height` directly (use `scaleX`/`scaleY` or `max-height` instead)
- `margin`, `padding`
- `color` (use `opacity` + layered elements)
- Anything that causes layout recalculation

---

## Hooks

### useLocalStorage — replaces Core.AppState
```typescript
import { useLocalStorage } from '@/hooks';

const [activeTool, setActiveTool] = useLocalStorage<ToolId>('activeTool', 'home');
```

### useAsyncOperation — for async file operations
```typescript
import { useAsyncOperation } from '@/hooks';

const { loading, error, run } = useAsyncOperation<Blob>();

const handleExport = async () => {
  await run(async () => {
    const blob = await processFiles(files);
    return blob;
  });
};
```

### useProgress — for file processing with progress
```typescript
import { useProgress } from '@/hooks';

const { progress, active, start, update, complete, fail } = useProgress();

start(); // 0%
update(45); // 45%
complete(); // 100% → resets
```

---

## Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| React components | PascalCase | `LogoResizer`, `DropZone` |
| Hooks | `use` + PascalCase | `useToggle`, `useProgress` |
| Utilities | camelCase | `formatBytes`, `slugify` |
| CSS classes | kebab-case | `liquid-btn`, `glass-panel` |
| Types/interfaces | PascalCase | `ToolId`, `DropZoneProps` |
| Constants | SCREAMING_SNAKE | `TOOL_META`, `NAV_ITEMS` |
| Event handlers | `handle` prefix | `handleDrop`, `handleExport` |

---

## Anti-Patterns — NEVER do these

❌ Hard-coded hex colors inline (`text-[#1A1A1A]`) — use CSS variables or design token classes
❌ Arbitrary spacing not on 8px grid (`mt-3`, `gap-5`, `p-7`)
❌ `flex items-center justify-center` on a `div` with just an icon — use `Button size="icon"` instead
❌ `w-full h-full` on everything — think about scroll behavior
❌ Multiple `useState` calls that could be a single object state
❌ Inline `style={{ marginTop: 24 }}` — use Tailwind classes
❌ Importing from `../../` relative paths — always use `@/` aliases
❌ `console.log` in production code
❌ Mutating state directly — always produce new objects/arrays
❌ `any` type — use `unknown` and narrow, or define proper types

---

## Accessibility Checklist

Before shipping any interactive component:
- [ ] All `<button>` elements have `aria-label` or visible text
- [ ] All icons-only have `aria-label` on parent button
- [ ] Form fields have associated `<Label htmlFor="...">`
- [ ] Focus states visible (ring via `focus-visible:`)
- [ ] Keyboard navigation works (Tab, Enter, Escape for modals)
- [ ] Loading states announced to screen readers (`aria-live="polite"`)
- [ ] Color is not the only indicator of state (pair with text/icon)
- [ ] Images have `alt` text

---

## Performance Rules

1. **Never import entire libraries** — tree-shake: `import { motion } from 'framer-motion'` ✓
2. **Lazy load heavy tools** using `React.lazy` + `Suspense` for tabs
3. **Memoize expensive callbacks** with `useCallback`
4. **Memoize expensive computed values** with `useMemo`
5. **Use `will-change: transform`** only on actively animating elements, remove after animation
6. **Blob URLs** — always register with `Core.BlobRegistry.create()`, never raw `URL.createObjectURL()`
7. **File reading** — always use Web Workers for >1MB file processing to avoid main thread blocking

---

## File Processing Patterns

### Standard pattern for tool components:
```tsx
export default function MyTool() {
  const [files, setFiles] = useState<File[]>([]);
  const { loading, error, run, reset } = useAsyncOperation<Blob[]>();
  const { success, error: toastError } = useToast();
  const { progress, start, update, complete, fail } = useProgress();

  const handleProcess = async () => {
    start();
    try {
      const result = await run(async () => {
        // ... process files, call update(pct) as you go
        complete();
        return results;
      });
      success('Done!', `${result.length} files exported`);
    } catch (err) {
      fail();
      toastError('Processing failed', err instanceof Error ? err.message : 'Unknown error');
    }
  };

  return (
    <PageLayout>
      <Container>
        <SectionHeader title="My Tool" description="What it does" />
        <DropZone onFiles={setFiles} accept=".png,.jpg" multiple />
        {loading && <ProgressBar value={progress} showLabel />}
        {error && <ErrorState message={error} onRetry={reset} />}
        {files.length === 0 && !loading && <EmptyState title="No files yet" />}
      </Container>
    </PageLayout>
  );
}
```

---

## CSS Rules

1. **Use CSS custom properties** for any value that could change (theme colors, spacing vars)
2. **`@theme` in index.css** for Tailwind token registration — never add one-off arbitrary values
3. **No `!important`** — ever
4. **Media queries**: mobile-first, `md:` for 768px+, `lg:` for 1024px+
5. **Animations**: always add `@media (prefers-reduced-motion: reduce)` fallbacks for new keyframes

---

## Next Best Upgrades (Priority Order)

1. **`React.lazy` code splitting** — wrap each tool in `lazy()` + `Suspense` → ~40% faster initial load
2. **Virtual list for large file grids** — use `@tanstack/virtual` when lists exceed 50 items
3. **Web Worker file processing** — move FFmpeg and PDF operations off the main thread
4. **Keyboard shortcut system** — global `Cmd+K` palette with `useKeyPress`
5. **Drag-to-reorder** — file order management using Framer Motion `drag` + `useDragControls`
6. **Right-click context menus** — using Radix `DropdownMenu` for file item actions
7. **Settings panel** — persistent user preferences (output quality, default format, etc.)
8. **Undo/Redo** — `useReducer`-based history for destructive operations
9. **PWA support** — `vite-plugin-pwa` for offline capability and home screen install
10. **Storybook** — component documentation and visual regression testing

---

*Last updated: May 2026 | Maintained by: Tool Kit Engineering*
