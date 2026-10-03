# PDF Studio

A browser-based PDF editing suite with 8 tools. All processing happens client-side — files never leave the browser.

## Tools
- **Rotate** — rotate any page by custom angle (1° precision)
- **Extract Text** — pull all text from PDF pages
- **Extract Pages** — select specific pages, export as new PDF
- **Organize** — drag-and-drop reordering, delete pages
- **Combine** — merge multiple PDFs, drag to reorder
- **Split** — divide into multiple files by page ranges
- **Crop** — trim margins as percentages of page dimensions
- **Edit** — add text annotations directly onto pages

## Stack
React 18 · pdf-lib · pdf.js · Tailwind CSS · shadcn/ui · lucide-react · Sonner

## Run locally
\`\`\`bash
npm install
npm run dev
\`\`\`

## Why client-side
No uploads. No server. No privacy concerns. Everything runs in the browser via `pdf-lib` and `pdf.js`.