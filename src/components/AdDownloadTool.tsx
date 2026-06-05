import { motion } from 'framer-motion';
import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Upload, Download, Copy, CheckCircle2, FileSpreadsheet, List, Code } from 'lucide-react';

import SpecialText from './SpecialText';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } }
} as const;

const itemVariants = {
  hidden: { opacity: 0, scale: 0.98 },
  show: { opacity: 1, scale: 1, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
} as const;

interface AdItem {
  adNo: string;
  adType: string;
  link: string;
  displayText: string;
  finalName: string;
  ext: string;
  cleanName: string;
  downloaded: boolean;
}

export default function AdDownloadTool() {
  const [file, setFile] = useState<File | null>(null);
  const [ads, setAds] = useState<AdItem[]>([]);
  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (message: string) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: '' }), 3000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const processExcel = () => {
    if (!file) {
      showToast("Please upload an Excel file first.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:C1');

      const parsedAds: AdItem[] = [];

      for (let r = 1; r <= range.e.r; r++) {
        const adCell = sheet[XLSX.utils.encode_cell({ r, c: 0 })];
        const linkCell = sheet[XLSX.utils.encode_cell({ r, c: 1 })];
        const typeCell = sheet[XLSX.utils.encode_cell({ r, c: 2 })];

        if (!typeCell || !adCell) continue;

        const adNo = String(adCell.v);
        const adType = String(typeCell.v);
        
        let link = "";
        if (linkCell?.l) link = linkCell.l.Target;
        else if (linkCell?.v) link = String(linkCell.v);

        const linkString = link.trim();
        const displayText = (linkCell?.v || "").toString().trim();

        // Extension extraction logic
        let extRegex = /\.(mp4|mov|avi|mkv|webm|flv|wmv|mp3|wav|ogg|m4a|aac|flac|jpg|jpeg|png|gif|webp|svg|bmp)\b/i;
        let extMatch = displayText.match(extRegex) || linkString.match(extRegex);

        if (!extMatch) {
          extMatch = displayText.match(/\.([a-zA-Z0-9]{2,4})$/i);
          if (!extMatch) {
            try {
              let urlObj = new URL(linkString);
              extMatch = urlObj.pathname.match(/\.([a-zA-Z0-9]{2,4})$/i);
            } catch (err) {
              extMatch = linkString.match(/\.([a-zA-Z0-9]{2,4})$/i);
            }
          }
        }

        let ext = extMatch ? extMatch[0].toLowerCase() : "";
        const ignoredExts = ['.com', '.org', '.net', '.co', '.io', '.de', '.uk', '.us', '.info', '.biz', '.html', '.htm', '.php', '.asp', '.aspx', '.jsp'];
        if (ignoredExts.includes(ext)) {
          ext = "";
        }

        let clean = displayText
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/ß/g, "ss");

        if (ext) {
          if (clean.toLowerCase().endsWith(ext)) {
            clean = clean.substring(0, clean.length - ext.length);
          }
        } else {
          let typeLower = adType.toLowerCase();
          if (typeLower.includes('print') || typeLower.includes('ooh') || typeLower.includes('img') || typeLower.includes('pic')) {
            ext = '.jpg';
          } else if (typeLower.includes('radio') || typeLower.includes('audio') || typeLower.includes('podcast')) {
            ext = '.mp3';
          } else {
            ext = '.mp4';
          }
        }

        clean = clean
          .replace(/[^a-zA-Z0-9]/g, "_")
          .replace(/_+/g, "_")
          .replace(/^_|_$/g, "");

        let typeNumberMatch = adType.match(/\d+/);
        let typeNumber = typeNumberMatch ? typeNumberMatch[0] : "";
        let typeBase = adType.replace(/\d+/g, "").trim();
        let typeBaseClean = typeBase
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-zA-Z0-9]/g, "_")
          .replace(/_+/g, "_")
          .replace(/^_|_$/g, "");

        if (typeNumber) {
          let regex = new RegExp(typeBaseClean, "i");
          clean = clean.replace(regex, typeBaseClean + typeNumber);
        }

        const finalName = `AD${adNo}_${clean}${ext}`;

        parsedAds.push({
          adNo,
          adType,
          link: linkString,
          displayText,
          finalName,
          cleanName: `AD${adNo}_${clean}`,
          ext,
          downloaded: false
        });
      }

      setAds(parsedAds);
      showToast("Dashboard built successfully!");
    };
    reader.readAsArrayBuffer(file);
  };

const copyToClipboard = async (text: string, successMessage?: string) => {
    // Use the custom message, or fallback to a truncated version of the text if it's too long
    const message = successMessage || `Copied: ${text.length > 50 ? text.substring(0, 50) + '...' : text}`;
    try {
      await navigator.clipboard.writeText(text);
      showToast(message);
    } catch (err) {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      showToast(message);
    }
  };

  const handleDownload = (ad: AdItem) => {
    let downloadUrl = ad.link;
    if (!downloadUrl.includes("download=")) {
      if (downloadUrl.includes("?")) {
        downloadUrl = downloadUrl.split("?")[0] + "?download=1";
      } else {
        downloadUrl += "?download=1";
      }
    }

    copyToClipboard(ad.finalName, `Copied: ${ad.finalName}`);
    window.open(downloadUrl, "downloadWindow", "width=900,height=700,left=200,top=100");

    setAds(prev => prev.map(item => item.adNo === ad.adNo ? { ...item, downloaded: true } : item));
  };

  const copyAllNames = () => {
    const names = ads.map(ad => ad.finalName).join('\n');
    copyToClipboard(names, `All ${ads.length} names copied to clipboard!`);
  };

const getBucketData = () => {
    if (!file) return Promise.resolve([]);
    
    return new Promise<any[]>((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        if (workbook.SheetNames.length < 2) {
          resolve([]);
          return;
        }
        
        const sheet = workbook.Sheets[workbook.SheetNames[1]];
        if (!sheet) {
          resolve([]);
          return;
        }
        
        const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:A1');
        let rows = [];
        
        const adTypeMap: Record<string, string> = {};
        ads.forEach(ad => {
          const normalizedType = ad.adType.toString().replace(/\s+/g, '').replace(/_/g, '').toUpperCase();
          adTypeMap[normalizedType] = ad.adNo;
        });

        for (let r = 1; r <= range.e.r; r++) {
          let bucketCell = sheet[XLSX.utils.encode_cell({ r: r, c: 0 })];
          if (!bucketCell) continue;

          let bucket = bucketCell.v.toString().trim();
          let bucketAds = [];

          for (let c = 1; c <= range.e.c; c++) {
            let adCell = sheet[XLSX.utils.encode_cell({ r: r, c: c })];
            if (!adCell || !adCell.v) continue;

            let name = adCell.v.toString().replace(/\s+/g, '').replace(/_/g, '').toUpperCase();
            let adNo = adTypeMap[name];

            if (adNo) bucketAds.push(adNo);
          }

          if (bucketAds.length > 0) {
            rows.push({ bucket: bucket, ads: bucketAds });
          }
        }
        resolve(rows);
      };
      reader.readAsArrayBuffer(file);
    });
  };

  const copyBucketTable = async () => {
    const rows = await getBucketData();
    if (rows.length === 0) {
      showToast("No bucket data found on Sheet 2.");
      return;
    }

    let output = "Bucket\tAds\n";
    rows.forEach(r => {
      output += r.bucket + "\t" + r.ads.map((a: string) => "'" + a + "'").join(",") + "\n";
    });

        copyToClipboard(output, "Bucket table copied to clipboard!");
  };

  const copyScript = async () => {
    const rows = await getBucketData();
    if (rows.length === 0) {
      showToast("No bucket data found on Sheet 2.");
      return;
    }

    let script = "var s = set()\n\n";
    rows.forEach(r => {
      script += "// Bucket " + r.bucket + "\n";
      script += "if (f('cq42000').any('" + r.bucket + "')) {\n";
      script += "    s = s.union(set(" + r.ads.map((a: string) => "'" + a + "'").join(",") + "))\n";
      script += "}\n\n";
    });

     copyToClipboard(script, "Script copied to clipboard!");
  };

  const pendingAds = ads.filter(a => !a.downloaded);
  const downloadedAds = ads.filter(a => a.downloaded);

  return (
    <div className="flex flex-col relative w-full h-full">
      <div className="flex items-center gap-4 mb-[24px] pb-[16px] border-b border-border-color">
        <FileSpreadsheet className="w-[24px] h-[24px] text-text-main" />
        <h2 className="m-0 text-[18px] font-medium flex-1 text-text-main tracking-tight"><SpecialText speed={30}>SharePoint File Downloader</SpecialText></h2>
      </div>
      <p className="text-text-muted mt-[-16px] mb-[24px] text-[14px]">Upload your SharePoint tracking sheet to generate standardized filenames and download assets.</p>

      <motion.div variants={containerVariants} initial="hidden" animate="show" className="bg-bg-panel border border-border-color rounded-[8px] p-6 flex flex-col gap-4 mb-[32px]">
        <motion.div variants={itemVariants} className="flex flex-wrap gap-4 items-center">
          <div 
            className="border border-dashed border-border-strong bg-bg-main  flex-1 min-w-[280px] flex items-center justify-center gap-3 h-[64px] rounded-[4px] cursor-pointer transition-colors duration-300 hover:border-[#737373] hover:bg-bg-input"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-border-strong'); }}
            onDragLeave={(e) => e.currentTarget.classList.remove('border-border-strong')}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('border-border-strong');
              handleDrop(e as unknown as React.DragEvent<HTMLDivElement>);
            }}
          >
            <Upload className="w-[20px] h-[20px] text-text-muted" />
            <span className="font-mono text-[14px] text-text-main truncate max-w-[300px]">{file ? file.name : "Click or drag Excel file here (.xlsx)"}</span>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".xlsx, .xls" 
              onChange={handleFileChange} 
            />
          </div>
          <motion.button className="bg-text-main text-bg-main h-[64px] px-[32px] rounded-[4px] font-mono text-[14px] uppercase tracking-widest font-bold transition-colors hover:bg-text-muted flex items-center gap-3 disabled:opacity-50" onClick={processExcel} disabled={!file} whileTap={{ scale: 0.98 }}>
            <CheckCircle2 className="w-[20px] h-[20px]" />
            Build Dashboard
          </motion.button>
        </motion.div>
      </motion.div>

      {ads.length > 0 && (
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="bg-bg-panel border border-border-color rounded-[8px] p-6 flex items-center justify-between gap-4 flex-wrap mb-[32px]">
          <motion.div variants={itemVariants} className="text-green-500 px-[16px] py-[8px] rounded-[4px] font-mono text-[12px] uppercase tracking-widest font-bold flex items-center gap-2 bg-green-500/10 border border-green-500/20">
            <CheckCircle2 className="w-[16px] h-[16px]" />
            {ads.length} Ads Detected
          </motion.div>
          
          <motion.div variants={itemVariants} className="flex items-center gap-4">
            <motion.button className="bg-bg-main  border border-border-color text-text-main h-[40px] px-[16px] rounded-[4px] font-mono text-[12px] uppercase tracking-widest font-bold flex items-center gap-2 hover:bg-bg-input transition-colors" onClick={copyAllNames} whileTap={{ scale: 0.98 }}>
              <Copy className="w-[14px] h-[14px]" /> Copy All Names
            </motion.button>
            <motion.button className="bg-bg-main  border border-border-color text-text-main h-[40px] px-[16px] rounded-[4px] font-mono text-[12px] uppercase tracking-widest font-bold flex items-center gap-2 hover:bg-bg-input transition-colors" onClick={copyBucketTable} whileTap={{ scale: 0.98 }}>
              <List className="w-[14px] h-[14px]" /> Copy Table
            </motion.button>
            <motion.button className="bg-bg-main  border border-border-color text-text-main h-[40px] px-[16px] rounded-[4px] font-mono text-[12px] uppercase tracking-widest font-bold flex items-center gap-2 hover:bg-bg-input transition-colors" onClick={copyScript} whileTap={{ scale: 0.98 }}>
              <Code className="w-[14px] h-[14px]" /> Copy Script
            </motion.button>
          </motion.div>
        </motion.div>
      )}

      {ads.length > 0 && (
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="bg-bg-panel border border-border-color rounded-[8px] overflow-hidden mb-[32px]">
          <motion.div variants={itemVariants} className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="bg-bg-main  border-b border-border-color">
                <tr>
                  <th className="p-4 text-text-muted font-mono text-[12px] uppercase tracking-widest font-bold w-[120px]">Ad No</th>
                  <th className="p-4 text-text-muted font-mono text-[12px] uppercase tracking-widest font-bold">Generated Name</th>
                  <th className="p-4 text-text-muted font-mono text-[12px] uppercase tracking-widest font-bold text-right w-[280px]">Actions</th>
                </tr>
              </thead>
              <motion.tbody variants={containerVariants} initial="hidden" animate="show" className="divide-y divide-[#1A1A1A]">
                {pendingAds.map(ad => (
                  <motion.tr variants={itemVariants} key={ad.adNo} className="hover:bg-bg-main  transition-colors">
                    <td className="p-4 font-mono text-[14px] text-text-main font-bold">{ad.adNo}</td>
                    <td className="p-4 font-mono text-[14px] text-text-main">
                      <SpecialText speed={15}>{ad.cleanName}</SpecialText><span className="text-text-muted">{ad.ext}</span>
                    </td>
                    <td className="p-4 flex justify-end gap-3">
                      <motion.button 
                        whileTap={{ scale: 0.95 }}
                        onClick={() => copyToClipboard(ad.finalName, `Copied: ${ad.finalName}`)}
                        className="bg-bg-input text-text-main h-[32px] px-[16px] rounded-[4px] font-mono text-[12px] uppercase tracking-widest font-bold flex items-center gap-2 hover:bg-bg-hover transition-colors"
                      >
                        <Copy className="w-[14px] h-[14px]" /> Copy
                      </motion.button>
                      <motion.button 
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDownload(ad)}
                        className="bg-text-main text-bg-main h-[32px] px-[16px] rounded-[4px] font-mono text-[12px] uppercase tracking-widest font-bold flex items-center gap-2 hover:bg-text-muted transition-colors"
                      >
                        <Download className="w-[14px] h-[14px]" /> Download
                      </motion.button>
                    </td>
                  </motion.tr>
                ))}
                
                {downloadedAds.length > 0 && (
                  <>
                    <motion.tr variants={itemVariants} className="bg-bg-main ">
                      <td colSpan={3} className="p-4 text-green-500 font-mono text-[12px] uppercase tracking-widest font-bold">
                        Downloaded Ads
                      </td>
                    </motion.tr>
                    {downloadedAds.map(ad => (
                      <motion.tr variants={itemVariants} key={ad.adNo} className="bg-bg-main  opacity-50 hover:opacity-100 transition-opacity">
                        <td className="p-4 font-mono text-[14px] text-text-main font-bold">{ad.adNo}</td>
                        <td className="p-4 font-mono text-[14px] text-text-main line-through decoration-[#737373]">
                          <SpecialText speed={15}>{ad.cleanName}</SpecialText><span className="text-text-muted">{ad.ext}</span>
                        </td>
                        <td className="p-4 flex justify-end gap-3">
                          <motion.button 
                            whileTap={{ scale: 0.95 }}
                            onClick={() => copyToClipboard(ad.finalName, `Copied: ${ad.finalName}`)}
                            className="bg-bg-input text-text-main h-[32px] px-[16px] rounded-[4px] font-mono text-[12px] uppercase tracking-widest font-bold flex items-center gap-2 hover:bg-bg-hover transition-colors"
                          >
                            <Copy className="w-[14px] h-[14px]" /> Copy
                          </motion.button>
                          <motion.button 
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleDownload(ad)}
                            className="bg-green-500/10 border border-green-500/20 text-green-500 h-[32px] px-[16px] rounded-[4px] font-mono text-[12px] uppercase tracking-widest font-bold flex items-center gap-2 hover:bg-green-500 hover:text-text-main transition-colors"
                          >
                            <Download className="w-[14px] h-[14px]" /> Redownload
                          </motion.button>
                        </td>
                      </motion.tr>
                    ))}
                  </>
                )}
              </motion.tbody>
            </table>
          </motion.div>
        </motion.div>
      )}

      {/* Toast */}
      {toast.show && (
        <div className="fixed bottom-[32px] right-[32px] bg-[#10B981] text-bg-main px-[24px] py-[16px] rounded-[4px] shadow-2xl flex items-center gap-3 z-50">
          <CheckCircle2 className="w-[20px] h-[20px]" />
          <span className="font-mono text-[14px] font-bold tracking-widest">{toast.message}</span>
        </div>
      )}
    </div>
  );
}
