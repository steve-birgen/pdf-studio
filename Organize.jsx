import { useState, useEffect, useRef } from 'react';
import { readFileAsArrayBuffer, organizePdf, deletePages, downloadBlob } from '@/lib/pdfUtils';
import { renderAllPagesThumbnails } from '@/lib/pdfRenderer';
import FileUploadZone from '@/components/pdf/FileUploadZone';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Loader2, RefreshCw, Trash2, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function Organize() {
  const [file, setFile] = useState(null);
  const [thumbnails, setThumbnails] = useState([]);
  const [order, setOrder] = useState([]); // array of original indices
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const dragIdx = useRef(null);

  useEffect(() => {
    if (!file) return;
    setLoading(true);
    readFileAsArrayBuffer(file).then(buf =>
      renderAllPagesThumbnails(buf, 0.35).then(thumbs => {
        setThumbnails(thumbs);
        setOrder(thumbs.map((_, i) => i));
        setSelected(new Set());
        setLoading(false);
      })
    );
  }, [file]);

  const toggleSelect = (i) => {
    setSelected(prev => {
      const s = new Set(prev);
      s.has(i) ? s.delete(i) : s.add(i);
      return s;
    });
  };

  const handleDragStart = (e, idx) => { dragIdx.current = idx; };
  const handleDrop = (e, dropIdx) => {
    e.preventDefault();
    if (dragIdx.current === null || dragIdx.current === dropIdx) return;
    setOrder(prev => {
      const next = [...prev];
      const [moved] = next.splice(dragIdx.current, 1);
      next.splice(dropIdx, 0, moved);
      return next;
    });
    dragIdx.current = null;
  };

  const handleDelete = () => {
    if (!selected.size) return;
    setOrder(prev => prev.filter((_, i) => !selected.has(i)));
    setSelected(new Set());
    toast.success('Pages removed');
  };

  const handleDownload = async () => {
    setProcessing(true);
    const blob = await organizePdf(file, order);
    downloadBlob(blob, `organized_${file.name}`);
    setProcessing(false);
    toast.success('PDF downloaded!');
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto w-full animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-space font-bold">Organize Pages</h1>
        <p className="text-muted-foreground mt-1">Drag & drop to reorder pages. Select pages to delete them.</p>
      </div>

      {!file ? (
        <FileUploadZone onFile={setFile} label="Upload a PDF to organize" />
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3 p-4 bg-card rounded-2xl border border-border">
            <Badge variant="secondary">{order.length} pages</Badge>
            {selected.size > 0 && (
              <Button variant="destructive" size="sm" onClick={handleDelete} className="gap-2">
                <Trash2 className="w-4 h-4" /> Delete {selected.size} page(s)
              </Button>
            )}
            <div className="ml-auto flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => { setFile(null); setThumbnails([]); }}>
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button onClick={handleDownload} disabled={processing} className="gap-2">
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Download
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="flex flex-wrap gap-4">
              {order.map((origIdx, displayIdx) => {
                const thumb = thumbnails[origIdx];
                if (!thumb) return null;
                return (
                  <div
                    key={`${origIdx}-${displayIdx}`}
                    className={cn(
                      "relative group flex flex-col items-center gap-2 p-2 rounded-xl cursor-grab active:cursor-grabbing transition-all duration-150 select-none",
                      selected.has(displayIdx) ? "bg-destructive/10 ring-2 ring-destructive" : "hover:bg-muted"
                    )}
                    draggable
                    onDragStart={(e) => handleDragStart(e, displayIdx)}
                    onDrop={(e) => handleDrop(e, displayIdx)}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => toggleSelect(displayIdx)}
                  >
                    <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-60 transition-opacity">
                      <GripVertical className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="relative overflow-hidden rounded-lg shadow-md bg-white border border-border">
                      <img
                        src={thumb.dataUrl}
                        alt={`Page ${origIdx + 1}`}
                        style={{ width: thumb.width, height: thumb.height, maxWidth: 120, display: 'block' }}
                      />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">
                      {displayIdx + 1} <span className="text-muted-foreground/50">(orig. {origIdx + 1})</span>
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}