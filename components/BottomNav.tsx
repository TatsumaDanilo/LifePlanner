
import React from 'react';
import { Home, Calendar, CheckSquare, PlayCircle } from 'lucide-react';
import { TabType } from '../types';
// Fix: Added AnimatePresence to imports
import { motion, LayoutGroup, AnimatePresence } from 'framer-motion';

interface Props {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const BottomNav: React.FC<Props> = ({ activeTab, onTabChange }) => {
  const tabs: { id: TabType; icon: any; label: string }[] = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'daily', icon: Calendar, label: 'Daily' },
    { id: 'habits', icon: CheckSquare, label: 'Habits' },
    { id: 'media', icon: PlayCircle, label: 'Media' },
  ];

  return (
    <nav className="w-full px-4 pb-8 pt-2 pointer-events-none flex justify-center">
      <div className="liquid-blur w-full max-w-sm h-18 rounded-[36px] flex items-center justify-around px-2 relative pointer-events-auto shadow-2xl border border-white/10 overflow-hidden bg-black/40 backdrop-blur-3xl">
        <LayoutGroup>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className="relative flex flex-col items-center justify-center w-full h-full transition-all duration-300 outline-none group"
              >
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      layoutId="active-pill"
                      className="absolute inset-x-1 inset-y-1 bg-white/[0.08] border border-white/10 rounded-[28px] -z-10 shadow-[0_0_25px_rgba(255,255,255,0.03)]"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                </AnimatePresence>
                
                <motion.div
                  animate={{ 
                    scale: isActive ? 1.05 : 0.9,
                    y: isActive ? -2 : 0,
                    color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.4)' 
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className="flex flex-col items-center z-10"
                >
                  <div className={`p-1 transition-transform duration-300 ${isActive ? 'scale-110' : ''}`}>
                    <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  <span className={`text-[8px] mt-1 font-black uppercase tracking-[0.1em]`}>
                    {tab.label}
                  </span>
                </motion.div>
              </button>
            );
          })}
        </LayoutGroup>
      </div>
    </nav>
  );
};

export default BottomNav;
