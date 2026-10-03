import { useState, useEffect, useRef } from 'react';
import { readFileAsArrayBuffer, downloadBlob } from '@/lib/pdfUtils';
import { loadPdfDocument, renderPageToCanvas } from '@/lib/pdfRenderer';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import FileUploadZone from '@/components/pdf/FileUploadZone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Download, Loader2, RefreshCw, Type, Trash2, MousePointer } from 'lucide-react';
import { toast } from 'sonner';

export default function EditPdf() {
  const [file, setFile] = useState(null);
  const [arrayBuffer, setArrayBuffer] = useState(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);

  // Annotations: array of { pageNumber, x, y, text, fontSize, color }
  const [annotations, setAnnotations] = useState([]);
  const [tool, setTool] = useState('text'); // 'text' | 'select'
  const [textInput, setTextInput] = useState('Annotation text');
  const [fontSize, setFontSize] = useState(14);
  const [color, setColor] = useState('#e11d48');
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!file) return;
    setLoading(true);
    readFileAsArrayBuffer(file).then(buf => {
      setArrayBuffer(buf);
      loadPdfDocument(buf).then(doc => {
        setPdfDoc(doc);
        setTotalPages(doc.numPages);
        setPageNumber(1);
        setAnnotations([]);
        setLoading(false);
      });
    });
  }, [file]);

  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;
    renderPageToCanvas(pdfDoc, pageNumber, canvasRef.current, 1.4).then(size => {
      setCanvasSize(size);
    });
  }, [pdfDoc, pageNumber]);

  const handleCanvasClick = (e) => {
    if (tool !== 'text') return;
    if (!textInput.trim()) { toast.error('Enter annotation text'); return; }
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    setAnnotations(prev => [...prev, {
      id: Date.now(),
      pageNumber,
      x, y,
      text: textInput,
      fontSize,
      color,
      canvasWidth: canvasRef.current.width,
      canvasHeight: canvasRef.current.height,
    }]);
  };

  const removeAnnotation = (id) => setAnnotations(prev => prev.filter(a => a.id !== id));

  const pageAnnotations = annotations.filter(a => a.pageNumber === pageNumber);

  const handleDownload = async () => {
    setProcessing(true);
    const pdfLibDoc = await PDFDocument.load(arrayBuffer);
    const helvetica = await pdfLibDoc.embedFont(StandardFonts.HelveticaBold);
    const pages = pdfLibDoc.getPages();

    for (const ann of annotations) {
      const page = pages[ann.pageNumber - 1];
      if (!page) continue;
      const { width: pgW, height: pgH } = page.getSize();
      // Convert canvas coords to PDF coords
      const pdfX = (ann.x / ann.canvasWidth) * pgW;
      const pdfY = pgH - (ann.y / ann.canvasHeight) * pgH;
      // Parse hex color
      const r = parseInt(ann.color.slice(1, 3), 16) / 255;
      const g = parseInt(ann.color.slice(3, 5), 16) / 255;
      const b = parseInt(ann.color.slice(5, 7), 16) / 255;
      page.drawText(ann.text, {
        x: pdfX,
        y: pdfY,
        size: ann.fontSize,
        font: helvetica,
        color: rgb(r, g, b),
      });
    }

    const pdfBytes = await pdfLibDoc.save();
    downloadBlob(new Blob([pdfBytes], { type: 'application/pdf' }), `edited_${file.name}`);
    setProcessing(false);
    toast.success('Edited PDF downloaded!');
  };

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto w-full animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-space font-bold">Edit PDF</h1>
        <p className="text-muted-foreground mt-1">Click on the page to add text annotations</p>
      </div>

      {!file ? (
        <FileUploadZone onFile={setFile} label="Upload a PDF to edit" />
      ) : loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="space-y-5 bg-card rounded-2xl border border-border p-5">
            <h3 className="font-space font-semibold">Text Tool</h3>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Annotation Text</Label>
                <Input value={textInput} onChange={e => setTextInput(e.target.value)} className="h-8 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Font Size</Label>
                <Input type="number" min={6} max={72} value={fontSize} onChange={e => setFontSize(Number(e.target.value))} className="h-8 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Color</Label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-10 h-8 rounded cursor-pointer border border-border" />
                  <span className="text-xs text-muted-foreground font-mono">{color}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant={tool === 'text' ? 'default' : 'outline'}
                size="sm" className="flex-1 gap-1.5"
                onClick={() => setTool('text')}
              >
                <Type className="w-3 h-3" /> Add Text
              </Button>
            </div>

            {/* Page nav */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" disabled={pageNumber <= 1} onClick={() => setPageNumber(p => p - 1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-center flex-1 text-muted-foreground">{pageNumber}/{totalPages}</span>
              <Button variant="outline" size="icon" disabled={pageNumber >= totalPages} onClick={() => setPageNumber(p => p + 1)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-2">
              <Button onClick={handleDownload} disabled={processing} className="w-full gap-2">
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Save PDF
              </Button>
              <Button variant="outline" className="w-full gap-2" onClick={() => { setFile(null); setPdfDoc(null); setAnnotations([]); }}>
                <RefreshCw className="w-4 h-4" /> New File
              </Button>
            </div>

            {/* Annotations list */}
            {annotations.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">{annotations.length} annotation(s)</p>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {annotations.map(ann => (
                    <div key={ann.id} className="flex items-center gap-2 text-xs bg-muted rounded-lg px-2 py-1">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: ann.color }} />
                      <span className="flex-1 truncate">p{ann.pageNumber}: {ann.text}</span>
                      <Button variant="ghost" size="icon" className="w-5 h-5 shrink-0" onClick={() => removeAnnotation(ann.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Canvas area */}
          <div className="lg:col-span-3 bg-muted rounded-2xl border border-border overflow-auto flex items-start justify-center p-4">
            <div
              className="relative cursor-crosshair"
              onClick={handleCanvasClick}
              style={{ display: 'inline-block' }}
            >
              <canvas ref={canvasRef} className="rounded-lg shadow-lg block" />
              {/* Render annotation overlays */}
              {pageAnnotations.map(ann => {
                const rect = canvasRef.current?.getBoundingClientRect();
                const scaleRatio = rect ? rect.width / ann.canvasWidth : 1;
                return (
                  <div
                    key={ann.id}
                    className="absolute pointer-events-none font-bold select-none"
                    style={{
                      left: (ann.x / ann.canvasWidth) * 100 + '%',
                      top: (ann.y / ann.canvasHeight) * 100 + '%',
                      color: ann.color,
                      fontSize: ann.fontSize * (rect ? rect.width / ann.canvasWidth : 1),
                      transform: 'translateY(-100%)',
                      whiteSpace: 'nowrap',
                      textShadow: '0 1px 3px rgba(0,0,0,0.3)',
                    }}
                  >
                    {ann.text}
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