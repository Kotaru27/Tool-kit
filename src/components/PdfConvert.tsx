import { motion, AnimatePresence } from 'framer-motion';
import React, { useState, useRef, useEffect } from 'react';
import { FileText, Upload, X, Download, Trash2 } from 'lucide-react';
import { Core } from '../utils/core';
import JSZip from 'jszip';
import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import LoadingOverlay from './LoadingOverlay';
import ConfirmModal from './ConfirmModal';
import SpecialText from './SpecialText';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } }
} as const;

const itemVariants = {
  hidden: { opacity: 0, scale: 0.98 },
  show: { opacity: 1, scale: 1, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
} as const;

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

interface PdfPage {
  num: number;
  blob: Blob;
  url: string;
  checked: boolean;
}

interface PdfData {
  id: string;
  name: string;
  total: number;
  pages: PdfPage[];
  format: string;
  thumbnail?: string;
  progress: number;
  status: string;
}

export default function PdfConvert() {
  const [pdfs, setPdfs] = useState<PdfData[]>([]);
  const [format, setFormat] = useState('image/png');
  const [isProcessing, setIsProcessing] = useState(false);
  const [globalProgress, setGlobalProgress] = useState({ text: 'Initializing...', percent: 0 });
  const [selectedPdf, setSelectedPdf] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const abortCtrlRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (abortCtrlRef.current) {
        abortCtrlRef.current.abort();
      }
    };
  }, []);

  const handleFiles = async (files: FileList | File[]) => {
    const pdfFiles = Array.from(files).filter((f) => f.type === 'application/pdf');
    if (pdfFiles.length === 0) {
      setAlertMessage('Please upload valid PDF files.');
      return;
    }

    setIsProcessing(true);
    abortCtrlRef.current = new AbortController();
    const signal = abortCtrlRef.current.signal;

    try {
      for (const file of pdfFiles) {
        if (signal.aborted) break;
        await processSinglePdf(file, format, signal);
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') setAlertMessage(e.message);
    } finally {
      setIsProcessing(false);
      abortCtrlRef.current = null;
    }
  };

  const processSinglePdf = async (file: File, format: string, signal: AbortSignal) => {
    const pdfId = `pdf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setGlobalProgress({ text: `Loading ${file.name}...`, percent: 0 });

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
      
      const newPdf: PdfData = {
        id: pdfId,
        name: file.name,
        total: pdf.numPages,
        pages: [],
        format,
        progress: 0,
        status: 'Processing...',
      };
      
      setPdfs((prev) => [newPdf, ...prev]);

      for (let i = 1; i <= pdf.numPages; i++) {
        if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
        
        setGlobalProgress({ text: `Rendering ${file.name} (Page ${i}/${pdf.numPages})`, percent: Math.round((i / pdf.numPages) * 100) });
        
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        await page.render({ canvasContext: canvas.getContext('2d')!, viewport } as any).promise;
        
        const blob = await new Promise<Blob>((r) => canvas.toBlob(r as BlobCallback, format, 0.9));
        const url = Core.BlobRegistry.create(blob);
        
        setPdfs((prev) => prev.map((p) => {
          if (p.id === pdfId) {
            const updated = { ...p, progress: i };
            updated.pages.push({ num: i, blob, url, checked: true });
            if (i === 1) updated.thumbnail = canvas.toDataURL(format, 0.5);
            if (i === pdf.numPages) updated.status = `${pdf.numPages} Pages`;
            return updated;
          }
          return p;
        }));
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error(err);
        setAlertMessage(`Failed to process ${file.name}: ${err.message}`);
      }
    }
  };

  const clearAll = () => {
    setShowConfirm(true);
  };

  const confirmClearAll = () => {
    setPdfs([]);
    Core.BlobRegistry.revokeAll();
    setShowConfirm(false);
  };

  const cancelProcessing = () => {
    if (abortCtrlRef.current) abortCtrlRef.current.abort();
  };

  const toggleAll = (val: boolean) => {
    if (!selectedPdf) return;
    setPdfs((prev) => prev.map((p) => {
      if (p.id === selectedPdf) {
        return { ...p, pages: p.pages.map((page) => ({ ...page, checked: val })) };
      }
      return p;
    }));
  };

  const togglePage = (pageNum: number, val: boolean) => {
    if (!selectedPdf) return;
    setPdfs((prev) => prev.map((p) => {
      if (p.id === selectedPdf) {
        return { ...p, pages: p.pages.map((page) => page.num === pageNum ? { ...page, checked: val } : page) };
      }
      return p;
    }));
  };

  const downloadSingle = (url: string, name: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
  };

  const downloadSelected = async () => {
    if (!selectedPdf) return;
    const data = pdfs.find((p) => p.id === selectedPdf);
    if (!data) return;
    
    const selected = data.pages.filter((p) => p.checked);
    if (selected.length === 0) {
      setAlertMessage('No pages selected.');
      return;
    }
    
    const zip = new JSZip();
    const ext = data.format.split('/')[1] === 'jpeg' ? 'jpg' : 'png';
    selected.forEach((p) => zip.file(`${p.num}.${ext}`, p.blob));
    
    const content = await zip.generateAsync({ type: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(content);
    a.download = `${data.name}_images.zip`;
    a.click();
  };

  const activePdfData = pdfs.find((p) => p.id === selectedPdf);

  return (
    <div className="flex flex-col relative w-full h-full">
      <ConfirmModal
        isOpen={showConfirm}
        title="Clear All PDFs"
        message="Are you sure you want to remove all PDFs? This action cannot be undone."
        onConfirm={confirmClearAll}
        onCancel={() => setShowConfirm(false)}
        confirmText="Clear"
      />
      <ConfirmModal
        isOpen={!!alertMessage}
        title="Notice"
        message={alertMessage || ''}
        onConfirm={() => setAlertMessage(null)}
        onCancel={() => setAlertMessage(null)}
        isAlert={true}
      />
      <LoadingOverlay isVisible={isProcessing} message={globalProgress.text} progress={globalProgress.percent} />
      
      <div className="grid grid-cols-1 lg:grid-cols-[384px_1fr] gap-8 items-start">
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex flex-col gap-6 sticky top-6 overflow-y-auto max-h-[calc(100vh-160px)] pr-[8px]">
          <motion.div variants={itemVariants}
            className="border border-dashed border-border-strong bg-bg-main  text-center p-[48px] rounded-[8px] cursor-pointer transition-colors duration-300 hover:border-[#737373] hover:bg-bg-input"
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-border-strong'); }}
            onDragLeave={(e) => e.currentTarget.classList.remove('border-border-strong')}
            onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove('border-border-strong'); handleFiles(e.dataTransfer.files); }}
          >
            <label className="flex flex-col items-center justify-center gap-4 w-full cursor-pointer h-full">
              <input accept="application/pdf" hidden multiple type="file" onChange={(e) => { if (e.target.files) handleFiles(e.target.files); }} />
              <Upload className="w-[32px] h-[32px] text-text-muted" /> 
              <span className="font-mono text-[14px] uppercase tracking-widest text-text-main">Drop PDF Files</span>
            </label>
          </motion.div>
          
          <motion.div variants={itemVariants} className="bg-bg-panel border border-border-color rounded-[8px] p-6 flex flex-col gap-4">
            <span className="font-mono text-[12px] text-text-muted font-bold uppercase tracking-widest block mb-[8px]">Output Format</span>
            <select className="bg-bg-main  border border-border-color text-text-main font-mono text-[14px] rounded-[4px] px-[16px] h-[48px] w-full focus:border-border-strong transition-colors appearance-none" style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23737373%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px top 50%', backgroundSize: '12px auto' }} value={format} onChange={(e) => setFormat(e.target.value)}>
              <option value="image/png">PNG</option>
              <option value="image/jpeg">JPG</option>
            </select>
            <div className="flex flex-col gap-4 mt-[16px]">
              {isProcessing && (
                <motion.button className="bg-transparent border border-border-strong text-[#EF4444] h-[48px] rounded-[4px] font-mono text-[14px] uppercase tracking-widest font-bold w-full transition-colors hover:bg-[rgba(239,68,68,0.1)] disabled:opacity-50" onClick={cancelProcessing} whileTap={{ scale: 0.98 }}>Cancel</motion.button>
              )}
              <motion.button className="bg-transparent border border-border-strong text-[#EF4444] h-[48px] rounded-[4px] font-mono text-[14px] uppercase tracking-widest font-bold w-full transition-colors hover:bg-[rgba(239,68,68,0.1)] disabled:opacity-50" onClick={clearAll} disabled={isProcessing || !pdfs.length} whileTap={{ scale: 0.98 }}>Clear All</motion.button>
            </div>
          </motion.div>
        </motion.div>
        
        <div className="flex-1 w-full min-w-0">
          <AnimatePresence mode="wait">
            {!pdfs.length ? (
              <motion.div 
                key="empty-pdf"
                variants={itemVariants}
                initial="hidden"
                animate="show"
                exit="hidden"
                className="border border-dashed border-border-color bg-bg-input rounded-[8px] flex flex-col items-center justify-center p-12 gap-5 text-center min-h-[350px] w-full"
              >
                <div className="w-[48px] h-[48px] rounded-full border border-border-subtle bg-bg-panel flex items-center justify-center mb-1 shrink-0">
                  <FileText className="w-[18px] h-[18px] text-text-muted" />
                </div>
                <div className="flex flex-col gap-2 w-full max-w-sm text-center px-4 justify-center items-center">
                  <p className="font-mono text-[13px] uppercase tracking-widest text-text-main font-bold">No PDFs loaded</p>
                  
                </div>
              </motion.div>
            ) : (
              <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-6 content-start w-full">
                {pdfs.map((pdf) => (
                  <motion.div 
                    variants={itemVariants} 
                    key={pdf.id} 
                    className="bg-bg-panel border border-border-color flex flex-col rounded-[8px] overflow-hidden transition-colors duration-300 hover:border-border-strong cursor-pointer" 
                    onClick={() => setSelectedPdf(pdf.id)}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="bg-bg-main  flex items-center justify-center relative pointer-events-none border-b border-border-color bg-checkered absolute inset-0 z-0 opacity-50" >
                      {pdf.thumbnail ? (
                        <img src={pdf.thumbnail} className="w-full h-[240px] block object-contain shadow-xl" alt={pdf.name} />
                      ) : (
                        <div className="w-full h-[240px] flex justify-center items-center text-[13px] font-sans text-text-subtle tracking-widest">Processing...</div>
                      )}
                    </div>
                    <div className="p-6 flex flex-col gap-2 bg-bg-panel">
                      <div className="font-mono text-[13px] text-text-main truncate font-medium uppercase tracking-tight">{pdf.name}</div>
                      <div className="text-[13px] font-sans text-text-subtle tracking-wider">{pdf.status}</div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {selectedPdf && activePdfData && (
          <motion.div 
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 32 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-0 bg-bg-main /95 backdrop-blur-md z-[1000] flex flex-col p-8 sm:p-12"
          >
            <div className="flex justify-between mb-[32px] border-b border-border-color pb-[24px] items-center flex-wrap gap-6">
              <div>
                <h3 className="m-0 text-[32px] font-medium text-text-main tracking-tight">
                  <SpecialText speed={20}>{activePdfData.name}</SpecialText>
                </h3>
                <span className="font-mono text-[14px] text-text-muted uppercase tracking-widest">{activePdfData.total} Pages</span>
              </div>
              <div className="flex gap-4 items-center">
                <label className="flex items-center gap-3 cursor-pointer text-text-main font-mono text-[12px] uppercase tracking-widest">
                  <input className="w-[16px] h-[16px] accent-text-main" type="checkbox" checked={activePdfData.pages.every(p => p.checked)} onChange={(e) => toggleAll(e.target.checked)} /> Select All
                </label>
                <button className="bg-text-main text-bg-main h-[40px] px-[24px] rounded-[4px] font-mono text-[12px] uppercase tracking-widest font-bold transition-colors hover:bg-text-muted" onClick={downloadSelected}>Download Selected</button>
                <button className="bg-bg-input text-text-main w-[40px] h-[40px] flex items-center justify-center rounded-[4px] transition-colors hover:bg-bg-hover" onClick={() => setSelectedPdf(null)}><X className="w-[20px] h-[20px]" /></button>
              </div>
            </div>
            <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-8 overflow-y-auto pb-[64px]">
              {activePdfData.pages.map((page) => {
                const ext = activePdfData.format.split('/')[1] === 'jpeg' ? 'jpg' : 'png';
                return (
                  <motion.div variants={itemVariants}
                    key={page.num} 
                    className="bg-bg-panel border border-border-color rounded-[8px] overflow-hidden flex flex-col transition-colors duration-300 hover:border-border-strong"
                  >
                    <div className="bg-bg-main  flex justify-center border-b border-border-color relative bg-checkered absolute inset-0 z-0 opacity-50" >
                      <img src={page.url} className="w-full block cursor-pointer aspect-square object-contain pointer-events-none" alt={`Page ${page.num}`} onClick={() => window.open(page.url, '_blank')} />
                    </div>
                    <div className="p-5 flex flex-col gap-4 bg-bg-panel">
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-[12px] text-text-muted uppercase tracking-widest font-bold">#{page.num}</span>
                        <div className="flex gap-4 items-center">
                          <button className="bg-bg-input text-text-main p-[8px] rounded-[4px] hover:bg-bg-hover transition-colors" onClick={() => downloadSingle(page.url, `${page.num}.${ext}`)}>
                            <Download className="w-[14px] h-[14px]" />
                          </button>
                          <input type="checkbox" className="w-[16px] h-[16px] accent-text-main" checked={page.checked} onChange={(e) => togglePage(page.num, e.target.checked)} />
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <button className="flex items-center justify-center gap-2 bg-[rgba(239,68,68,0.05)] text-[#EF4444] rounded-[4px] border border-[rgba(239,68,68,0.2)] hover:bg-[#EF4444] hover:text-text-main transition-colors h-[32px] flex-1 text-[12px] uppercase font-mono tracking-widest font-bold" onClick={() => {
                          URL.revokeObjectURL(page.url);
                          setPdfs((prev) => prev.map((p) => p.id === activePdfData.id ? { ...p, pages: p.pages.filter((pg) => pg.num !== page.num) } : p));
                        }}><Trash2 className="w-[14px] h-[14px]" /> Remove</button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
