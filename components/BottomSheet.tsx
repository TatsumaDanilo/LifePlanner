
import React from 'react';
import { motion } from 'framer-motion';

interface Props {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

const BottomSheet: React.FC<Props> = ({ title, onClose, children }) => {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm"
      />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-[70] bg-[#121212] rounded-t-[40px] shadow-2xl safe-bottom border-t border-white/10 max-h-[90vh] flex flex-col"
      >
        <div className="flex flex-col items-center w-full flex-shrink-0">
           <div className="w-12 h-1 bg-zinc-700 rounded-full mt-3 mb-6" />
           {title && <h2 className="text-xl font-bold mb-2">{title}</h2>}
        </div>
        <div className="flex flex-col w-full overflow-y-auto no-scrollbar flex-1">
          {children}
        </div>
      </motion.div>
    </>
  );
};

export default BottomSheet;
