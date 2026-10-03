import { useState, useEffect, useRef } from 'react';
import { readFileAsArrayBuffer, cropPdf, downloadBlob } from '@/lib/pdfUtils';
import { loadPdfDocument, renderPageToCanvas } from '@/lib/pdfRenderer';
import FileUploadZone from '@/components/pdf/FileUploadZone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Download, Loader2, RefreshCw, Crop as CropIcon } from 'lucide-react';
import { toast } from 'sonner';

export default function Crop() {
  const [file, setFile] = useState(null);
  const [arrayBuffer, setArrayBuffer] = useState(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const canvasRef = useRef(null);

  // Crop box: percentages of page (left, bottom, right inset from right, top inset from top)
  const [cropBox, setCropBox] = useState({ x: 5, y: 5, width: 90, height: 90 });

  useEffect(() => {
    if (!file) return;
    setLoading(true);
    readFileAsArrayBuffer(file).then(buf => {
      setArrayBuffer(buf);
      loadPdfDocument(buf).then(doc => {
        setPdfDoc(doc);
        setTotalPages(doc.numPages);
        setPageNumber(1);
        setLoading(false);
      });
    });
  }, [file]);

  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;
    renderPageToCanvas(pdfDoc, pageNumber, canvasRef.current, 1.2);
  }, [pdfDoc, pageNumber]);

  const handleCrop = async () => {
    setProcessing(true);
    const blob = await cropPdf(file, pageNumber - 1, cropBox);
    downloadBlob(blob, `cropped_p${pageNumber}_${file.name}`);
    setProcessing(false);
    toast.success('Cropped page downloaded!');
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto w-full animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-space font-bold">Crop PDF</h1>
        <p className="text-muted-foreground mt-1">Define crop margins as percentages of page dimensions</p>
      </div>

      {!file ? (
        <FileUploadZone onFile={setFile} label="Upload a PDF to crop" />
      ) : loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls */}
          <div className="space-y-5 bg-card rounded-2xl border border-border p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-space font-semibold">Crop Settings</h3>
              <Badge variant="secondary">Page {pageNumber}/{totalPages}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'x', label: 'Left offset %' },
                { key: 'y', label: 'Bottom offset %' },
                { key: 'width', label: 'Width %' },
                { key: 'height', label: 'Height %' },
              ].map(({ key, label }) => (
                <div key={key} className="space-y-1.5">
                  <Label className="text-xs">{label}</Label>
                  <Input
                    type="number"
                    min={0} max={100} step={1}
                    value={cropBox[key]}
                    onChange={e => setCropBox(prev => ({ ...prev, [key]: parseFloat(e.target.value) || 0 }))}
                    className="h-8 text-sm"
                  />
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Button
                variant="outline"
                size="icon"
                disabled={pageNumber <= 1}
                onClick={() => setPageNumber(p => p - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-center flex-1 text-muted-foreground">
                Page {pageNumber} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                disabled={pageNumber >= totalPages}
                onClick={() => setPageNumber(p => p + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-2 pt-1">
              <Button onClick={handleCrop} disabled={processing} className="w-full gap-2">
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Crop & Download
              </Button>
              <Button variant="outline" className="w-full gap-2" onClick={() => { setFile(null); setPdfDoc(null); }}>
                <RefreshCw className="w-4 h-4" /> New File
              </Button>
            </div>

            <div className="bg-muted/50 rounded-xl p-3">
              <p className="text-xs text-muted-foreground">
                Preview shows the full page. Crop box is applied as percentages: starting at <strong>{cropBox.x}%</strong> from left, <strong>{cropBox.y}%</strong> from bottom, with <strong>{cropBox.width}%</strong> width and <strong>{cropBox.height}%</strong> height.
              </p>
            </div>
          </div>

          {/* Canvas preview */}
          <div className="lg:col-span-2 bg-muted rounded-2xl border border-border flex items-center justify-center overflow-hidden relative p-4">
            <canvas ref={canvasRef} className="max-w-full max-h-[65vh] rounded-lg shadow-lg" />
            {/* Crop overlay */}
            <div
              className="absolute border-2 border-primary/70 pointer-events-none"
              style={{
                left: `calc(${cropBox.x}% + 1rem)`,
                bottom: `calc(${cropBox.y}% + 1rem)`,
                width: `${cropBox.width}%`,
                height: `${cropBox.height}%`,
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.35)',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}