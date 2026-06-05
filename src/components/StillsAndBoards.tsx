import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Film, Clapperboard } from 'lucide-react';
import VideoStills, { StillFrame } from './VideoStills';
import Storyboard, { StoryProject, StoryImage } from './Storyboard';
import TabSwitcher, { TabItem } from './TabSwitcher';

const TABS: TabItem[] = [
  { id: 'stills', title: 'Video Stills', icon: <Film className="w-5 h-5" /> },
  { id: 'story',  title: 'Storyboard',   icon: <Clapperboard className="w-5 h-5" /> },
];

export default function StillsAndBoards() {
  const [activeTab, setActiveTab] = useState('stills');
  const [projects, setProjects] = useState<StoryProject[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<number | null>(null);

  const handleCreateStoryboard = async (name: string, selectedFrames: StillFrame[]) => {
    const imagePromises = selectedFrames.map((f) =>
      new Promise<StoryImage>((resolve) => {
        const img = new Image();
        img.src = f.url;
        const finish = () => {
          const file = new File([f.blob], `${f.num}.jpg`, { type: 'image/jpeg' });
          resolve({ id: Math.random().toString(36).substring(2, 11), file, img });
        };
        img.onload = finish;
        img.onerror = finish;
      })
    );

    const storyImages = await Promise.all(imagePromises);
    const projectId = Date.now() + Math.random();
    const newProject: StoryProject = {
      id: projectId,
      name,
      images: storyImages,
      settings: {
        gap: 0, width: 1920, autoWidth: true,
        bgColor: '#000000', columns: 'auto', fitMode: 'cover',
      },
    };

    setProjects((prev) => {
      if (prev.length === 1 && prev[0].images.length === 0 && prev[0].name.startsWith('Board_')) {
        return [newProject];
      }
      return [...prev, newProject];
    });
    setActiveProjectId(projectId);
    setActiveTab('story');
  };

  return (
    <div className="flex flex-col h-full overflow-hidden w-full mx-auto">
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
            {activeTab === 'stills' ? (
              <VideoStills onCreateStoryboard={handleCreateStoryboard} />
            ) : (
              <Storyboard
                projects={projects}
                setProjects={setProjects}
                activeProjectId={activeProjectId}
                setActiveProjectId={setActiveProjectId}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
