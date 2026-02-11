
import React from 'react';
import { Plus, BookOpen, Film, Gamepad2, PenTool } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  isOpen: boolean;
  onToggle: () => void;
  onAction: (action: string) => void;
  isSingleAction?: boolean;
  onSingleAction?: () => void;
}

const FloatingMenu: React.FC<Props> = ({ isOpen, onToggle, onAction, isSingleAction = false, onSingleAction }) => {
  const actions = [
    { id: 'book', icon: BookOpen, color: 'text-blue-400' },
    { id: 'movie', icon: Film, color: 'text-red-400' },
    { id: 'game', icon: Gamepad2, color: 'text-indigo-400' },
    { id: 'art', icon: PenTool, color: 'text-emerald-400' },
  ];

  const handleClick = () => {
    if (isSingleAction && onSingleAction) {
      onSingleAction();
    } else {
      onToggle();
    }
  };

  return (
    <div className="flex flex-col items-end">
      <AnimatePresence>
        {isOpen && !isSingleAction && (
          <div className="flex flex-col items-center space-y-4 mb-4 pr-1">
            {actions.map((action, index) => (
              <motion.button
                key={action.id}
                initial={{ opacity: 0, scale: 0.5, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.5, y: 20 }}
                transition={{ delay: index * 0.05, type: 'spring', stiffness: 400, damping: 25 }}
                onClick={() => {
                  onAction(action.id);
                  onToggle();
                }}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl bg-zinc-900 border border-white/10 ${action.color}`}
              >
                <action.icon size={20} />
              </motion.button>
            ))}
          </div>
        )}
      </AnimatePresence>

      <motion.button
        initial={false}
        animate={{ 
          rotate: isOpen && !isSingleAction ? 45 : 0,
        }}
        whileTap={{ scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        onClick={handleClick}
        className={`w-16 h-16 rounded-[22px] flex items-center justify-center shadow-2xl transition-all liquid-blur text-white`}
      >
        <Plus size={32} />
      </motion.button>
    </div>
  );
};

export default FloatingMenu;
