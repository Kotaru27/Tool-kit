import React, { useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, File, X } from 'lucide-react';
import { cn, formatBytes } from '../../lib/utils';

export interface DropZoneProps {
  onFiles: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxSizeMB?: number;
  className?: string;
  label?: string;
  sublabel?: string;
  files?: File[];
  onRemoveFile?: (index: number) => void;
  disabled?: boolean;
}

export function DropZone({
  onFiles,
  accept,
  multiple = false,
  maxSizeMB,
  className,
  label = 'Drop files here',
  sublabel,
  files = [],
  onRemoveFile,
  disabled,
}: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback((fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setError(null);

    const arr = Array.from(fileList);

    if (maxSizeMB) {
      const oversized = arr.filter(f => f.size > maxSizeMB * 1024 * 1024);
      if (oversized.length > 0) {
        setError(`${oversized[0].name} exceeds ${maxSizeMB} MB limit`);
        return;
      }
    }

    onFiles(arr);
  }, [onFiles, maxSizeMB]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    processFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleClick = () => {
    if (!disabled) inputRef.current?.click();
  };

  const acceptedTypes = sublabel ?? (accept ? accept.split(',').join(' · ') : 'Any file type');

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* Drop area */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={label}
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }}
        className={cn(
          'relative border border-dashed rounded-[var(--radius-app)] cursor-pointer transition-all duration-200',
          'flex flex-col items-center justify-center gap-3 px-6 py-10 text-center outline-none',
          'focus-visible:ring-2 focus-visible:ring-white/20',
          isDragging
            ? 'border-white/30 bg-white/[0.03] scale-[1.01]'
            : error
            ? 'border-red-500/40 bg-red-500/[0.02]'
            : disabled
            ? 'border-border-color opacity-40 cursor-not-allowed'
            : 'border-[var(--color-border-color)] bg-[var(--color-bg-input)] hover:border-border-strong hover:bg-text-main/[0.02]',
        )}
      >
        <AnimatePresence mode="wait">
          {isDragging ? (
            <motion.div
              key="drag"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center gap-2"
            >
              <Upload className="w-6 h-6 text-text-main" strokeWidth={1.5} />
              <span className="text-sm text-text-main font-medium">Drop to upload</span>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-2"
            >
              <Upload className="w-6 h-6 text-[var(--color-text-muted)]" strokeWidth={1.5} />
              <div>
                <span className="text-sm text-[var(--color-text-main)] font-medium">{label}</span>
                <span className="text-sm text-[var(--color-text-muted)]"> or click to browse</span>
              </div>
              <span className="font-sans text-xs uppercase tracking-widest text-[var(--color-text-muted)]">
                {acceptedTypes}
                {maxSizeMB && ` · Max ${maxSizeMB} MB`}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="sr-only"
          onChange={(e) => processFiles(e.target.files)}
          tabIndex={-1}
        />
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs text-red-400 font-sans">{error}</p>
      )}

      {/* File list */}
      {files.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {files.map((file, i) => (
            <li
              key={`${file.name}-${i}`}
              className="flex items-center gap-3 px-3 py-2.5 bg-[var(--color-bg-panel)] border border-[var(--color-border-color)] rounded-lg"
            >
              <File className="w-4 h-4 text-[var(--color-text-muted)] shrink-0" strokeWidth={1.5} />
              <span className="flex-1 text-sm text-text-main truncate">{file.name}</span>
              <span className="text-xs font-sans text-[var(--color-text-muted)] shrink-0">{formatBytes(file.size)}</span>
              {onRemoveFile && (
                <button
                  onClick={() => onRemoveFile(i)}
                  className="text-[var(--color-text-muted)] hover:text-text-main transition-colors ml-1"
                  aria-label={`Remove ${file.name}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
