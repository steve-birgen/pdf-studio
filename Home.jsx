import { RotateCw, AlignLeft, Scissors, Layers, Merge, SplitSquareVertical, Crop, Edit3, FileText } from 'lucide-react';
import ToolCard from '@/components/pdf/ToolCard';

const tools = [
  {
    to: '/rotate',
    icon: RotateCw,
    title: 'Rotate Pages',
    description: 'Rotate any page by a custom angle — even 1 degree precision.',
    gradient: 'bg-gradient-to-br from-violet-500/5 to-purple-500/5',
  },
  {
    to: '/extract-text',
    icon: AlignLeft,
    title: 'Extract Text',
    description: 'Pull all text content from your PDF pages instantly.',
    gradient: 'bg-gradient-to-br from-blue-500/5 to-cyan-500/5',
  },
  {
    to: '/extract-pages',
    icon: Scissors,
    title: 'Extract Pages',
    description: 'Select and export specific pages into a new PDF file.',
    gradient: 'bg-gradient-to-br from-emerald-500/5 to-teal-500/5',
  },
  {
    to: '/organize',
    icon: Layers,
    title: 'Organize Pages',
    description: 'Drag and drop to reorder pages in any arrangement.',
    gradient: 'bg-gradient-to-br from-orange-500/5 to-amber-500/5',
  },
  {
    to: '/combine',
    icon: Merge,
    title: 'Combine PDFs',
    description: 'Merge multiple PDF files into one seamless document.',
    gradient: 'bg-gradient-to-br from-pink-500/5 to-rose-500/5',
  },
  {
    to: '/split',
    icon: SplitSquareVertical,
    title: 'Split PDF',
    description: 'Divide a PDF into multiple separate documents by page ranges.',
    gradient: 'bg-gradient-to-br from-indigo-500/5 to-blue-500/5',
  },
  {
    to: '/crop',
    icon: Crop,
    title: 'Crop PDF',
    description: 'Trim and crop individual pages to remove unwanted margins.',
    gradient: 'bg-gradient-to-br from-yellow-500/5 to-orange-500/5',
  },
  {
    to: '/edit',
    icon: Edit3,
    title: 'Edit PDF',
    description: 'Add text annotations and notes directly onto PDF pages.',
    gradient: 'bg-gradient-to-br from-red-500/5 to-pink-500/5',
  },
];

export default function Home() {
  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto w-full animate-fade-in">
      {/* Hero */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-primary rounded-2xl">
            <FileText className="w-7 h-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-space font-bold text-foreground">PDF Studio</h1>
            <p className="text-muted-foreground mt-0.5">Professional PDF editing tools, right in your browser</p>
          </div>
        </div>
        <div className="h-1 w-20 bg-gradient-to-r from-primary to-primary/30 rounded-full" />
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {tools.map(tool => (
          <ToolCard key={tool.to} {...tool} />
        ))}
      </div>

      <p className="text-center text-xs text-muted-foreground mt-10">
        All processing happens locally in your browser — your files never leave your device.
      </p>
    </div>
  );
}