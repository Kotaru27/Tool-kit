import { motion } from 'framer-motion';
import React, { useState } from 'react';
import { Link2, Copy } from 'lucide-react';
import SpecialText from './SpecialText';
import { SpecialInput, SpecialTextarea } from './SpecialInput';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } }
} as const;

const itemVariants = {
  hidden: { opacity: 0, scale: 0.98 },
  show: { opacity: 1, scale: 1, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
} as const;

const SERVERS = {
  aldi: 'https://aldimediaeu.blob.core.windows.net/aldimediaeu/',
  s3: 'https://s3media-ml-eu.surveycenter.com/',
};

export default function AdLinkGen() {
  const [server, setServer] = useState<keyof typeof SERVERS>('aldi');
  const [folder, setFolder] = useState('');
  const [input, setInput] = useState('');
  const [outAds, setOutAds] = useState('');
  const [outStory, setOutStory] = useState('');
  const [copiedAds, setCopiedAds] = useState(false);
  const [copiedStory, setCopiedStory] = useState(false);

  const normFolder = (v: string) => {
    return v.trim().replace(/\s+/g, '/').replace(/\/+/g, '/').replace(/^\/|\/$/g, '') + '/';
  };

  const generate = () => {
    const f = normFolder(folder);
    const lines = input.split('\n').map((l) => l.trim()).filter(Boolean);
    const ads: string[] = [];
    const story: string[] = [];

    lines.forEach((name) => {
      const ext = name.split('.').pop()?.toLowerCase();
      const url = SERVERS[server] + f + name;

      if (ext === 'jpg' || ext === 'png') {
        ads.push(`<img src="${url}" class="zoomImage" style="max-width:80%">`);
        story.push(`<img src="${url}" class="zoomImage" style="max-height:280px">`);
      } else if (ext === 'mp4') {
        ads.push(url);
        story.push(`<img src="${SERVERS[server] + f + name.replace('.mp4', '.jpg')}" class="zoomImage" style="max-height:280px">`);
      } else if (ext === 'mp3') {
        ads.push(url);
        story.push(name);
      }
    });

    setOutAds(ads.join('\n'));
    setOutStory(story.join('\n'));
  };

  const copy = (text: string, type: 'ads' | 'story') => {
    navigator.clipboard.writeText(text).then(() => {
      if (type === 'ads') {
        setCopiedAds(true);
        setTimeout(() => setCopiedAds(false), 2000);
      } else {
        setCopiedStory(true);
        setTimeout(() => setCopiedStory(false), 2000);
      }
    });
  };

  return (
    <div className="flex flex-col relative w-full h-full">
      <div className="grid grid-cols-1 lg:grid-cols-[384px_1fr] gap-8 items-start">
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex flex-col gap-6 sticky top-6 overflow-y-auto max-h-[calc(100vh-160px)] pr-[8px]">
          <motion.div variants={itemVariants} className="bg-bg-panel border border-border-color rounded-[8px] p-6 flex flex-col gap-4">
            <span className="font-mono text-[12px] text-text-muted font-bold uppercase tracking-widest block mb-[8px]">Server</span>
            <select className="bg-bg-main  border border-border-color text-text-main font-mono text-[14px] rounded-[4px] px-[16px] h-[48px] w-full focus:border-border-strong transition-colors appearance-none" style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23737373%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px top 50%', backgroundSize: '12px auto' }} value={server} onChange={(e) => setServer(e.target.value as keyof typeof SERVERS)}>
              <option value="aldi">ALDI Blob</option>
              <option value="s3">S3 Media</option>
            </select>
          </motion.div>
          
          <motion.div variants={itemVariants} className="bg-bg-panel border border-border-color rounded-[8px] p-6 flex flex-col gap-4">
            <span className="font-mono text-[12px] text-text-muted font-bold uppercase tracking-widest block">Path</span>
            <SpecialInput placeholder="Folder/Path" value={folder} onChange={(e) => setFolder(e.target.value)} />
          </motion.div>
          
          <motion.div variants={itemVariants} className="bg-bg-panel border border-border-color rounded-[8px] p-6 flex flex-col gap-4">
            <span className="font-mono text-[12px] text-text-muted font-bold uppercase tracking-widest block">Filenames</span>
            <SpecialTextarea className="min-h-[200px]" value={input} onChange={(e) => setInput(e.target.value)} />
          </motion.div>
          
          <motion.button variants={itemVariants} className="bg-text-main text-bg-main h-[48px] rounded-[4px] font-mono text-[14px] uppercase tracking-widest font-bold w-full transition-colors hover:bg-text-muted" onClick={generate} whileTap={{ scale: 0.98 }}>Generate</motion.button>
        </motion.div>
        
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex flex-col gap-6">
          <motion.div variants={itemVariants} className="bg-bg-panel border border-border-color rounded-[8px] p-6 flex flex-col gap-4">
            <div className="flex justify-between items-center mb-[8px]">
              <span className="font-mono text-[12px] text-text-muted font-bold uppercase tracking-widest block mb-0">
                Ad Exposure
              </span>
              <button className="flex items-center justify-center bg-bg-main  border border-border-color hover:bg-bg-input transition-colors rounded-[4px] h-[32px] px-[16px] text-[12px] font-bold font-mono uppercase tracking-widest text-text-main" onClick={() => copy(outAds, 'ads')}>{copiedAds ? 'Copied!' : 'Copy'}</button>
            </div>
            <SpecialTextarea 
              className="min-h-[150px]" 
              readOnly 
              value={outAds} 
              rows={Math.max(5, outAds.split('\n').length)}
            />
          </motion.div>
          
          <motion.div variants={itemVariants} className="bg-bg-panel border border-border-color rounded-[8px] p-6 flex flex-col gap-4">
            <div className="flex justify-between items-center mb-[8px]">
              <span className="font-mono text-[12px] text-text-muted font-bold uppercase tracking-widest block mb-0">Storyboard Code</span>
              <button className="flex items-center justify-center bg-bg-main  border border-border-color hover:bg-bg-input transition-colors rounded-[4px] h-[32px] px-[16px] text-[12px] font-bold font-mono uppercase tracking-widest text-text-main" onClick={() => copy(outStory, 'story')}>{copiedStory ? 'Copied!' : 'Copy'}</button>
            </div>
            <SpecialTextarea 
              className="min-h-[150px]" 
              readOnly 
              value={outStory} 
              rows={Math.max(5, outStory.split('\n').length)}
            />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
