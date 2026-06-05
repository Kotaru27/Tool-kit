import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link2, Download } from 'lucide-react';
import AdLinkGen from './AdLinkGen';
import AdDownloadTool from './AdDownloadTool';
import TabSwitcher, { TabItem } from './TabSwitcher';

const TABS: TabItem[] = [
  { id: 'adlinks',    title: 'Stim Path',             icon: <Link2 className="w-5 h-5" /> },
  { id: 'addownload', title: 'SharePoint Downloader',  icon: <Download className="w-5 h-5" /> },
];

export default function AdTools() {
  const [activeTab, setActiveTab] = useState('adlinks');

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
            {activeTab === 'adlinks' ? <AdLinkGen /> : <AdDownloadTool />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
