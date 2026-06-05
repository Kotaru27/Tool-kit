import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Scissors } from 'lucide-react';
import PdfConvert from './PdfConvert';
import ImageSplitter from './ImageSplitter';
import TabSwitcher, { TabItem } from './TabSwitcher';

const TABS: TabItem[] = [
  { id: 'pdf',   title: 'PDF to Image',   icon: <FileText className="w-5 h-5" /> },
  { id: 'split', title: 'Image Splitter', icon: <Scissors className="w-5 h-5" /> },
];

export default function ImageAndPdf() {
  const [activeTab, setActiveTab] = useState('pdf');

  return (
    <div className="flex flex-col h-full overflow-hidden w-full max-w-[1440px] mx-auto">
      <TabSwitcher tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="h-full overflow-y-auto overflow-x-hidden"
          >
            {activeTab === 'pdf' ? <PdfConvert /> : <ImageSplitter />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
