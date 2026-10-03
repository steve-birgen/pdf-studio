import { useState } from 'react';
import { combinePdfs, downloadBlob } from '@/lib/pdfUtils';
import FileUploadZone from '@/components/pdf/FileUploadZone';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, X, GripVertical, Download, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function Combine() {
  const [files, setFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const dragIdx = { current: null };

  const addFiles = (newFiles) => {
    setFiles(prev => {
      const names = new Set(prev.map(f => f.name));
      return [...prev, ...newFiles.filter(f => !names.has(f.name))];
    });
  };

  const removeFile = (i) => setFiles(prev => prev.filter((_, idx) => idx !== i));

  const handleDragStart = (e, i) => { dragIdx.current = i; };
  const handleDrop = (e, dropI) => {
    e.preventDefault();
    if (dragIdx.current === null || dragIdx.current === dropI) return;
    setFiles(prev => {
      const next = [...prev];
      const [moved] = next.splice(dragIdx.current, 1);
      next.splice(dropI, 0, moved);
      return next;
    });
    dragIdx.current = null;
  };

  const handleCombine = async () => {
    if (files.length < 2) { toast.error('Add at least 2 PDFs'); return; }
    setProcessing(true);
    const blob = await combinePdfs(files);
    downloadBlob(blob, 'combined.pdf');
    setProcessing(false);
    toast.success('PDFs combined and downloaded!');
  };

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto w-full animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-space font-bold">Combine PDFs</h1>
        <p className="text-muted-foreground mt-1">Merge multiple PDFs into one. Drag to reorder.</p>
      </div>

      <div className="space-y-6">
        <FileUploadZone onFiles={addFiles} multiple label="Drop PDFs to add them" />

        {files.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant="secondary">{files.length} file(s)</Badge>
              <Button onClick={handleCombine} disabled={processing || files.length < 2} className="gap-2">
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Combine & Download
              </Button>
            </div>

            <div className="space-y-2">
              {files.map((file, i) => (
                <div
                  key={`${file.name}-${i}`}
                  className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border cursor-grab active:cursor-grabbing hover:border-primary/30 transition-colors"
                  draggable
                  onDragStart={(e) => handleDragStart(e, i)}
                  onDrop={(e) => handleDrop(e, i)}
                  onDragOver={(e) => e.preventDefault()}
                >
                  <GripVertical className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                  <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                    <FileText className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <Badge variant="outline" className="shrink-0 text-xs">{i + 1}</Badge>
                  <Button variant="ghost" size="icon" className="w-7 h-7 shrink-0" onClick={() => removeFile(i)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}