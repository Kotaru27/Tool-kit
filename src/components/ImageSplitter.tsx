import { nextFrame, delayFrames } from '../utils/frame';
import { motion, AnimatePresence } from 'framer-motion';
import React, { useState, useRef } from 'react';
import { Scissors, Upload, Download, Trash2 } from 'lucide-react';
import { Core } from '../utils/core';
import JSZip from 'jszip';
import LoadingOverlay from './LoadingOverlay';
import ConfirmModal from './ConfirmModal';
import SpecialText from './SpecialText';
import { SpecialInput } from './SpecialInput';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } }
} as const;

const itemVariants = {
  hidden: { opacity: 0, scale: 0.98 },
  show: { opacity: 1, scale: 1, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
} as const;

interface SplitItem {
  id: string;
  file: File;
  url: string;
  img: HTMLImageElement | null;
  checked: boolean;
  splitBlobs: { blob: Blob }[];
}

export default function ImageSplitter() {
  const [items, setItems] = useState<SplitItem[]>([]);
  const [mode, setMode] = useState('vert');
  const [rows, setRows] = useState(2);
  const [cols, setCols] = useState(2);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | File[]) => {
    const valid = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (!valid.length) return;

    const newItems: SplitItem[] = valid.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      url: Core.BlobRegistry.create(file),
      img: null,
      checked: true,
      splitBlobs: [],
    }));

    setItems((prev) => [...newItems, ...prev]);
  };

  const clearAll = () => {
    setShowConfirm(true);
  };

  const confirmClearAll = () => {
    items.forEach((i) => URL.revokeObjectURL(i.url));
    setItems([]);
    setShowConfirm(false);
  };

  const process = async () => {
    setIsProcessing(true);
    await delayFrames(6);

    try {
      const rInput = rows || 1;
      const cInput = cols || 1;
      let r = 1, c = 1;
      if (mode === 'grid') { r = rInput; c = cInput; }
      else if (mode === 'vert') { c = cInput; }
      else if (mode === 'horz') { r = rInput; }

      const updatedItems = [...items];
      for (const item of updatedItems) {
        if (!item.checked) continue;
        if (!item.img) {
          item.img = new Image();
          item.img.src = item.url;
          await new Promise((res) => { 
            item.img!.onload = res; 
            item.img!.onerror = res;
          });
        }
        if (!item.img.complete || item.img.naturalWidth === 0) continue;
        item.splitBlobs = [];
        const pW = item.img!.naturalWidth / c;
        const pH = item.img!.naturalHeight / r;

        for (let row = 0; row < r; row++) {
          for (let col = 0; col < c; col++) {
            const cvs = document.createElement('canvas');
            cvs.width = pW;
            cvs.height = pH;
            cvs.getContext('2d')!.drawImage(item.img!, col * pW, row * pH, pW, pH, 0, 0, pW, pH);
            const blob = await new Promise<Blob>((res) => cvs.toBlob(res as BlobCallback, item.file.type));
            item.splitBlobs.push({ blob });
          }
        }
      }

      setItems(updatedItems);
    } catch (e: any) {
      console.error(e);
      setAlertMessage(`Failed to process images: ${e.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const download = async () => {
    setIsDownloading(true);
    try {
      const zip = new JSZip();
      let count = 1;

      items.forEach((item) => {
        const ext = item.file.name.split('.').pop();
        if (item.checked && item.splitBlobs.length > 0) {
          item.splitBlobs.forEach((b) => {
            zip.file(`${count}.${ext}`, b.blob);
            count++;
          });
        } else {
          zip.file(`${count}.${ext}`, item.file);
          count++;
        }
      });

      const content = await zip.generateAsync({ type: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(content);
      a.download = 'split_images.zip';
      a.click();
    } catch (e: any) {
      console.error(e);
      setAlertMessage(`Failed to download images: ${e.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const toggleCheck = (id: string, checked: boolean) => {
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, checked } : i));
  };

  const getGridStyle = () => {
    const rInput = rows || 1;
    const cInput = cols || 1;
    let r = 1, c = 1;
    if (mode === 'grid') { r = rInput; c = cInput; }
    else if (mode === 'vert') { c = cInput; }
    else if (mode === 'horz') { r = rInput; }
    return { '--rows': r, '--cols': c } as React.CSSProperties;
  };

  return (
    <div className="flex flex-col relative w-full h-full">
      <ConfirmModal
        isOpen={showConfirm}
        title="Reset All"
        message="Are you sure you want to remove all images and reset settings? This action cannot be undone."
        onConfirm={confirmClearAll}
        onCancel={() => setShowConfirm(false)}
        confirmText="Reset"
      />
      <ConfirmModal
        isOpen={!!alertMessage}
        title="Notice"
        message={alertMessage || ''}
        onConfirm={() => setAlertMessage(null)}
        onCancel={() => setAlertMessage(null)}
        isAlert={true}
      />
      <LoadingOverlay isVisible={isProcessing || isDownloading} message={isProcessing ? "Processing images..." : "Generating ZIP file..."} />
      
      <div className="grid grid-cols-1 lg:grid-cols-[384px_1fr] gap-8 items-start">
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex flex-col gap-6 sticky top-6 overflow-y-auto max-h-[calc(100vh-160px)] pr-[8px]">
          <motion.div variants={itemVariants}
            className="border border-dashed border-border-strong bg-bg-main  text-center p-[48px] rounded-[8px] cursor-pointer transition-colors duration-300 hover:border-[#737373] hover:bg-bg-input"
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-border-strong'); }}
            onDragLeave={(e) => e.currentTarget.classList.remove('border-border-strong')}
            onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove('border-border-strong'); handleFiles(e.dataTransfer.files); }}
          >
            <label className="flex flex-col items-center justify-center gap-4 w-full cursor-pointer h-full">
              <input accept="image/*" hidden multiple type="file" ref={fileInputRef} onChange={(e) => { if (e.target.files) handleFiles(e.target.files); }} />
              <Upload className="w-[32px] h-[32px] text-text-muted" /> 
              <span className="font-mono text-[14px] uppercase tracking-widest text-text-main">Drop Images</span>
            </label>
          </motion.div>
          
          <motion.div variants={containerVariants} className="flex flex-col gap-6">
            <motion.div variants={itemVariants} className="bg-bg-panel border border-border-color rounded-[8px] p-6 flex flex-col gap-4">
              <span className="font-mono text-[12px] text-text-muted font-bold uppercase tracking-widest block mb-[8px]">Configuration</span>
              
              <select className="bg-bg-main  border border-border-color text-text-main font-mono text-[14px] rounded-[4px] px-[16px] h-[48px] w-full focus:border-border-strong transition-colors appearance-none" style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23737373%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px top 50%', backgroundSize: '12px auto' }} value={mode} onChange={(e) => setMode(e.target.value)}>
                <option value="vert">Columns Only</option>
                <option value="horz">Rows Only</option>
                <option value="grid">Grid (Rows & Cols)</option>
              </select>
              
              <div className="flex gap-4 mt-[16px]">
                <div className="flex-1">
                  <label className="flex flex-col gap-2">
                    <span className="font-mono text-[12px] text-text-muted font-bold uppercase tracking-widest block">Rows</span>
                    <SpecialInput disabled={mode === 'vert'} min="1" type="number" value={rows} onChange={(e) => setRows(parseInt(e.target.value) || 1)} />
                  </label>
                </div>
                <div className="flex-1">
                  <label className="flex flex-col gap-2">
                    <span className="font-mono text-[12px] text-text-muted font-bold uppercase tracking-widest block">Cols</span>
                    <SpecialInput disabled={mode === 'horz'} min="1" type="number" value={cols} onChange={(e) => setCols(parseInt(e.target.value) || 1)} />
                  </label>
                </div>
              </div>
            </motion.div>
            
            <motion.div variants={itemVariants} className="flex flex-col gap-4">
              <motion.button className="bg-text-main text-bg-main h-[48px] rounded-[4px] font-mono text-[14px] uppercase tracking-widest font-bold w-full transition-colors hover:bg-text-muted disabled:opacity-50" onClick={process} disabled={isProcessing || !items.length} whileTap={{ scale: 0.98 }}>
                Process
              </motion.button>
              <motion.button className="bg-bg-input border border-border-strong text-text-main h-[48px] rounded-[4px] font-mono text-[14px] uppercase tracking-widest font-bold w-full hover:bg-bg-hover transition-colors disabled:opacity-50" onClick={download} disabled={isDownloading || !items.some(i => i.splitBlobs.length > 0)} whileTap={{ scale: 0.98 }}>
                Download Zip
              </motion.button>
              <motion.button className="bg-transparent border border-border-strong text-[#EF4444] h-[48px] rounded-[4px] font-mono text-[14px] uppercase tracking-widest font-bold w-full hover:bg-[rgba(239,68,68,0.1)] transition-colors" onClick={clearAll} whileTap={{ scale: 0.98 }}>
                Reset All
              </motion.button>
            </motion.div>
          </motion.div>
        </motion.div>
        
        <div className="flex-1 w-full min-w-0">
          <AnimatePresence mode="wait">
            {!items.length ? (
              <motion.div 
                key="empty-splitter"
                variants={itemVariants}
                initial="hidden"
                animate="show"
                exit="hidden"
                className="border border-dashed border-border-color bg-bg-input rounded-[8px] flex flex-col items-center justify-center p-12 gap-5 text-center min-h-[350px] w-full"
              >
                <div className="w-[48px] h-[48px] rounded-full border border-border-subtle bg-bg-panel flex items-center justify-center mb-1 shrink-0">
                  <Scissors className="w-[18px] h-[18px] text-text-muted" />
                </div>
                <div className="flex flex-col gap-2 w-full max-w-sm text-center px-4 justify-center items-center">
                  <p className="font-mono text-[13px] uppercase tracking-widest text-text-main font-bold">No images loaded</p>
                  
                </div>
              </motion.div>
            ) : (
              <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6 content-start w-full">
                {items.map((item, index) => (
                  <motion.div 
                    variants={itemVariants}
                    key={item.id} 
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    className="bg-bg-panel border border-border-color flex flex-col rounded-[8px] overflow-hidden transition-colors duration-300 hover:border-border-strong"
                  >
                    <div className="bg-bg-main  flex items-center justify-center aspect-square overflow-hidden p-4 relative pointer-events-none border-b border-border-color bg-checkered absolute inset-0 z-0 opacity-50" >
                      <img src={item.url} className="max-w-full max-h-full object-contain shadow-xl" alt={item.file.name} />
                      <div className="absolute inset-0 z-10" style={{ 
                        ...getGridStyle(),
                        backgroundImage: 'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)',
                        backgroundSize: 'calc(100% / max(1, var(--cols, 1))) calc(100% / max(1, var(--rows, 1)))'
                      }}></div>
                    </div>
                    <div className="p-6 flex flex-col gap-4 bg-bg-panel">
                      <div className="flex justify-between items-center">
                        <span className="truncate flex-1 text-[13px] font-mono text-text-main uppercase tracking-tight">{item.file.name}</span>
                        <label className="flex items-center cursor-pointer ml-[16px]">
                          <input type="checkbox" className="w-[16px] h-[16px] accent-text-main" checked={item.checked} onChange={(e) => toggleCheck(item.id, e.target.checked)} />
                        </label>
                      </div>
                      <div className="text-[11px] font-mono text-text-muted uppercase tracking-wider">
                        {item.splitBlobs.length > 0 ? `Done (${item.splitBlobs.length} pieces)` : 'Ready'}
                      </div>
                      <div className="flex gap-4 mt-[8px]">
                        <motion.button className="flex items-center justify-center bg-[rgba(239,68,68,0.05)] text-[#EF4444] rounded-[4px] border border-[rgba(239,68,68,0.2)] hover:bg-[#EF4444] hover:text-text-main transition-colors h-[40px] px-[16px] flex-1 font-mono text-[11px] uppercase tracking-widest font-bold gap-2" whileTap={{ scale: 0.95 }} onClick={() => {
                          URL.revokeObjectURL(item.url);
                          setItems((p) => p.filter((x) => x.id !== item.id));
                        }}><Trash2 className="w-[14px] h-[14px]" /> Remove</motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
