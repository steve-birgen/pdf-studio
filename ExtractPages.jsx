import { useState, useEffect } from 'react';
import { readFileAsArrayBuffer, extractPages, downloadBlob } from '@/lib/pdfUtils';
import { renderAllPagesThumbnails } from '@/lib/pdfRenderer';
import FileUploadZone from '@/components/pdf/FileUploadZone';
import PageThumbnail from '@/components/pdf/PageThumbnail';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Loader2, RefreshCw, Scissors } from 'lucide-react';
import { toast } from 'sonner';

export default function ExtractPages() {
  const [file, setFile] = useState(null);
  const [thumbnails, setThumbnails] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!file) return;
    setLoading(true);
    readFileAsArrayBuffer(file).then(buf =>
      renderAllPagesThumbnails(buf, 0.4).then(thumbs => {
        setThumbnails(thumbs);
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

  const handleExtract = async () => {
    if (!selected.size) { toast.error('Select at least one page'); return; }
    setProcessing(true);
    const indices = Array.from(selected).sort((a, b) => a - b);
    const blob = await extractPages(file, indices);
    downloadBlob(blob, `extracted_${file.name}`);
    setProcessing(false);
    toast.success(`Extracted ${indices.length} page(s)!`);
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto w-full animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-space font-bold">Extract Pages</h1>
        <p className="text-muted-foreground mt-1">Select specific pages to export as a new PDF</p>
      </div>

      {!file ? (
        <FileUploadZone onFile={setFile} label="Upload a PDF to extract pages" />
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3 p-4 bg-card rounded-2xl border border-border">
            <Badge variant="secondary" className="gap-1.5">
              <Scissors className="w-3 h-3" /> {selected.size} selected
            </Badge>
            <Button variant="outline" size="sm" onClick={() => setSelected(new Set(thumbnails.map((_, i) => i)))}>Select All</Button>
            <Button variant="outline" size="sm" onClick={() => setSelected(new Set())}>Clear</Button>
            <div className="ml-auto flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => { setFile(null); setThumbnails([]); }}>
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button onClick={handleExtract} disabled={processing || !selected.size} className="gap-2">
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Extract {selected.size > 0 ? `(${selected.size})` : ''}
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="flex flex-wrap gap-4">
              {thumbnails.map((thumb, i) => (
                <PageThumbnail
                  key={i}
                  thumbnail={thumb}
                  index={i}
                  selected={selected.has(i)}
                  onSelect={toggleSelect}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}