import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PdfDownload({ url, title }: { url: string; title: string }) {
  const [file, setFile] = useState<Blob | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    setFile(null); setError(false);
    void fetch(url).then(async response => {
      if (!response.ok) throw new Error('Unavailable');
      const blob = await response.blob();
      if (!blob.size || !blob.type.includes('pdf')) throw new Error('Invalid PDF');
      if (active) setFile(blob);
    }).catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [url]);
  const download = async () => {
    if (!file) return;
    const name = `${title.replace(/[^a-z0-9 .-]/gi, '')}.pdf`;
    const sharedFile = new File([file], name, { type: 'application/pdf' });
    if (matchMedia('(pointer: coarse)').matches && navigator.canShare?.({ files: [sharedFile] })) {
      try { await navigator.share({ files: [sharedFile] }); return; }
      catch (e) { if ((e as DOMException).name === 'AbortError') return; }
    }
    const href = URL.createObjectURL(file);
    const a = document.createElement('a'); a.href = href; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(href), 30000);
  };
  return <div><Button variant="outline" disabled={!file} onClick={() => void download()}><Download/>{error ? 'PDF unavailable' : file ? 'Download PDF' : 'Preparing PDF…'}</Button></div>;
}