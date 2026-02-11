
import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

const GlassCard: React.FC<Props> = ({ title, subtitle, icon, children, defaultExpanded = false }) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="liquid-blur rounded-3xl mb-4 overflow-hidden border border-white/5 bg-white/[0.03]">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-5 text-left active:bg-white/5 transition-colors"
      >
        <div className="flex items-center space-x-3">
          {icon && <div className="text-white/70">{icon}</div>}
          <div>
            <h3 className="font-semibold text-lg leading-tight">{title}</h3>
            {subtitle && <p className="text-xs text-white/40 mt-1">{subtitle}</p>}
          </div>
        </div>
        {isExpanded ? <ChevronUp size={20} className="opacity-40" /> : <ChevronDown size={20} className="opacity-40" />}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 border-t border-white/5 pt-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GlassCard;
