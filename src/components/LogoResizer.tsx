import { motion, AnimatePresence } from 'framer-motion';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Image as ImageIcon, Upload, Download, Trash2, X, 
  ChevronLeft, ChevronRight, Maximize2, Settings 
} from 'lucide-react';
import { Core } from '../utils/core';
import JSZip from 'jszip';
import LoadingOverlay from './LoadingOverlay';
import ConfirmModal from './ConfirmModal';
import { SpecialInput, SpecialTextarea } from './SpecialInput';
import SpecialText from './SpecialText';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.05 }
  }
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 15, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 350, damping: 28 } }
} as const;

interface CardData {
  id: string;
  file: File;
  url: string;
  text: string;
  fname: string;
  fontSize: number;
  hasLocalFont: boolean;
  txtSlider: number;
  imgSlider: number;
  padding: number | null;
  img: HTMLImageElement;
}

const FONTS_LIST = [
  { value: 'Arial', label: 'Arial (MS Paint Classic)' },
  { value: 'Calibri', label: 'Calibri' },
  { value: 'Comic Sans MS', label: 'Comic Sans MS' },
  { value: 'Courier New', label: 'Courier New (Fixed)' },
  { value: 'Georgia', label: 'Georgia (Serif)' },
  { value: 'Impact', label: 'Impact (Heavy Bold)' },
  { value: 'Lucida Console', label: 'Lucida Console (Mono)' },
  { value: 'Palatino Linotype', label: 'Palatino Linotype' },
  { value: 'Segoe UI', label: 'Segoe UI' },
  { value: 'Tahoma', label: 'Tahoma' },
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Trebuchet MS', label: 'Trebuchet MS' },
  { value: 'Verdana', label: 'Verdana' },
  { value: 'sans-serif', label: 'Default System Sans' }
];

export default function LogoResizer() {
  const [cards, setCards] = useState<CardData[]>([]);
  const [globalFontSize, setGlobalFontSize] = useState<number>(28);
  const [isBold, setIsBold] = useState<boolean>(false);
  const [fontColor, setFontColor] = useState<string>('#000000');
  const [fontFamily, setFontFamily] = useState<string>('Arial');
  const [globalImgPos, setGlobalImgPos] = useState<number>(0);
  const [globalPadding, setGlobalPadding] = useState<number>(0);
  const [exportWidth, setExportWidth] = useState<number>(200);
  const [exportHeight, setExportHeight] = useState<number>(200);
  const [isExporting, setIsExporting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [activeDetailIndex, setActiveDetailIndex] = useState<number | null>(null);
  const [syncLabelToFilename, setSyncLabelToFilename] = useState<boolean>(true);
  const [isFontDropdownOpen, setIsFontDropdownOpen] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | File[]) => {
    const newCards: CardData[] = [];
    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const url = Core.BlobRegistry.create(file);
        const img = new Image();
        img.src = url;
        const id = Math.random().toString(36).substr(2, 9);
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '').replace(/\s+/g, '_');
        const card: CardData = {
          id,
          file,
          url,
          text: '',
          fname: nameWithoutExt,
          fontSize: globalFontSize,
          hasLocalFont: false,
          txtSlider: 90,
          imgSlider: globalImgPos,
          padding: null,
          img,
        };
        img.onload = () => {
          setCards((prev) => prev.map(c => c.id === id ? { ...c, img } : c));
        };
        newCards.push(card);
      }
    });
    setCards((prev) => [...newCards, ...prev]);
  };

  const updateCard = (id: string, updates: Partial<CardData>) => {
    setCards((prev) => prev.map((c) => {
      if (c.id === id) {
        const payload = { ...c, ...updates };
        // Sync text updates into filenames nicely if configured
        if (updates.text !== undefined && syncLabelToFilename && updates.text.trim()) {
          payload.fname = Core.Utils.sanitize(updates.text.substring(0, 30)) || c.fname;
        } else if (updates.text !== undefined && !c.fname) {
          payload.fname = Core.Utils.sanitize(updates.text.substring(0, 20)) || 'logo_export';
        }
        return payload;
      }
      return c;
    }));
  };

  const removeCard = (id: string) => {
    setCards((prev) => {
      const card = prev.find((c) => c.id === id);
      if (card) URL.revokeObjectURL(card.url);
      return prev.filter((c) => c.id !== id);
    });
    // Safely exit details modal if deleted card was being viewed
    if (activeDetailIndex !== null) {
      if (cards.length <= 1) {
        setActiveDetailIndex(null);
      } else if (activeDetailIndex >= cards.length - 1) {
        setActiveDetailIndex(cards.length - 2);
      }
    }
  };

  const clearAll = () => {
    setShowConfirm(true);
  };

  const confirmClearAll = () => {
    cards.forEach((c) => URL.revokeObjectURL(c.url));
    setCards([]);
    setActiveDetailIndex(null);
    setShowConfirm(false);
  };

  const exportAll = async () => {
    if (!cards.length) return;
    setIsExporting(true);
    try {
      const zip = new JSZip();
      
      for (let i = 0; i < cards.length; i++) {
        const c = cards[i];
        const canvas = document.createElement('canvas');
        drawCard(c, canvas, globalPadding);
        const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/png'));
        if (blob) {
          const name = Core.Utils.sanitize(c.fname.trim() || `card_${i + 1}`);
          zip.file(`${name}.png`, blob);
        }
      }
      
      const content = await zip.generateAsync({ type: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(content);
      a.download = 'cards.zip';
      a.click();
    } catch (e: any) {
      console.error(e);
      setAlertMessage(`Failed to export images: ${e.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const drawCard = useCallback((c: CardData, canvas: HTMLCanvasElement, padding: number) => {
    if (!c.img.complete) return;
    const tW = exportWidth || 300;
    const tH = exportHeight || 400;
    canvas.width = tW;
    canvas.height = tH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, tW, tH);
    
    const pad = c.padding !== null ? c.padding : padding;
    const aW = tW - pad * 2;
    const aH = tH - pad * 2;
    const scale = Math.min(aW / c.img.naturalWidth, aH / c.img.naturalHeight);
    const rW = c.img.naturalWidth * scale;
    const rH = c.img.naturalHeight * scale;
    const x = (tW - rW) / 2;
    const y = (tH - rH) / 2 + (c.imgSlider / 100) * tH;
    
    ctx.drawImage(c.img, x, y, rW, rH);
    
    if (c.text) {
      ctx.fillStyle = fontColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const fontVal = c.hasLocalFont ? c.fontSize : globalFontSize;
      ctx.font = `${isBold ? '700' : '400'} ${fontVal}px ${fontFamily}`;
      const lines = c.text.split('\n');
      const lh = fontVal * 1.25;
      const yS = (tH * c.txtSlider) / 100 - (lh * lines.length) / 2 + lh / 2;
      lines.forEach((l, i) => ctx.fillText(l, tW / 2, yS + i * lh));
    }
  }, [exportWidth, exportHeight, fontColor, globalFontSize, isBold, fontFamily]);

  // Navigate Detail Carousel Carousel Settings
  const goPrevDetail = () => {
    if (activeDetailIndex !== null && cards.length > 0) {
      setActiveDetailIndex(prev => (prev !== null && prev > 0 ? prev - 1 : cards.length - 1));
    }
  };

  const goNextDetail = () => {
    if (activeDetailIndex !== null && cards.length > 0) {
      setActiveDetailIndex(prev => (prev !== null && prev < cards.length - 1 ? prev + 1 : 0));
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeDetailIndex === null) return;
      if (e.key === 'ArrowLeft') goPrevDetail();
      if (e.key === 'ArrowRight') goNextDetail();
      if (e.key === 'Escape') setActiveDetailIndex(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeDetailIndex, cards.length]);

  return (
    <div className="flex flex-col relative w-full h-full max-w-[1920px] mx-auto px-1">
      <ConfirmModal
        isOpen={showConfirm}
        title="Reset All"
        message="Are you sure you want to remove all logo designs and configurations? This will clear your entire list."
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

      <LoadingOverlay isVisible={isExporting} message="Generating high-fidelity ZIP archive..." />

      {/* Global Title */}
      <div className="flex items-center gap-4 mb-[32px] pb-[24px] border-b border-border-subtle">
        <div className="w-[44px] h-[44px] bg-bg-panel border border-border-color rounded-[8px] flex items-center justify-center">
          <ImageIcon strokeWidth={1.5} className="w-[20px] h-[20px] text-text-main" />
        </div>
        <div>
          <h2 className="m-0 text-[24px] md:text-[28px] font-medium flex-1 leading-none text-text-main tracking-tight">
            <SpecialText speed={25}>Logo Resizer Workspace</SpecialText>
          </h2>
          <p className="text-[12px] text-text-muted font-sans uppercase tracking-widest mt-1">Batch Sizing, Labelling, and Aligning Suite</p>
        </div>
      </div>

      {/* Layout: Workspace Grid. Spans entire screen optimally. */}
      <div className="grid grid-cols-1 xl:grid-cols-[384px_1fr] gap-8 items-start w-full">
        
        {/* Left Side: Parameters Form Column */}
        <motion.div 
          variants={containerVariants} 
          initial="hidden" 
          animate="show" 
          className="flex flex-col gap-6 sticky top-6 max-h-[calc(100vh-140px)] overflow-y-auto pr-2 xl:border-r xl:border-border-subtle"
        >
          {/* File Upload Drop Zone */}
          <motion.div variants={itemVariants}
            className="border border-dashed border-border-color bg-bg-input text-center p-[40px] rounded-[8px] cursor-pointer transition-all duration-300 hover:border-border-strong hover:bg-bg-input ring-1 ring-transparent hover:ring-border-color"
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-border-strong'); }}
            onDragLeave={(e) => e.currentTarget.classList.remove('border-border-strong')}
            onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove('border-border-strong'); handleFiles(e.dataTransfer.files); }}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="flex flex-col items-center justify-center gap-[14px]">
              <input accept="image/*" hidden multiple type="file" ref={fileInputRef} onChange={(e) => { if (e.target.files) handleFiles(e.target.files); }} />
              <div className="w-11 h-11 rounded-full bg-bg-hover border border-border-strong flex items-center justify-center text-text-muted hover:text-text-main transition-colors duration-200">
                <Upload className="w-5 h-5 text-text-muted" /> 
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-sans text-[11px] uppercase tracking-widest text-text-main font-bold">Import Source Logos</span>
                <span className="text-sm font-sans text-text-subtle">PNG, JPG, SVG, WebP supported</span>
              </div>
            </div>
          </motion.div>
          
           {/* Typography Panel */}
          <motion.div variants={itemVariants} className="bg-bg-panel border border-border-color rounded-[8px] p-5 flex flex-col gap-4">
            <span className="text-[12px] font-sans font-medium text-text-subtle uppercase tracking-wider block border-b border-border-subtle pb-[8px]">Text Style & Family</span>
            
            <div className="flex flex-col gap-2 relative">
              <span className="text-[13px] font-sans text-text-subtle tracking-wider block">Global Font Family</span>
              <div className="relative">
                <button 
                  type="button" 
                  onClick={() => setIsFontDropdownOpen(!isFontDropdownOpen)}
                  className="bg-bg-main  border border-border-color hover:border-border-strong text-text-main font-sans text-[12px] uppercase tracking-wider rounded-[4px] px-[16px] h-[48px] w-full flex items-center justify-between transition-all cursor-pointer text-left focus:ring-1 focus:ring-[#333]"
                >
                  <span>{FONTS_LIST.find(f => f.value === fontFamily)?.label || fontFamily}</span>
                  <Settings className="w-4 h-4 text-text-muted" />
                </button>
                
                {isFontDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsFontDropdownOpen(false)} />
                    <div className="absolute left-0 right-0 mt-[4px] bg-bg-main  border border-border-color rounded-[4px] shadow-[0_12px_45px_rgba(0,0,0,0.95)] max-h-[220px] overflow-y-auto z-50 py-[4px] scrollbar-thin scrollbar-thumb-zinc-800">
                      {FONTS_LIST.map((f) => (
                        <button
                          key={f.value}
                          type="button"
                          onClick={() => {
                            setFontFamily(f.value);
                            setIsFontDropdownOpen(false);
                          }}
                          className={`w-full text-left font-sans text-[11px] uppercase tracking-wider px-[16px] py-[10px] transition-colors hover:bg-bg-hover hover:text-text-main block ${fontFamily === f.value ? 'bg-bg-input text-text-main font-bold border-l-2 border-text-main' : 'text-text-muted'}`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <label className="flex flex-col gap-2">
                <span className="text-[13px] font-sans text-text-subtle tracking-wider block">Default Size</span>
                <SpecialInput type="number" placeholder="Font size" value={globalFontSize} onChange={(e) => setGlobalFontSize(parseInt(e.target.value) || 28)} className="h-[44px]" />
              </label>

              {/* Bespoke Color Picker without open-box native artifacts */}
              <div className="flex flex-col gap-2">
                <span className="text-[13px] font-sans text-text-subtle tracking-wider block">Font Color</span>
                <label className="flex items-center gap-[10px] cursor-pointer bg-bg-main  border border-border-color hover:border-border-strong transition-colors rounded-[4px] px-[12px] h-[44px] w-full">
                  <div className="w-[20px] h-[20px] rounded-[4px] border border-border-strong relative transition-transform hover:scale-110 shrink-0" style={{ backgroundColor: fontColor }}>
                    <input className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" type="color" value={fontColor} onChange={(e) => setFontColor(e.target.value)} />
                  </div>
                  <span className="font-sans text-[12px] text-[#D4D4D4] uppercase tracking-tight flex-1 select-none truncate">{fontColor}</span>
                </label>
              </div>
            </div>

            <div className="flex flex-col gap-[10px] border-t border-border-subtle pt-[12px] mt-1">
              <label className="flex gap-[10px] text-[11px] font-sans uppercase tracking-widest items-center cursor-pointer text-text-muted hover:text-text-main transition-colors select-none">
                <input type="checkbox" className="w-[14px] h-[14px] accent-text-main bg-bg-main border-border-color rounded cursor-pointer shrink-0" checked={isBold} onChange={(e) => setIsBold(e.target.checked)} /> Bold Weight
              </label>
              <label className="flex gap-[10px] text-[11px] font-sans uppercase tracking-widest items-center cursor-pointer text-text-muted hover:text-text-main transition-colors select-none">
                <input type="checkbox" className="w-[14px] h-[14px] accent-text-main bg-bg-main border-border-color rounded cursor-pointer shrink-0" checked={syncLabelToFilename} onChange={(e) => setSyncLabelToFilename(e.target.checked)} /> Auto Sync Labelling to fname
              </label>
            </div>
          </motion.div>
          
          {/* Spatial Sizing adjustments */}
          <motion.div variants={itemVariants} className="bg-bg-panel border border-border-color rounded-[8px] p-5 flex flex-col gap-4">
            <span className="text-[12px] font-sans font-medium text-text-subtle uppercase tracking-wider block border-b border-border-subtle pb-[8px]">Global Geometry Layout</span>
            
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="text-[13px] font-sans text-text-subtle tracking-wider">Image Padding</span>
                <span className="font-sans text-[11px] text-text-main opacity-80">{globalPadding}px</span>
              </div>
              <input className="w-full accent-text-main h-[2px] bg-bg-input appearance-none rounded-[2px]" max="150" min="0" type="range" value={globalPadding} onChange={(e) => setGlobalPadding(parseInt(e.target.value))} />
            </div>
            
            <div className="flex flex-col gap-3 mt-1">
              <div className="flex justify-between items-center">
                <span className="text-[13px] font-sans text-text-subtle tracking-wider">Vertical Adjust Offset</span>
                <span className="font-sans text-[11px] text-text-main opacity-80">{globalImgPos}%</span>
              </div>
              <input className="w-full accent-text-main h-[2px] bg-bg-input appearance-none rounded-[2px]" max="50" min="-50" type="range" value={globalImgPos} onChange={(e) => {
                const val = parseInt(e.target.value);
                setGlobalImgPos(val);
                setCards(prev => prev.map(c => ({ ...c, imgSlider: val })));
              }} />
            </div>
          </motion.div>
          
          {/* Target canvas sizes */}
          <motion.div variants={itemVariants} className="bg-bg-panel border border-border-color rounded-[8px] p-5 flex flex-col gap-4">
            <span className="text-[12px] font-sans font-medium text-text-subtle uppercase tracking-wider block border-b border-border-subtle pb-[8px]">Export Dimensions</span>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex flex-col gap-2">
                <span className="text-[13px] font-sans text-text-subtle tracking-wider block">Width (px)</span>
                <SpecialInput type="number" placeholder="W" value={exportWidth} onChange={(e) => setExportWidth(parseInt(e.target.value) || 200)} className="h-[44px]" />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-[13px] font-sans text-text-subtle tracking-wider block">Height (px)</span>
                <SpecialInput type="number" placeholder="H" value={exportHeight} onChange={(e) => setExportHeight(parseInt(e.target.value) || 200)} className="h-[44px]" />
              </label>
            </div>
            <div className="flex flex-col gap-3 mt-[12px]">
              <motion.button className="bg-text-main text-bg-main cursor-pointer h-[44px] rounded-[4px] font-sans text-[12px] uppercase tracking-widest font-bold w-full transition-all hover:bg-text-muted disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2" onClick={exportAll} disabled={cards.length === 0} whileTap={{ scale: 0.98 }}>
                <Download className="w-4 h-4" /> Download Batch Zip
              </motion.button>
              <motion.button className="bg-transparent border border-[#1F1F1F] cursor-pointer text-[#EF4444] h-[44px] rounded-[4px] font-sans text-[12px] uppercase tracking-widest font-bold w-full transition-all hover:bg-[rgba(239,68,68,0.06)] hover:border-[rgba(239,68,68,0.25)] disabled:opacity-30 disabled:cursor-not-allowed" onClick={clearAll} disabled={cards.length === 0} whileTap={{ scale: 0.98 }}>
                Clear Workspace
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
        
        {/* Right Side: Logos Grid Column */}
        <div className="flex-1 min-w-0 w-full">
          <AnimatePresence mode="wait">
            {!cards.length ? (
              <motion.div 
                key="empty-logos"
                variants={itemVariants}
                initial="hidden"
                animate="show"
                exit="hidden"
                className="border border-dashed border-border-color bg-bg-input rounded-[8px] flex flex-col items-center justify-center p-12 gap-5 text-center min-h-[350px] w-full"
              >
                <div className="w-[48px] h-[48px] rounded-full border border-border-subtle bg-bg-panel flex items-center justify-center mb-1 shrink-0">
                  <ImageIcon className="w-[20px] h-[20px] text-text-muted" />
                </div>
                <div className="flex flex-col gap-2 w-full max-w-sm text-center px-4 justify-center items-center">
                  <p className="font-sans text-[13px] uppercase tracking-widest text-text-main font-bold">Workspace is empty</p>
                  
                </div>
              </motion.div>
            ) : (
              <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(260px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(270px,1fr))] lg:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6 content-start w-full">
                {cards.map((card, index) => (
                  <motion.div 
                    variants={itemVariants} 
                    key={card.id}
                    layout="position"
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.25 }}
                  >
                    <LogoCard 
                      card={card} 
                      index={index}
                      updateCard={updateCard} 
                      removeCard={removeCard} 
                      drawCard={drawCard} 
                      exportWidth={exportWidth} 
                      exportHeight={exportHeight} 
                      globalFontSize={globalFontSize} 
                      isBold={isBold} 
                      fontColor={fontColor} 
                      globalPadding={globalPadding} 
                      fontFamily={fontFamily}
                      onOpenDetail={() => setActiveDetailIndex(index)}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── HIGH FIDELITY FOCUS MODE: CAROUSEL DETAIL OVERLAY MODAL ── */}
      <AnimatePresence>
        {activeDetailIndex !== null && cards[activeDetailIndex] && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-bg-main /98 backdrop-blur-md z-[1000] flex flex-col md:flex-row"
          >
            {/* Modal Left Side: Large interactive preview workspace */}
            <div className="flex-1 flex flex-col justify-between p-6 relative h-[60vh] md:h-full">
              {/* Overlay Top Bar Controls */}
              <div className="flex items-center justify-between w-full z-10">
                <div className="flex items-center gap-3">
                  <span className="font-sans text-xs tracking-widest text-text-muted bg-bg-panel border border-border-color px-[10px] py-[4px] rounded-full font-bold uppercase">
                    Logo {activeDetailIndex + 1} of {cards.length}
                  </span>
                  <span className="hidden sm:inline font-sans text-[11px] text-text-subtle tracking-wide truncate max-w-xs uppercase">
                    Raw File: {cards[activeDetailIndex].file.name}
                  </span>
                </div>
                
                <div className="flex items-center gap-3">
                  <motion.button 
                    onClick={() => {
                      const c = cards[activeDetailIndex];
                      const canvas = document.createElement('canvas');
                      drawCard(c, canvas, globalPadding);
                      canvas.toBlob((blob) => {
                        if (blob) {
                          const a = document.createElement('a');
                          a.href = URL.createObjectURL(blob);
                          a.download = `${c.fname || 'logo_frame'}.png`;
                          a.click();
                        }
                      }, 'image/png');
                    }}
                    className="h-[36px] px-4 cursor-pointer bg-text-main hover:bg-bg-input text-bg-main font-sans text-[11px] font-bold uppercase tracking-widest rounded transition-all duration-150 flex items-center gap-2 shadow-lg hover:text-text-main"
                    whileTap={{ scale: 0.95 }}
                  >
                    <Download className="w-3.5 h-3.5" /> Save PNG
                  </motion.button>

                  <motion.button 
                    onClick={() => setActiveDetailIndex(null)}
                    className="w-[36px] h-[36px] flex items-center justify-center cursor-pointer rounded bg-bg-panel border border-border-color hover:bg-[#1C1C1C] text-text-muted hover:text-text-main transition-all"
                    whileTap={{ scale: 0.95 }}
                    title="Close detail mode"
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>

              {/* Central Interactive Preview Screen with Chequered Transparency Grid */}
              <div className="flex-1 flex items-center justify-center p-4 relative">
                {/* Previous Card On-screen Navigation Button */}
                <motion.button 
                  onClick={goPrevDetail}
                  className="absolute left-[8px] md:left-[24px] z-10 w-[44px] h-[44px] rounded-full bg-bg-panel/80 border border-border-color hover:bg-bg-main hover:border-text-main text-text-main flex items-center justify-center cursor-pointer transition-all duration-200"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.93 }}
                >
                  <ChevronLeft className="w-5 h-5" />
                </motion.button>

                {/* Main Large Canvas Frame */}
                <div 
                  className="p-8 rounded-lg border border-border-color shadow-[0_0_80px_rgba(0,0,0,0.8)] relative max-w-full max-h-[75%] flex items-center justify-center bg-checkered absolute inset-0 z-0 opacity-50"
                  
                >
                  <div style={{ aspectRatio: `${exportWidth}/${exportHeight}`, width: '100%', maxWidth: '440px', maxHeight: '440px', display: 'flex', justifyContent: 'center' }}>
                    <CanvasRenderer card={cards[activeDetailIndex]} drawCard={drawCard} globalPadding={globalPadding} />
                  </div>
                </div>

                {/* Next Card On-screen Navigation Button */}
                <motion.button 
                  onClick={goNextDetail}
                  className="absolute right-[8px] md:right-[24px] z-10 w-[44px] h-[44px] rounded-full bg-bg-panel/80 border border-border-color hover:bg-bg-main hover:border-text-main text-text-main flex items-center justify-center cursor-pointer transition-all duration-200"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.93 }}
                >
                  <ChevronRight className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Bottom Instructions hint */}
              <div className="flex justify-center w-full pb-2">
                <span className="text-[11px] font-sans text-text-subtle uppercase tracking-widest text-center select-none">
                  Press Arrow Keys on your Keyboard (← / →) to navigate • Esc to Return
                </span>
              </div>
            </div>

            {/* Modal Right Side: Focus controls drawer panel */}
            <div className="w-full md:w-[384px] bg-bg-input border-t md:border-t-0 md:border-l border-border-color p-6 flex flex-col gap-6 overflow-y-auto h-[40vh] md:h-full z-10">
              <div className="border-b border-border-subtle pb-[16px]">
                <h4 className="font-sans text-[12px] text-text-muted font-bold uppercase tracking-widest leading-none">Focused Edit Pane</h4>
                <p className="text-xs text-text-subtle font-sans uppercase mt-1">Fine-Tune Alignment & Labels</p>
              </div>

              {/* File details input fields */}
              <label className="flex flex-col gap-2">
                <span className="text-[13px] font-sans text-text-subtle tracking-wider block">Custom Export Filename</span>
                <SpecialInput 
                  placeholder="Enter custom export file label" 
                  value={cards[activeDetailIndex].fname} 
                  onChange={(e) => updateCard(cards[activeDetailIndex].id, { fname: Core.Utils.sanitize(e.target.value) })}
                  className="h-[44px]"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-[13px] font-sans text-text-subtle tracking-wider block">Label Text content</span>
                <SpecialTextarea 
                  rows={3} 
                  placeholder="Add custom overlay text to overlay on the card canvas" 
                  value={cards[activeDetailIndex].text} 
                  onChange={(e) => updateCard(cards[activeDetailIndex].id, { text: e.target.value })}
                />
              </label>

              {/* Font settings customized inside modal */}
              <div className="bg-bg-panel p-4 rounded-[6px] border border-border-color flex flex-col gap-4">
                <span className="font-sans text-xs text-text-subtle uppercase tracking-widest font-bold">Local Specific Typos</span>
                
                <div className="flex gap-4 items-center">
                  <label className="flex gap-[10px] text-[11px] font-sans uppercase tracking-wider items-center cursor-pointer text-text-muted hover:text-text-main transition-colors select-none flex-1">
                    <input 
                      type="checkbox" 
                      className="w-[14px] h-[14px] accent-text-main" 
                      checked={cards[activeDetailIndex].hasLocalFont} 
                      onChange={(e) => updateCard(cards[activeDetailIndex].id, { hasLocalFont: e.target.checked })} 
                    /> Override size
                  </label>
                  
                  <div className="w-[84px]">
                    <input 
                      type="number" 
                      placeholder={globalFontSize.toString()} 
                      value={cards[activeDetailIndex].hasLocalFont ? cards[activeDetailIndex].fontSize : globalFontSize} 
                      disabled={!cards[activeDetailIndex].hasLocalFont}
                      onChange={(e) => {
                        if (cards[activeDetailIndex].hasLocalFont) {
                          updateCard(cards[activeDetailIndex].id, { fontSize: Math.max(8, Math.min(200, parseInt(e.target.value) || 28)) });
                        }
                      }} 
                      className={`bg-bg-main  border font-sans text-center text-[12px] h-[36px] w-full rounded focus:outline-none transition-colors ${
                        cards[activeDetailIndex].hasLocalFont
                          ? "border-[#444444] text-text-main"
                          : "border-border-color text-text-subtle opacity-50 cursor-not-allowed"
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Vertical / Horizontal sliders for geometry */}
              <div className="flex flex-col gap-[18px]">
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[13px] font-sans text-text-subtle tracking-wider">Placement Padding</span>
                    <span className="font-sans text-[11px] text-text-muted">
                      {cards[activeDetailIndex].padding !== null ? `${cards[activeDetailIndex].padding}px` : `Default (${globalPadding}px)`}
                    </span>
                  </div>
                  <div className="flex gap-2 items-center">
                    <input 
                      type="range" 
                      className="flex-1 accent-text-main h-[2px] bg-border-subtle appearance-none rounded-[2px]" 
                      min="0" 
                      max="150" 
                      value={cards[activeDetailIndex].padding !== null ? cards[activeDetailIndex].padding : globalPadding} 
                      onChange={(e) => updateCard(cards[activeDetailIndex].id, { padding: parseInt(e.target.value) })} 
                    />
                    {cards[activeDetailIndex].padding !== null && (
                      <button 
                        onClick={() => updateCard(cards[activeDetailIndex].id, { padding: null })}
                        className="text-xs font-sans text-[#EF4444] hover:underline uppercase shrink-0"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[13px] font-sans text-text-subtle tracking-wider">Image Height Offset (Y)</span>
                    <span className="font-sans text-[11px] text-text-muted">{cards[activeDetailIndex].imgSlider}%</span>
                  </div>
                  <input 
                    type="range" 
                    className="w-full accent-text-main h-[2px] bg-border-subtle appearance-none rounded-[2px]" 
                    min="-50" 
                    max="50" 
                    value={cards[activeDetailIndex].imgSlider} 
                    onChange={(e) => updateCard(cards[activeDetailIndex].id, { imgSlider: parseInt(e.target.value) })} 
                  />
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[13px] font-sans text-text-subtle tracking-wider">Label Height Offset (Y)</span>
                    <span className="font-sans text-[11px] text-text-muted">{cards[activeDetailIndex].txtSlider}%</span>
                  </div>
                  <input 
                    type="range" 
                    className="w-full accent-text-main h-[2px] bg-border-subtle appearance-none rounded-[2px]" 
                    min="0" 
                    max="100" 
                    value={cards[activeDetailIndex].txtSlider} 
                    onChange={(e) => updateCard(cards[activeDetailIndex].id, { txtSlider: parseInt(e.target.value) })} 
                  />
                </div>
              </div>

              {/* Actions footer block */}
              <div className="flex flex-col gap-3 border-t border-border-subtle pt-[20px] mt-auto">
                <motion.button 
                  onClick={() => removeCard(cards[activeDetailIndex].id)}
                  className="h-[44px] cursor-pointer bg-transparent border border-[#EF4444]/20 text-[#EF4444] rounded font-sans text-[11px] uppercase tracking-widest font-bold w-full transition-all hover:bg-[#EF4444]/10 hover:border-[#EF4444]/40 flex items-center justify-center gap-2"
                  whileTap={{ scale: 0.96 }}
                >
                  <Trash2 className="w-4 h-4" /> Delete this Logo
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const useAnimatedCanvasText = (text: string, speed: number = 30) => {
  const [displayText, setDisplayText] = React.useState('');
  const prevTextRef = React.useRef('');
  const iterationRef = React.useRef(0);
  
  React.useEffect(() => {
    if (!text) {
      setDisplayText('');
      prevTextRef.current = '';
      return;
    }

    const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$*&%';
    let overlap = 0;
    while (overlap < text.length && overlap < prevTextRef.current.length && text[overlap] === prevTextRef.current[overlap]) {
      overlap++;
    }
    
    iterationRef.current = overlap;
    prevTextRef.current = text;
    setDisplayText((prev) => text.substring(0, Math.min(overlap, prev.length)));

    let currentIteration = overlap;
    const interval = setInterval(() => {
      setDisplayText((prev) => {
        let done = true;
        const nextText = text
          .split('')
          .map((char, index) => {
            if (index < currentIteration) {
              return text[index];
            }
            done = false;
            if (char === ' ' || char === '\n') return char;
            return CHARS[Math.floor(Math.random() * CHARS.length)];
          })
          .join('');
        
        if (done && currentIteration >= text.length) {
          clearInterval(interval);
        }
        return nextText;
      });

      currentIteration += 1 / 2;
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return displayText;
};

// Canvas Dynamic Renderer Component
function CanvasRenderer({ card, drawCard, globalPadding }: { card: CardData, drawCard: any, globalPadding: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animatedText = useAnimatedCanvasText(card.text, 20);

  useEffect(() => {
    if (canvasRef.current && card.img.complete) {
      drawCard({ ...card, text: animatedText }, canvasRef.current, globalPadding);
    }
  }, [card, animatedText, globalPadding, drawCard]);

  return <canvas ref={canvasRef} className="max-w-full max-h-full object-contain shadow-2xl" />;
}

// LogoCard standard lists display logic
const LogoCard = React.memo(function LogoCard({ 
  card, 
  index, 
  updateCard, 
  removeCard, 
  drawCard, 
  exportWidth, 
  exportHeight, 
  globalFontSize, 
  isBold, 
  fontColor, 
  globalPadding, 
  fontFamily,
  onOpenDetail
}: any) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animatedText = useAnimatedCanvasText(card.text, 20);

  useEffect(() => {
    if (canvasRef.current) {
      drawCard({ ...card, text: animatedText }, canvasRef.current, globalPadding);
    }
  }, [card, animatedText, exportWidth, exportHeight, globalFontSize, isBold, fontColor, globalPadding, fontFamily, drawCard]);

  const downloadSingle = async () => {
    if (!canvasRef.current) return;
    const blob = await new Promise<Blob | null>((r) => canvasRef.current!.toBlob(r, 'image/png'));
    if (blob) {
      const name = Core.Utils.sanitize(card.fname.trim() || 'card');
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${name}.png`;
      a.click();
    }
  };

  return (
    <div 
      className="bg-bg-panel border border-border-color flex flex-col rounded-[8px] overflow-hidden transition-all duration-300 hover:border-[#2C2C2C] hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)] group relative"
    >
      {/* ── TOP HEADER row: filename and circular trash delete bin ── */}
      <div className="flex items-center justify-between p-[12px] bg-bg-panel border-b border-border-color select-none shrink-0 min-h-[44px]">
        <div className="flex items-center gap-[6px] flex-1 min-w-0">
          <span className="font-sans text-[11px] text-text-muted font-medium leading-none truncate max-w-[150px] uppercase block" title={card.fname}>
            {card.fname || 'Untitled'}
          </span>
        </div>
        
        <div className="flex items-center gap-[6px] shrink-0">
          <motion.button 
            className="w-[28px] h-[28px] flex items-center justify-center cursor-pointer rounded-full bg-bg-hover hover:bg-[#EF4444]/10 border border-border-color hover:border-[#EF4444]/30 text-[#71717A] hover:text-[#EF4444] transition-all" 
            onClick={() => removeCard(card.id)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Remove from Workspace"
          >
            <Trash2 className="w-[12px] h-[12px]" />
          </motion.button>
        </div>
      </div>

      {/* ── LOGO PREVIEW: Clickable grid and overlay feedback ── */}
      <div 
        onClick={onOpenDetail}
        className="bg-bg-main  flex items-center justify-center p-5 relative border-b border-border-subtle cursor-pointer group/preview bg-checkered absolute inset-0 z-0 opacity-50" 
        
      >
        {/* Hover maximize display indicator overlay */}
        <div className="absolute inset-0 bg-bg-main/60 opacity-0 group-hover/preview:opacity-100 flex items-center justify-center transition-all duration-200 z-10 backdrop-blur-[1px]">
          <div className="flex items-center gap-2 bg-bg-panel border border-border-color rounded px-[12px] py-[6px] shadow-2xl">
            <Maximize2 className="w-3.5 h-3.5 text-text-main" />
            <span className="font-sans text-xs text-text-main uppercase tracking-widest font-bold">Open Alignment Suite</span>
          </div>
        </div>

        <div style={{ aspectRatio: `${exportWidth}/${exportHeight}`, width: '100%', maxHeight: '200px', display: 'flex', justifyContent: 'center' }}>
          {card.img.complete ? (
            <canvas ref={canvasRef} className="max-w-full max-h-full object-contain shadow-2xl transition-transform duration-300 group-hover/preview:scale-[1.02]" />
          ) : (
            <div className="w-full h-full flex justify-center items-center font-sans text-xs text-text-subtle uppercase tracking-widest animate-pulse">Loading Source Canvas...</div>
          )}
        </div>
      </div>

      {/* ── CARD FOOTER row: label input, local Font override and download icon ── */}
      <div className="p-4 flex flex-col gap-3 bg-bg-panel">
        {/* Label block input */}
        <div className="flex flex-col gap-[6px]">
          <span className="text-[13px] font-sans text-text-subtle block font-bold">Edit Overlay Label</span>
          <textarea 
            rows={1}
            placeholder="Type design text label..." 
            value={card.text} 
            onChange={(e) => updateCard(card.id, { text: e.target.value })} 
            className="bg-bg-main  border border-border-color text-text-main font-sans text-xs rounded p-2 focus:border-[#2F2F2F] w-full resize-none h-[34px] leading-snug transition-colors placeholder:text-text-subtle"
          />
        </div>

        <div className="flex items-center justify-between gap-3 mt-1">
          {/* Font Local Override */}
          <div className="flex items-center gap-2 flex-1">
            <span className="text-[13px] font-sans text-text-subtle font-bold">Local size:</span>
            <input 
              type="checkbox" 
              className="w-[12px] h-[12px] accent-text-main cursor-pointer rounded bg-bg-main border-border-color" 
              checked={card.hasLocalFont} 
              onChange={(e) => updateCard(card.id, { hasLocalFont: e.target.checked })} 
            />
            <input 
              type="number" 
              placeholder={globalFontSize.toString()} 
              value={card.hasLocalFont ? card.fontSize : globalFontSize} 
              disabled={!card.hasLocalFont}
              onChange={(e) => {
                if (card.hasLocalFont) {
                  updateCard(card.id, { fontSize: Math.max(8, Math.min(200, parseInt(e.target.value) || 28)) });
                }
              }} 
              className={`bg-bg-main  border font-sans text-[11px] rounded h-[26px] w-[54px] text-center focus:outline-none transition-colors ${
                card.hasLocalFont 
                  ? "border-[#444444] text-text-main" 
                  : "border-border-color text-text-subtle opacity-50 cursor-not-allowed"
              }`}
            />
          </div>

          {/* Download button - styled/sized matching top actions */}
          <motion.button 
            className="w-[28px] h-[28px] flex items-center justify-center cursor-pointer rounded-full bg-bg-hover hover:bg-text-main border border-border-color hover:border-text-main text-text-muted hover:text-bg-main transition-all" 
            onClick={downloadSingle}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Download PNG File"
          >
            <Download className="w-[12px] h-[12px]" />
          </motion.button>
        </div>
      </div>
    </div>
  );
});
