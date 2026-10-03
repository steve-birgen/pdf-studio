import { useState, useEffect } from 'react';
import { readFileAsArrayBuffer, rotatePdf, downloadBlob } from '@/lib/pdfUtils';
import { renderAllPagesThumbnails } from '@/lib/pdfRenderer';
import FileUploadZone from '@/components/pdf/FileUploadZone';
import PageThumbnail from '@/components/pdf/PageThumbnail';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RotateCw, RotateCcw, Download, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Rotate() {
  const [file, setFile] = useState(null);
  const [thumbnails, setThumbnails] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [rotations, setRotations] = useState({});
  const [customAngle, setCustomAngle] = useState(90);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!file) return;
    setLoading(true);
    readFileAsArrayBuffer(file).then(buf => {
      renderAllPagesThumbnails(buf, 0.4).then(thumbs => {
        setThumbnails(thumbs);
        setRotations({});
        setSelected(new Set());
        setLoading(false);
      });
    });
  }, [file]);

  const toggleSelect = (i) => {
    setSelected(prev => {
      const s = new Set(prev);
      s.has(i) ? s.delete(i) : s.add(i);
      return s;
    });
  };

  const applyRotation = (angle) => {
    if (selected.size === 0) { toast.error('Select pages first'); return; }
    setRotations(prev => {
      const next = { ...prev };
      selected.forEach(i => { next[i] = ((next[i] || 0) + angle) % 360; });
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(thumbnails.map((_, i) => i)));
  const clearSelection = () => setSelected(new Set());

  const handleDownload = async () => {
    const rotationsList = Object.entries(rotations).map(([idx, angle]) => ({
      pageIndex: parseInt(idx),
      angle,
    }));
    if (!rotationsList.length) { toast.error('No rotations applied'); return; }
    setProcessing(true);
    const blob = await rotatePdf(file, rotationsList);
    downloadBlob(blob, `rotated_${file.name}`);
    setProcessing(false);
    toast.success('PDF downloaded!');
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto w-full animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-space font-bold text-foreground">Rotate Pages</h1>
        <p className="text-muted-foreground mt-1">Select pages and rotate them by any angle — even 1°</p>
      </div>

      {!file ? (
        <FileUploadZone onFile={setFile} label="Upload a PDF to rotate" />
      ) : (
        <div className="space-y-6">
          {/* Controls */}
          <div className="flex flex-wrap items-end gap-4 p-5 bg-card rounded-2xl border border-border">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Angle (degrees)</Label>
              <Input
                type="number"
                value={customAngle}
                onChange={e => setCustomAngle(Number(e.target.value))}
                className="w-28"
                min={1} max={359}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" onClick={() => applyRotation(customAngle)} className="gap-2">
                <RotateCw className="w-4 h-4" /> Rotate CW
              </Button>
              <Button variant="outline" onClick={() => applyRotation(-customAngle)} className="gap-2">
                <RotateCcw className="w-4 h-4" /> Rotate CCW
              </Button>
              <Button variant="outline" size="sm" onClick={selectAll}>Select All</Button>
              <Button variant="outline" size="sm" onClick={clearSelection}>Clear</Button>
            </div>
            <div className="ml-auto flex gap-2">
              <Button variant="outline" onClick={() => { setFile(null); setThumbnails([]); }} className="gap-2">
                <RefreshCw className="w-4 h-4" /> New File
              </Button>
              <Button onClick={handleDownload} disabled={processing} className="gap-2">
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Download
              </Button>
            </div>
          </div>

          {/* Pages */}
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
                  rotation={rotations[i] || 0}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}