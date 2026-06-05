import { nextFrame } from '../utils/frame';
import { motion, AnimatePresence } from 'framer-motion';
import React, { useState, useRef, useEffect } from 'react';
import { Film, Upload, Download, Trash2, X, Play, Loader } from 'lucide-react';
import { Core } from '../utils/core';
import JSZip from 'jszip';
import LoadingOverlay from './LoadingOverlay';
import ConfirmModal from './ConfirmModal';
import SpecialText from './SpecialText';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.05 } }
} as const;

const itemVariants = {
  hidden: { opacity: 0, scale: 0.98, y: 12 },
  show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 350, damping: 28 } }
} as const;

export interface StillFrame {
  num: number;
  blob: Blob;
  url: string;
  checked: boolean;
}

interface VideoData {
  id: string;
  name: string;
  frames: StillFrame[];
  thumbnail?: string;
  status: string;
  progressPercent?: number;
}

export interface VideoStillsProps {
  onCreateStoryboard?: (name: string, selectedFrames: StillFrame[]) => void;
}

export default function VideoStills({ onCreateStoryboard }: VideoStillsProps) {
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [queue, setQueue] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | File[]) => {
    const valid = Array.from(files).filter((f) => f.type.startsWith('video/'));
    if (!valid.length) return;
    setQueue((prev) => [...prev, ...valid]);
  };

  const removeVideo = (id: string) => {
    setVideos((prev) => {
      const target = prev.find((v) => v.id === id);
      if (target) {
        target.frames.forEach((f) => URL.revokeObjectURL(f.url));
      }
      return prev.filter((v) => v.id !== id);
    });
  };

  const downloadSinglePack = async (vidData: VideoData) => {
    if (!vidData.frames?.length) return;
    setIsDownloading(true);
    try {
      const zip = new JSZip();
      vidData.frames.forEach((f) => {
        zip.file(`${vidData.name}_still_${f.num}.jpg`, f.blob);
      });
      const content = await zip.generateAsync({ type: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(content);
      a.download = `${vidData.name}_stills_pack.zip`;
      a.click();
    } catch (e: any) {
      console.error(e);
      setAlertMessage(`Failed to export stills zip: ${e.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const process = async () => {
    if (!queue.length) return;
    setIsProcessing(true);

    for (let i = 0; i < queue.length; i++) {
      const file = queue[i];
      try {
        const name = file.name.replace(/\.[^/.]+$/, '').replace(/\s+/g, '_');
        const vid = document.createElement('video');
        vid.src = Core.BlobRegistry.create(file);
        vid.muted = true;
        vid.playsInline = true;
        
        await new Promise((r) => { 
          vid.onloadedmetadata = r; 
          vid.onerror = r; 
        });
        
        const id = `vid-${Date.now()}`;
        vid.currentTime = 0.5;
        await new Promise((r) => { vid.onseeked = r; });
        
        // Render initial thumbnail canvas
        const cv = document.createElement('canvas');
        cv.width = 400;
        cv.height = 400 * (vid.videoHeight / vid.videoWidth);
        const cvCtx = cv.getContext('2d')!;
        cvCtx.drawImage(vid, 0, 0, cv.width, cv.height);
        const thumbnail = cv.toDataURL('image/jpeg', 0.85);
        
        // Insert initial placeholder with 'Readying' status
        setVideos((prev) => [...prev, { id, name, frames: [], thumbnail, status: 'Initializing...', progressPercent: 0 }]);
        
        const totalDuration = vid.duration;
        // 1 frame per second
        const frames = Math.max(1, Math.floor(totalDuration));
        const extractedFrames: StillFrame[] = [];
        
        // Exclude first and last 5% of duration to bypass fade ins, credits or black video glitches
        const startOffset = totalDuration * 0.05;
        const endOffset = totalDuration * 0.95;
        const availableDuration = endOffset - startOffset;
        
        for (let f = 1; f <= frames; f++) {
          await nextFrame();
          
          let seekPoint = 0.5;
          if (frames > 1) {
            seekPoint = startOffset + ((f - 1) * availableDuration) / (frames - 1);
          } else {
            seekPoint = startOffset + availableDuration / 2;
          }
          
          vid.currentTime = Math.max(0.1, Math.min(seekPoint, totalDuration - 0.1));
          await new Promise((r) => { vid.onseeked = r; });
          
          // Allow hardware rendering engines to completely decode and paint unblurred raw pixels
          await new Promise((r) => setTimeout(r, 220));
          
          const c = document.createElement('canvas');
          c.width = vid.videoWidth;
          c.height = vid.videoHeight;
          c.getContext('2d')!.drawImage(vid, 0, 0);
          
          const blob = await new Promise<Blob>((r) => c.toBlob(r as BlobCallback, 'image/jpeg', 0.92));
          extractedFrames.push({ 
            num: f, 
            blob, 
            url: Core.BlobRegistry.create(blob), 
            checked: true 
          });
          
          // Update status directly below the matching album card
          const percentage = Math.round((f / frames) * 100);
          setVideos((prev) => prev.map((v) => 
            v.id === id 
              ? { 
                  ...v, 
                  status: `Extracting Frame ${f} of ${frames}...`, 
                  progressPercent: percentage 
                } 
              : v
          ));
        }
        
        setVideos((prev) => prev.map((v) => 
          v.id === id 
            ? { 
                ...v, 
                frames: extractedFrames, 
                status: `${frames} frames successfully compiled`, 
                progressPercent: 100 
              } 
            : v
        ));
      } catch (e: any) {
        console.error(e);
        setAlertMessage(`Failed to process ${file.name}: ${e.message}`);
      }
    }
    
    setQueue([]);
    setIsProcessing(false);
  };

  const clearAll = () => {
    setShowConfirm(true);
  };

  const confirmClearAll = () => {
    setVideos([]);
    setQueue([]);
    Core.BlobRegistry.revokeAll();
    setShowConfirm(false);
  };

  const toggleAll = (val: boolean) => {
    if (!selectedVideo) return;
    setVideos((prev) => prev.map((v) => {
      if (v.id === selectedVideo) {
        return { ...v, frames: v.frames.map((f) => ({ ...f, checked: val })) };
      }
      return v;
    }));
  };

  const toggleFrame = (num: number, val: boolean) => {
    if (!selectedVideo) return;
    setVideos((prev) => prev.map((v) => {
      if (v.id === selectedVideo) {
        return { ...v, frames: v.frames.map((f) => f.num === num ? { ...f, checked: val } : f) };
      }
      return v;
    }));
  };

  const downloadSelected = async () => {
    if (!selectedVideo) return;
    const data = videos.find((v) => v.id === selectedVideo);
    if (!data) return;
    
    const sel = data.frames.filter((f) => f.checked);
    if (!sel.length) return;
    
    setIsDownloading(true);
    try {
      const zip = new JSZip();
      sel.forEach((f) => zip.file(`${data.name}_still_${f.num}.jpg`, f.blob));
      
      const a = document.createElement('a');
      a.href = URL.createObjectURL(await zip.generateAsync({ type: 'blob' }));
      a.download = `${data.name}_stills_pack.zip`;
      a.click();
    } finally {
      setIsDownloading(false);
    }
  };

  const downloadAll = async () => {
    setIsDownloading(true);
    try {
      const zip = new JSZip();
      videos.forEach((v) => {
        const folder = zip.folder(v.name);
        if (folder) {
          v.frames.forEach((frame) => {
            folder.file(`${v.name}_still_${frame.num}.jpg`, frame.blob);
          });
        }
      });
      
      const a = document.createElement('a');
      a.href = URL.createObjectURL(await zip.generateAsync({ type: 'blob' }));
      a.download = 'multi_video_stills_bundle.zip';
      a.click();
    } finally {
      setIsDownloading(false);
    }
  };

  const activeVideoData = videos.find((v) => v.id === selectedVideo);

  return (
    <div className="flex flex-col relative w-full h-full max-w-[1920px] mx-auto">
      <ConfirmModal
        isOpen={showConfirm}
        title="Reset Video Workspace"
        message="Are you sure you want to remove all loaded videos and extracted frames? This cannot be undone."
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
      
      {/* Download blocking screens */}
      <LoadingOverlay isVisible={isDownloading} message="Compiling images and building high-fidelity zip package..." />
      
      {/* Title */}
      <div className="flex items-center gap-4 mb-[32px] pb-[24px] border-b border-border-subtle">
        <div className="w-[44px] h-[44px] bg-bg-panel border border-border-color rounded-[8px] flex items-center justify-center">
          <Film strokeWidth={1.5} className="w-[20px] h-[20px] text-text-main" />
        </div>
        <div>
          <h2 className="m-0 text-[24px] md:text-[28px] font-medium leading-none text-text-main tracking-tight">
            <SpecialText speed={25}>Video Stills Extractor</SpecialText>
          </h2>
          <p className="text-[12px] text-text-muted font-sans uppercase tracking-widest mt-1">Extract 1 full still per second accurately with zero frames blur</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[384px_1fr] gap-8 items-start">
        
        {/* Left Options Card */}
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex flex-col gap-6 sticky top-6 max-h-[calc(100vh-140px)] overflow-y-auto pr-2 xl:border-r xl:border-border-subtle">
          {/* File input dropper box */}
          <motion.div variants={itemVariants}
            className="border border-dashed border-border-color bg-bg-input text-center p-[40px] rounded-[8px] cursor-pointer transition-all duration-300 hover:border-border-strong hover:bg-bg-input ring-1 ring-transparent hover:ring-[#111]"
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-border-strong'); }}
            onDragLeave={(e) => e.currentTarget.classList.remove('border-border-strong')}
            onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove('border-border-strong'); handleFiles(e.dataTransfer.files); }}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="flex flex-col items-center justify-center gap-[14px]">
              <input accept="video/*" hidden multiple type="file" ref={fileInputRef} onChange={(e) => { if (e.target.files) handleFiles(e.target.files); }} />
              <div className="w-11 h-11 rounded-full bg-bg-hover border border-border-strong flex items-center justify-center text-text-muted hover:text-text-main transition-colors duration-200">
                <Film className="w-5 h-5 text-text-muted" /> 
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-sans text-[11px] uppercase tracking-widest text-text-main font-bold">Import Source Video</span>
                <span className="text-sm font-sans text-text-subtle">MP4, WebM, MOV, OGG formatted</span>
              </div>
            </div>
          </motion.div>

          {/* Action trigger block */}
          <motion.div variants={itemVariants} className="bg-bg-panel border border-border-color rounded-[8px] p-5 flex flex-col gap-4">
            <span className="text-[12px] font-sans font-medium text-text-subtle uppercase tracking-wider block border-b border-border-subtle pb-[8px]">Extractor Options</span>
            
            <div className="flex flex-col gap-3 mt-2 border-t border-border-subtle pt-[14px]">
              <motion.button 
                className="bg-text-main text-bg-main cursor-pointer h-[44px] rounded-[4px] font-sans text-[11px] uppercase tracking-widest font-bold w-full transition-all hover:bg-text-muted disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2" 
                onClick={process} 
                disabled={isProcessing || !queue.length} 
                whileTap={{ scale: 0.98 }}
              >
                {isProcessing ? <Loader className="w-4 h-4 animate-spin text-bg-main" /> : <Play className="w-4 h-4 fill-current text-bg-main" />} 
                {isProcessing ? 'Processing Queue...' : 'Extract Stills'}
              </motion.button>

              <motion.button 
                className="bg-bg-input border border-border-color hover:border-border-strong cursor-pointer text-text-main h-[44px] rounded-[4px] font-sans text-[11px] uppercase tracking-widest font-bold w-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed" 
                onClick={downloadAll} 
                disabled={isDownloading || !videos.some(v => v.frames.length > 0)} 
                whileTap={{ scale: 0.98 }}
              >
                Download All Compiled packs
              </motion.button>

              <motion.button 
                className="bg-transparent border border-[#1F1F1F] cursor-pointer text-[#EF4444] h-[44px] rounded-[4px] font-sans text-[11px] uppercase tracking-widest font-bold w-full transition-all hover:bg-[rgba(239,68,68,0.06)] hover:border-[rgba(239,68,68,0.25)] disabled:opacity-30 disabled:cursor-not-allowed" 
                onClick={clearAll}
                disabled={!videos.length && !queue.length}
                whileTap={{ scale: 0.98 }}
              >
                Clear Workspace
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
        
        {/* Right Album Grid */}
        <div className="flex-1 min-w-0 w-full">
          <AnimatePresence mode="wait">
            {!videos.length && !queue.length ? (
              <motion.div 
                key="empty-workspace"
                variants={itemVariants}
                initial="hidden"
                animate="show"
                exit="hidden"
                className="border border-dashed border-border-color bg-bg-input rounded-[8px] flex flex-col items-center justify-center p-12 gap-5 text-center min-h-[350px] w-full"
              >
                <div className="w-[48px] h-[48px] rounded-full border border-border-subtle bg-bg-panel flex items-center justify-center mb-1 shrink-0">
                  <Film className="w-[18px] h-[18px] text-text-muted" />
                </div>
                <div className="flex flex-col gap-2 w-full max-w-sm text-center px-4 justify-center items-center">
                  <p className="font-sans text-[13px] uppercase tracking-widest text-text-main font-bold">Workspace is empty</p>
                  
                </div>
              </motion.div>
            ) : (
              <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(260px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(270px,1fr))] lg:grid-cols-[repeat(auto-fill,minmax(285px,1fr))] gap-6 content-start w-full">
                {queue.length > 0 && (
                  <motion.div 
                    key="queue-status"
                    variants={itemVariants} 
                    className="col-span-full p-5 bg-bg-input border border-dashed border-border-color rounded-[8px] text-center font-sans text-[12px] text-text-muted uppercase tracking-wider flex items-center justify-center gap-3"
                  >
                    <Loader className="w-4 h-4 animate-spin text-text-main opacity-50" />
                    <span>{queue.length} videos queued. Click &apos;Extract Stills&apos; on the left sidebar folder panel to start.</span>
                  </motion.div>
                )}

                {videos.map((vid) => (
                  <motion.div 
                    variants={itemVariants} 
                    key={vid.id} 
                    className="bg-bg-panel border border-border-color flex flex-col rounded-[8px] overflow-hidden transition-all duration-300 hover:border-[#2a2a2a] relative group hover:shadow-[0_8px_32px_rgba(0,0,0,0.5)]" 
                    layout="position"
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.25 }}
                  >
                    {/* Grid background texture checkboard container */}
                    <div className="bg-bg-main  flex items-center justify-center relative border-b border-border-color overflow-hidden shrink-0 bg-checkered absolute inset-0 z-0 opacity-50" >
                      {vid.thumbnail ? (
                        <img src={vid.thumbnail} className="w-full h-[220px] block object-contain shadow-xl" alt={vid.name} />
                      ) : (
                        <div className="w-full h-[220px] flex justify-center items-center font-sans text-xs text-text-muted uppercase tracking-widest animate-pulse">Readying Canvas...</div>
                      )}

                      {/* Top-right delete control to delete single album */}
                      <button 
                        className="absolute top-[12px] right-[12px] z-20 w-[28px] h-[28px] rounded-full bg-bg-input/95 border border-border-strong hover:bg-[#EF4444]/15 hover:border-[#EF4444]/30 text-text-muted hover:text-[#EF4444] flex items-center justify-center cursor-pointer transition-all duration-200"
                        onClick={(e) => { e.stopPropagation(); removeVideo(vid.id); }}
                        title="Delete Video Album"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Video Item Details Footer with Inline Progress feedback */}
                    <div className="p-5 flex flex-col gap-3 bg-bg-panel">
                      <div className="font-sans text-[13px] text-text-main truncate font-medium uppercase tracking-tight" title={vid.name}>{vid.name}</div>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[13px] font-sans text-text-subtle tracking-wide truncate max-w-[200px]">{vid.status}</span>
                          {vid.progressPercent !== undefined && vid.progressPercent > 0 && vid.progressPercent < 100 && (
                            <span className="font-sans text-[11px] text-text-main font-bold">{vid.progressPercent}%</span>
                          )}
                        </div>

                        {/* Dynamic Inline Progress bar rendering */}
                        {vid.progressPercent !== undefined && vid.progressPercent < 100 && (
                          <div className="w-full h-[2px] bg-border-subtle rounded-full overflow-hidden block">
                            <div className="h-full bg-text-main rounded-full transition-all duration-150" style={{ width: `${vid.progressPercent}%` }} />
                          </div>
                        )}

                        {/* Action direct download when completed */}
                        {vid.frames.length > 0 && (
                          <motion.button 
                            className="mt-2 w-full h-[36px] rounded bg-text-main hover:bg-bg-input text-bg-main font-sans text-[11px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors cursor-pointer border-0 hover:text-text-main"
                            onClick={() => downloadSinglePack(vid)}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Download className="w-3.5 h-3.5" /> Download Stills ZIP
                          </motion.button>
                        )}
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
