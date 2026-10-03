import { useState, useEffect } from 'react';
import { readFileAsArrayBuffer, splitPdf, downloadBlob } from '@/lib/pdfUtils';
import { renderAllPagesThumbnails } from '@/lib/pdfRenderer';
import FileUploadZone from '@/components/pdf/FileUploadZone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Download, Loader2, RefreshCw, Plus, X, SplitSquareVertical } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function Split() {
  const [file, setFile] = useState(null);
  const [thumbnails, setThumbnails] = useState([]);
  const [splitPoints, setSplitPoints] = useState([0]); // start indices of each chunk
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!file) return;
    setLoading(true);
    readFileAsArrayBuffer(file).then(buf =>
      renderAllPagesThumbnails(buf, 0.3).then(thumbs => {
        setThumbnails(thumbs);
        setSplitPoints([0]);
        setLoading(false);
      })
    );
  }, [file]);

  const totalPages = thumbnails.length;

  const addSplit = () => {
    // Add a split after the current last split
    const last = splitPoints[splitPoints.length - 1];
    const nextStart = last + 1 < totalPages ? last + 1 : null;
    if (nextStart === null) { toast.error('No more pages to split'); return; }
    setSplitPoints(prev => [...prev, nextStart].sort((a, b) => a - b));
  };

  const updateSplit = (i, val) => {
    const num = parseInt(val) - 1; // convert 1-based to 0-based
    if (isNaN(num) || num < 0 || num >= totalPages) return;
    setSplitPoints(prev => {
      const next = [...prev];
      next[i] = num;
      return [...new Set(next)].sort((a, b) => a - b);
    });
  };

  const removeSplit = (i) => {
    if (i === 0) return; // can't remove first
    setSplitPoints(prev => prev.filter((_, idx) => idx !== i));
  };

  const handleSplit = async () => {
    if (splitPoints.length < 2) { toast.error('Add at least one split point'); return; }
    setProcessing(true);
    const blobs = await splitPdf(file, splitPoints);
    blobs.forEach((blob, i) => {
      downloadBlob(blob, `split_${i + 1}_${file.name}`);
    });
    setProcessing(false);
    toast.success(`Split into ${blobs.length} files!`);
  };

  // Compute chunk ranges for display
  const chunks = splitPoints.map((start, i) => {
    const end = i + 1 < splitPoints.length ? splitPoints[i + 1] - 1 : totalPages - 1;
    return { start, end, count: end - start + 1 };
  });

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto w-full animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-space font-bold">Split PDF</h1>
        <p className="text-muted-foreground mt-1">Define split points to divide the PDF into multiple files</p>
      </div>

      {!file ? (
        <FileUploadZone onFile={setFile} label="Upload a PDF to split" />
      ) : loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3 p-4 bg-card rounded-2xl border border-border">
            <Badge variant="secondary">{totalPages} pages total</Badge>
            <Badge variant="secondary">{chunks.length} output file(s)</Badge>
            <Button variant="outline" size="sm" onClick={addSplit} className="gap-2">
              <Plus className="w-4 h-4" /> Add Split
            </Button>
            <div className="ml-auto flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => { setFile(null); setThumbnails([]); }}>
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button onClick={handleSplit} disabled={processing || splitPoints.length < 2} className="gap-2">
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <SplitSquareVertical className="w-4 h-4" />}
                Split & Download
              </Button>
            </div>
          </div>

          {/* Split Points Editor */}
          <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
            <h3 className="font-space font-semibold text-sm">Split Points (start page of each section)</h3>
            <div className="space-y-2">
              {splitPoints.map((sp, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Badge variant={i === 0 ? 'secondary' : 'outline'} className="w-20 text-center justify-center text-xs">
                    File {i + 1}
                  </Badge>
                  <span className="text-xs text-muted-foreground">starts at page</span>
                  {i === 0 ? (
                    <span className="text-sm font-medium px-3 py-1 bg-muted rounded-lg">1</span>
                  ) : (
                    <Input
                      type="number"
                      min={2}
                      max={totalPages}
                      value={sp + 1}
                      onChange={e => updateSplit(i, e.target.value)}
                      className="w-20 h-8 text-sm"
                    />
                  )}
                  <span className="text-xs text-muted-foreground">→ ends at page {chunks[i]?.end + 1} ({chunks[i]?.count} pages)</span>
                  {i > 0 && (
                    <Button variant="ghost" size="icon" className="w-7 h-7 ml-auto" onClick={() => removeSplit(i)}>
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Visual page strip */}
          <div className="overflow-x-auto">
            <div className="flex gap-1 min-w-max pb-2">
              {thumbnails.map((thumb, i) => {
                const chunkIdx = splitPoints.filter(sp => sp <= i).length - 1;
                const isStart = splitPoints.includes(i) && i > 0;
                const colors = ['bg-violet-200', 'bg-blue-200', 'bg-emerald-200', 'bg-amber-200', 'bg-rose-200', 'bg-cyan-200'];
                return (
                  <div key={i} className="flex flex-col items-center gap-1 relative">
                    {isStart && <div className="absolute -left-0.5 top-0 bottom-0 w-0.5 bg-primary z-10" />}
                    <div className={cn("w-14 h-16 rounded overflow-hidden border-2 border-border relative", colors[chunkIdx % colors.length])}>
                      <img src={thumb.dataUrl} alt={`p${i+1}`} className="w-full h-full object-cover opacity-70" />
                    </div>
                    <span className="text-[9px] text-muted-foreground">{i + 1}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}