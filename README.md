# Tool Kit v3.4

A local-first creative toolkit for media production — runs entirely in the browser with no backend required.

## Tools

| Tool | What it does |
|------|-------------|
| **Logo Resizer** | Upload images, add text overlay, set dimensions, export as ZIP |
| **Image & PDF** | Convert PDFs to images · split images into grids |
| **Stills & Boards** | Extract frames from video · assemble storyboards |
| **Ad Tools** | Generate ad exposure & storyboard code from filenames · download from SharePoint via Excel |

## Getting Started

```bash
npm install
npm run dev        # dev server at http://localhost:3000
npm run build      # production build → /dist
npm run preview    # preview the production build
```

## Deploying to GitHub Pages

The repo includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that builds and deploys automatically on every push to `main`.

**One-time setup:**
1. Go to **Settings → Pages**
2. Set **Source** to `GitHub Actions`
3. Push to `main` — the site will be live at `https://<your-username>.github.io/Tool-v3.4/`

## Tech Stack

- [React 19](https://react.dev) + TypeScript
- [Vite 6](https://vitejs.dev)
- [Tailwind CSS v4](https://tailwindcss.com)
- [Framer Motion](https://www.framer.com/motion/)
- [PDF.js](https://mozilla.github.io/pdf.js/) — PDF rendering
- [JSZip](https://stuk.github.io/jszip/) — ZIP export
- [SheetJS](https://sheetjs.com/) — Excel parsing

## Project Structure

```
src/
├── App.tsx                    # Root layout, navigation, routing
├── index.css                  # Design system tokens + global styles
├── main.tsx                   # React entry point
├── components/
│   ├── Home.tsx               # Landing page with tool cards
│   ├── TabSwitcher.tsx        # Shared animated tab bar
│   ├── LogoResizer.tsx        # Logo resize + text overlay tool
│   ├── ImageAndPdf.tsx        # PDF/Image container
│   │   ├── PdfConvert.tsx
│   │   └── ImageSplitter.tsx
│   ├── StillsAndBoards.tsx    # Video stills + storyboard container
│   │   ├── VideoStills.tsx
│   │   └── Storyboard.tsx
│   ├── AdTools.tsx            # Ad tools container
│   │   ├── AdLinkGen.tsx
│   │   └── AdDownloadTool.tsx
│   ├── SpecialText.tsx        # Scramble text animation
│   ├── SpecialInput.tsx       # Styled input + textarea
│   ├── LoadingOverlay.tsx     # Full-screen loading indicator
│   └── ConfirmModal.tsx       # Confirm/alert dialog
└── utils/
    ├── core.ts                # BlobRegistry, AppState, sanitize
    └── frame.ts               # Animation frame helpers
```
