import { useState } from 'react';
import { readFileAsArrayBuffer } from '@/lib/pdfUtils';
import { extractTextFromPdf } from '@/lib/pdfRenderer';
import FileUploadZone from '@/components/pdf/FileUploadZone';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Download, Loader2, RefreshCw, AlignLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function ExtractText() {
  const [file, setFile] = useState(null);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleFile = async (f) => {
    setFile(f);
    setLoading(true);
    const buf = await readFileAsArrayBuffer(f);
    const extracted = await extractTextFromPdf(buf);
    setPages(extracted);
    setLoading(false);
  };

  const allText = pages.map(p => `--- Page ${p.pageNumber} ---\n${p.text}`).join('\n\n');

  const copyAll = () => {
    navigator.clipboard.writeText(allText);
    toast.success('Copied to clipboard!');
  };

  const downloadTxt = () => {
    const blob = new Blob([allText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file?.name?.replace('.pdf', '')}_text.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Downloaded!');
  };

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto w-full animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-space font-bold text-foreground">Extract Text</h1>
        <p className="text-muted-foreground mt-1">Pull all text content from your PDF</p>
      </div>

      {!file ? (
        <FileUploadZone onFile={handleFile} label="Upload a PDF to extract text" />
      ) : loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Extracting text...</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 p-4 bg-card rounded-2xl border border-border">
            <Badge variant="secondary" className="gap-1.5">
              <AlignLeft className="w-3 h-3" /> {pages.length} pages
            </Badge>
            <Badge variant="secondary">{allText.length.toLocaleString()} characters</Badge>
            <div className="ml-auto flex gap-2">
              <Button variant="outline" size="sm" onClick={copyAll} className="gap-2">
                <Copy className="w-4 h-4" /> Copy All
              </Button>
              <Button size="sm" onClick={downloadTxt} className="gap-2">
                <Download className="w-4 h-4" /> Download .txt
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { setFile(null); setPages([]); }} className="gap-1">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {pages.map(p => (
              <div key={p.pageNumber} className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="text-xs">Page {p.pageNumber}</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={() => { navigator.clipboard.writeText(p.text); toast.success('Copied!'); }}
                  >
                    <Copy className="w-3 h-3" /> Copy
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed max-h-48 overflow-y-auto">
                  {p.text || <span className="italic text-muted-foreground/50">No text found on this page</span>}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}