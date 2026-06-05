import { nextFrame, delayFrames } from '../utils/frame';
import { motion, AnimatePresence } from 'framer-motion';
import React, { useState, useRef, useEffect } from 'react';
import { Clapperboard, Upload, Download, Trash2, ArrowUp, ArrowDown, X } from 'lucide-react';
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

export interface StoryImage {
  id: string;
  file: File;
  img: HTMLImageElement;
}

export interface StoryProject {
  id: number;
  name: string;
  images: StoryImage[];
  settings: {
    gap: number;
    width: number;
    autoWidth: boolean;
    bgColor: string;
    columns: number | 'auto';
    fitMode: 'cover' | 'contain';
  };
}

export interface StoryboardProps {
  projects: StoryProject[];
  setProjects: React.Dispatch<React.SetStateAction<StoryProject[]>>;
  activeProjectId: number | null;
  setActiveProjectId: (id: number | null) => void;
}

export default function Storyboard({
  projects,
  setProjects,
  activeProjectId,
  setActiveProjectId,
}: StoryboardProps) {
  const [canvasDataUrl, setCanvasDataUrl] = useState<string | null>(null);
  const [canvasSize, setCanvasSize] = useState<{ w: number; h: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [confirmDeleteProject, setConfirmDeleteProject] = useState<number | null>(null);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (projects.length === 0) {
      addNewProject();
    }
  }, [projects.length]);

  const activeProject = projects.find((p) => p.id === activeProjectId);

  const addNewProject = () => {
    const id = Date.now() + Math.random();
    setProjects((prev) => {
      const newProject: StoryProject = {
        id,
        name: `Board_${prev.length + 1}`,
        images: [],
        settings: { gap: 0, width: 1920, autoWidth: true, bgColor: '#000000', columns: 'auto', fitMode: 'cover' },
      };
      return [...prev, newProject];
    });
    setActiveProjectId(id);
  };

  const deleteProject = (id: number) => {
    setConfirmDeleteProject(id);
  };

  const confirmDelete = () => {
    if (confirmDeleteProject === null) return;
    const id = confirmDeleteProject;
    setProjects((prev) => {
      const idx = prev.findIndex((p) => p.id === id);
      const newProjects = prev.filter((p) => p.id !== id);
      if (newProjects.length === 0) {
        nextFrame().then(addNewProject);
      } else if (activeProjectId === id) {
        setActiveProjectId(newProjects[Math.max(0, idx - 1)].id);
      }
      return newProjects;
    });
    setConfirmDeleteProject(null);
  };

  const updateActiveProject = (updates: Partial<StoryProject>) => {
    if (!activeProjectId) return;
    setProjects((prev) => prev.map((p) => p.id === activeProjectId ? { ...p, ...updates } : p));
  };

  const updateSettings = (updates: Partial<StoryProject['settings']>) => {
    if (!activeProject) return;
    updateActiveProject({ settings: { ...activeProject.settings, ...updates } });
  };

  const handleFiles = async (files: FileList | File[]) => {
    if (!activeProject) return;
    const newImages: StoryImage[] = [];

    for (const file of Array.from(files)) {
      let img: HTMLImageElement;
      if (file.type.startsWith('video/')) {
        try {
          img = await getVideoFrame(file);
        } catch (e) {
          continue;
        }
      } else if (file.type.startsWith('image/')) {
        img = new Image();
        img.src = Core.BlobRegistry.create(file);
        await new Promise((res) => { 
          img.onload = res; 
          img.onerror = res;
        });
        if (!img.complete || img.naturalWidth === 0) continue;
      } else {
        continue;
      }
      newImages.push({ id: Math.random().toString(36).substr(2, 9), file, img });
    }

    updateActiveProject({ images: [...activeProject.images, ...newImages] });
  };

  const getVideoFrame = (file: File): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.src = URL.createObjectURL(file);
      video.muted = true;
      video.currentTime = 1.0;
      video.onseeked = () => {
        const c = document.createElement('canvas');
        c.width = video.videoWidth;
        c.height = video.videoHeight;
        c.getContext('2d')!.drawImage(video, 0, 0);
        const img = new Image();
        img.src = c.toDataURL('image/jpeg');
        img.onload = () => resolve(img);
      };
      video.onerror = reject;
    });
  };

  const moveImage = (idx: number, dir: number) => {
    if (!activeProject) return;
    const t = idx + dir;
    if (t < 0 || t >= activeProject.images.length) return;
    const newImages = [...activeProject.images];
    [newImages[idx], newImages[t]] = [newImages[t], newImages[idx]];
    updateActiveProject({ images: newImages });
  };

  const removeImage = (idx: number) => {
    if (!activeProject) return;
    const newImages = [...activeProject.images];
    URL.revokeObjectURL(newImages[idx].img.src);
    newImages.splice(idx, 1);
    updateActiveProject({ images: newImages });
  };

  const clearBoard = () => {
    if (!activeProject) return;
    setShowConfirmClear(true);
  };

  const confirmClearBoard = () => {
    if (!activeProject) return;
    activeProject.images.forEach((i) => URL.revokeObjectURL(i.img.src));
    updateActiveProject({ images: [] });
    setShowConfirmClear(false);
  };

  useEffect(() => {
    draw();
  }, [activeProject?.images, activeProject?.settings]);

  const draw = async () => {
    if (!activeProject || !activeProject.images.length) {
      setCanvasDataUrl(null);
      setCanvasSize(null);
      return;
    }

    setIsProcessing(true);
    // Add a small delay to allow UI to update
    await delayFrames(3);

    try {
      const imgs = activeProject.images;
      if (!imgs[0].img.complete) {
        setIsProcessing(false);
        return;
      }

      const s = activeProject.settings;
      const count = imgs.length;
      let cols, rows;
      if (s.columns !== 'auto') {
        cols = s.columns as number;
        rows = Math.ceil(count / cols);
      } else {
        if (count === 4) { cols = 2; rows = 2; }
        else if (count === 9) { cols = 3; rows = 3; }
        else if (count === 16) { cols = 4; rows = 4; }
        else { cols = Math.ceil(Math.sqrt(count)); rows = Math.ceil(count / cols); }
      }

      let fW = s.autoWidth ? (imgs[0].img.naturalWidth * cols) : s.width;
      if (fW > 8192) fW = 8192;
      const baseAspect = imgs[0].img.naturalWidth / imgs[0].img.naturalHeight;
      let fH = fW * (rows / cols) / baseAspect;

      const c = document.createElement('canvas');
      c.width = fW;
      c.height = fH;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = s.bgColor || '#000000';
      ctx.fillRect(0, 0, fW, fH);

      const cellW = (fW - (s.gap * (cols + 1))) / cols;
      const cellH = (fH - (s.gap * (rows + 1))) / rows;

      let idx = 0;
      for (let r = 0; r < rows; r++) {
        const rem = imgs.length - idx;
        const countInRow = Math.min(cols, rem);
        if (countInRow <= 0) break;
        const shiftX = ((cols - countInRow) * (cellW + s.gap)) / 2;

        for (let col = 0; col < countInRow; col++) {
          const item = imgs[idx];
          const x = s.gap + col * (cellW + s.gap) + shiftX;
          const y = s.gap + r * (cellH + s.gap);

          const iR = item.img.naturalWidth / item.img.naturalHeight;
          const cR = cellW / cellH;
          let sw, sh, sx, sy, dx, dy, dw, dh;
          
          if (s.fitMode === 'contain') {
            sx = 0; sy = 0; sw = item.img.naturalWidth; sh = item.img.naturalHeight;
            if (iR > cR) {
              dw = cellW;
              dh = dw / iR;
              dx = x;
              dy = y + (cellH - dh) / 2;
            } else {
              dh = cellH;
              dw = dh * iR;
              dy = y;
              dx = x + (cellW - dw) / 2;
            }
          } else {
            dx = x; dy = y; dw = cellW; dh = cellH;
            if (iR > cR) {
              sh = item.img.naturalHeight;
              sw = sh * cR;
              sy = 0;
              sx = (item.img.naturalWidth - sw) / 2;
            } else {
              sw = item.img.naturalWidth;
              sh = sw / cR;
              sx = 0;
              sy = (item.img.naturalHeight - sh) / 2;
            }
          }

          ctx.drawImage(item.img, sx, sy, sw, sh, dx, dy, dw, dh);
          idx++;
        }
      }

      canvasRef.current = c;
      setCanvasDataUrl(c.toDataURL('image/jpeg', 0.9));
      setCanvasSize({ w: Math.round(fW), h: Math.round(fH) });
    } catch (e: any) {
      console.error(e);
      setAlertMessage(`Failed to draw storyboard: ${e.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadStory = () => {
    if (canvasDataUrl && activeProject) {
      const a = document.createElement('a');
      a.href = canvasDataUrl;
      a.download = `${activeProject.name}.jpg`;
      a.click();
    }
  };

  const downloadAll = async () => {
    if (!projects.some((p) => p.images.length > 0)) return;
    setIsDownloading(true);
    
    try {
      const zip = new JSZip();

      for (const p of projects) {
        if (p.images.length === 0) continue;
        // We need to temporarily draw this project to a canvas
        const imgs = p.images;
        const s = p.settings;
        const count = imgs.length;
        let cols, rows;
        if (s.columns !== 'auto') {
          cols = s.columns as number;
          rows = Math.ceil(count / cols);
        } else {
          if (count === 4) { cols = 2; rows = 2; }
          else if (count === 9) { cols = 3; rows = 3; }
          else if (count === 16) { cols = 4; rows = 4; }
          else { cols = Math.ceil(Math.sqrt(count)); rows = Math.ceil(count / cols); }
        }

        let fW = s.autoWidth ? (imgs[0].img.naturalWidth * cols) : s.width;
        if (fW > 8192) fW = 8192;
        const baseAspect = imgs[0].img.naturalWidth / imgs[0].img.naturalHeight;
        let fH = fW * (rows / cols) / baseAspect;

        const c = document.createElement('canvas');
        c.width = fW;
        c.height = fH;
        const ctx = c.getContext('2d')!;
        ctx.fillStyle = s.bgColor || '#000000';
        ctx.fillRect(0, 0, fW, fH);

        const cellW = (fW - (s.gap * (cols + 1))) / cols;
        const cellH = (fH - (s.gap * (rows + 1))) / rows;

        let idx = 0;
        for (let r = 0; r < rows; r++) {
          const rem = imgs.length - idx;
          const countInRow = Math.min(cols, rem);
          if (countInRow <= 0) break;
          const shiftX = ((cols - countInRow) * (cellW + s.gap)) / 2;

          for (let col = 0; col < countInRow; col++) {
            const item = imgs[idx];
            const x = s.gap + col * (cellW + s.gap) + shiftX;
            const y = s.gap + r * (cellH + s.gap);

            const iR = item.img.naturalWidth / item.img.naturalHeight;
            const cR = cellW / cellH;
            let sw, sh, sx, sy, dx, dy, dw, dh;
            
            if (s.fitMode === 'contain') {
              sx = 0; sy = 0; sw = item.img.naturalWidth; sh = item.img.naturalHeight;
              if (iR > cR) {
                dw = cellW;
                dh = dw / iR;
                dx = x;
                dy = y + (cellH - dh) / 2;
              } else {
                dh = cellH;
                dw = dh * iR;
                dy = y;
                dx = x + (cellW - dw) / 2;
              }
            } else {
              dx = x; dy = y; dw = cellW; dh = cellH;
              if (iR > cR) {
                sh = item.img.naturalHeight;
                sw = sh * cR;
                sy = 0;
                sx = (item.img.naturalWidth - sw) / 2;
              } else {
                sw = item.img.naturalWidth;
                sh = sw / cR;
                sx = 0;
                sy = (item.img.naturalHeight - sh) / 2;
              }
            }

            ctx.drawImage(item.img, sx, sy, sw, sh, dx, dy, dw, dh);
            idx++;
          }
        }

        const blob = await new Promise<Blob | null>((r) => c.toBlob(r, 'image/jpeg', 0.9));
        if (blob) {
          zip.file(`${p.name}.jpg`, blob);
        }
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(content);
      a.download = 'boards.zip';
      a.click();
    } catch (e: any) {
      console.error(e);
      setAlertMessage(`Failed to download storyboards: ${e.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex flex-col relative w-full h-full">
      <ConfirmModal
        isOpen={confirmDeleteProject !== null}
        title="Delete Board"
        message="Are you sure you want to delete this board? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setConfirmDeleteProject(null)}
        confirmText="Delete"
      />
      <ConfirmModal
        isOpen={showConfirmClear}
        title="Clear Board"
        message="Are you sure you want to remove all assets from this board? This action cannot be undone."
        onConfirm={confirmClearBoard}
        onCancel={() => setShowConfirmClear(false)}
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
      <LoadingOverlay isVisible={isProcessing || isDownloading} message={isProcessing ? "Rendering storyboard..." : "Generating ZIP file..."} />
      
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8 items-start">
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex flex-col gap-6 sticky top-6 overflow-y-auto max-h-[calc(100vh-160px)] pr-[8px]">
          <motion.div variants={itemVariants} className="bg-bg-panel border border-border-color rounded-[8px] p-6 flex flex-col gap-4">
            <label className="flex flex-col gap-2">
              <span className="font-mono text-[12px] text-text-muted font-bold uppercase tracking-widest block">Board Actions</span>
              <SpecialInput type="text" value={activeProject?.name || ''} placeholder="Board Name" onChange={(e) => updateActiveProject({ name: e.target.value.replace(/\s+/g, '_') })} />
            </label>
            <div className="flex gap-4">
              <motion.button className="bg-text-main text-bg-main h-[48px] rounded-[4px] font-mono text-[14px] uppercase tracking-widest font-bold flex-1 transition-colors hover:bg-text-muted disabled:opacity-50" onClick={draw} disabled={isProcessing} whileTap={{ scale: 0.98 }}>Render</motion.button>
              <motion.button className="bg-bg-input border border-border-strong text-text-main h-[48px] rounded-[4px] font-mono text-[14px] uppercase tracking-widest font-bold flex-1 transition-colors hover:bg-bg-hover disabled:opacity-50" onClick={downloadStory} disabled={!canvasDataUrl} whileTap={{ scale: 0.98 }}>Save JPG</motion.button>
            </div>
            <div className="flex flex-col gap-4 mt-[8px]">
              <motion.button className="bg-transparent border border-border-strong text-text-main h-[48px] rounded-[4px] font-mono text-[14px] uppercase tracking-widest font-bold w-full transition-colors hover:bg-bg-input disabled:opacity-50" onClick={downloadAll} disabled={isDownloading} whileTap={{ scale: 0.98 }}>Download All (Zip)</motion.button>
              <motion.button className="bg-transparent border border-border-strong text-[#EF4444] h-[48px] rounded-[4px] font-mono text-[14px] uppercase tracking-widest font-bold w-full transition-colors hover:bg-[rgba(239,68,68,0.1)]" onClick={clearBoard} whileTap={{ scale: 0.98 }}>Clear Board</motion.button>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}
            className="border border-dashed border-border-strong bg-bg-main  text-center p-[48px] rounded-[8px] cursor-pointer transition-colors duration-300 hover:border-[#737373] hover:bg-bg-input"
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-border-strong'); }}
            onDragLeave={(e) => e.currentTarget.classList.remove('border-border-strong')}
            onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove('border-border-strong'); handleFiles(e.dataTransfer.files); }}
          >
            <label className="flex flex-col items-center justify-center gap-4 w-full cursor-pointer h-full">
              <input accept="image/*,video/*" hidden multiple type="file" ref={fileInputRef} onChange={(e) => { if (e.target.files) handleFiles(e.target.files); }} />
              <Upload className="w-[32px] h-[32px] text-text-muted" /> 
              <span className="font-mono text-[14px] uppercase tracking-widest text-text-main">Drop Assets</span>
            </label>
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="bg-bg-panel border border-border-color rounded-[8px] p-6 flex flex-col gap-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <span className="font-mono text-[12px] text-text-muted font-bold uppercase tracking-widest block mb-[8px]">Columns</span>
                  <select className="bg-bg-main  border border-border-color text-text-main font-mono text-[14px] rounded-[4px] px-[16px] h-[48px] w-full focus:border-border-strong transition-colors appearance-none" style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23737373%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px top 50%', backgroundSize: '12px auto' }} value={activeProject?.settings.columns || 'auto'} onChange={(e) => updateSettings({ columns: e.target.value === 'auto' ? 'auto' : parseInt(e.target.value) })}>
                    <option value="auto">Auto</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div className="flex-1">
                  <span className="font-mono text-[12px] text-text-muted font-bold uppercase tracking-widest block mb-[8px]">Fit</span>
                  <select className="bg-bg-main  border border-border-color text-text-main font-mono text-[14px] rounded-[4px] px-[16px] h-[48px] w-full focus:border-border-strong transition-colors appearance-none" style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23737373%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px top 50%', backgroundSize: '12px auto' }} value={activeProject?.settings.fitMode || 'cover'} onChange={(e) => updateSettings({ fitMode: e.target.value as 'cover' | 'contain' })}>
                    <option value="cover">Cover</option>
                    <option value="contain">Contain</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="flex flex-col gap-2">
                    <span className="font-mono text-[12px] text-text-muted font-bold uppercase tracking-widest block">Gap</span>
                    <SpecialInput type="number" value={activeProject?.settings.gap || 0} onChange={(e) => updateSettings({ gap: parseInt(e.target.value) || 0 })} />
                  </label>
                </div>
                <div className="flex-1">
                  <label className="flex flex-col gap-2">
                    <span className="font-mono text-[12px] text-text-muted font-bold uppercase tracking-widest block">Width</span>
                    <SpecialInput disabled={activeProject?.settings.autoWidth} type="number" value={activeProject?.settings.width || 1920} onChange={(e) => updateSettings({ width: parseInt(e.target.value) || 1920 })} />
                  </label>
                </div>
              </div>
              <div className="flex items-center justify-between mt-[8px]">
                <label className="font-mono text-[12px] text-text-main font-bold uppercase tracking-widest flex gap-3 items-center cursor-pointer">
                  <input className="w-[16px] h-[16px] accent-text-main" type="checkbox" checked={activeProject?.settings.autoWidth || false} onChange={(e) => updateSettings({ autoWidth: e.target.checked })} /> Auto Width
                </label>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[12px] text-text-muted font-bold uppercase tracking-widest block mb-0">BG</span>
                  <input className="bg-transparent border-none h-[32px] w-[32px] cursor-pointer rounded-[4px] overflow-hidden p-0" type="color" value={activeProject?.settings.bgColor || '#000000'} onChange={(e) => updateSettings({ bgColor: e.target.value })} />
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-bg-panel border border-border-color rounded-[8px] p-6 flex flex-col shrink-0">
            <button className="flex items-center justify-center bg-bg-main  border border-border-color hover:border-border-strong transition-colors rounded-[4px] w-full h-[48px] text-[14px] mb-[24px] shrink-0 font-bold uppercase font-mono tracking-widest text-text-main" onClick={addNewProject}>+ New Board</button>
            <div className="flex flex-col gap-2">
              {projects.map((p) => (
                <div
                  key={p.id}
                  className={`px-[16px] py-[12px] rounded-[4px] font-mono text-[14px] cursor-pointer flex justify-between items-center transition-colors duration-200 shrink-0 ${p.id === activeProjectId ? 'bg-text-main text-bg-main font-bold' : 'bg-bg-main  text-text-main hover:bg-bg-input'}`}
                  onClick={() => setActiveProjectId(p.id)}
                >
                  <span className="truncate flex-1">{p.name}</span>
                  <div className="flex items-center gap-2">
                    <span className={`opacity-50 hover:opacity-100 p-[4px] ${p.id === activeProjectId ? 'text-bg-main' : 'text-text-main'}`} title="Delete" onClick={(e) => { e.stopPropagation(); deleteProject(p.id); }}><X className="w-[16px] h-[16px]" /></span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-bg-panel border border-border-color rounded-[8px] p-6 flex flex-col gap-4 shrink-0">
            <span className="font-mono text-[12px] text-text-muted font-bold uppercase tracking-widest block shrink-0">Added Assets</span>
            <div className="flex flex-col gap-2">
              {activeProject?.images.map((item, index) => (
                <div 
                  key={item.id} 
                  className={`flex justify-between items-center p-[8px] bg-bg-main  border border-border-color rounded-[4px] transition-colors duration-200 text-text-main shrink-0 hover:border-border-strong`}
                >
                  <div className="flex items-center gap-3 pointer-events-none w-[80px] shrink-0">
                    <img src={item.img.src} className="w-[32px] h-[32px] object-cover rounded-[2px]" alt={`Asset ${index + 1}`} />
                    <span className="font-mono text-[12px] text-text-muted font-bold tracking-widest">#{index + 1}</span>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button className="flex items-center justify-center w-[32px] h-[32px] bg-bg-input rounded-[4px] border border-border-strong hover:bg-bg-hover transition-colors" onClick={() => moveImage(index, -1)}><ArrowUp className="w-[14px] h-[14px]" /></button>
                    <button className="flex items-center justify-center w-[32px] h-[32px] bg-bg-input rounded-[4px] border border-border-strong hover:bg-bg-hover transition-colors" onClick={() => moveImage(index, 1)}><ArrowDown className="w-[14px] h-[14px]" /></button>
                    <button className="flex items-center justify-center w-[32px] h-[32px] bg-[rgba(239,68,68,0.1)] text-[#EF4444] rounded-[4px] border border-[rgba(239,68,68,0.2)] hover:bg-[#EF4444] hover:text-text-main transition-colors" onClick={() => removeImage(index)}><X className="w-[14px] h-[14px]" /></button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
        
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="bg-bg-main  border border-border-color rounded-[8px] h-[calc(100vh-320px)] flex items-center justify-center overflow-hidden relative p-4 w-full max-lg:h-[350px] max-lg:order-[-1]">
          <motion.div variants={itemVariants} className="w-full h-full flex items-center justify-center overflow-hidden relative bg-checkered absolute inset-0 z-0 opacity-50" >
            {canvasDataUrl ? (
              <>
                <img src={canvasDataUrl} className="max-w-full max-h-full w-auto h-auto object-contain shadow-2xl rounded-[4px] cursor-pointer" alt="Preview" onClick={() => window.open(canvasDataUrl, '_blank')} />
                {canvasSize && (
                  <div className="absolute top-6 right-[24px] bg-bg-main  text-text-main px-[16px] py-[8px] rounded-[4px] text-[12px] font-mono border border-border-color pointer-events-none tracking-widest z-10 font-bold uppercase">
                    <span className="text-text-muted">SIZE:</span> {canvasSize.w} <span className="text-text-muted">x</span> {canvasSize.h}
                  </div>
                )}
              </>
            ) : (
              <span className="font-mono text-[14px] uppercase tracking-widest text-text-muted bg-bg-main  px-[24px] py-[12px] rounded-[4px] border border-border-color">Preview</span>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
