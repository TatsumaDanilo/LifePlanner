
import React from 'react';
import { Hash, Ban, Scale, CheckSquare } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  onSelect: (type: string) => void;
}

const AddHabitMenu: React.FC<Props> = ({ onSelect }) => {
  const options = [
    {
      id: 'value',
      title: 'Body Weight',
      description: 'Track your body weight progress & trends e.g. Lose Weight, Bulk Up',
      icon: Scale,
      color: 'text-white'
    },
    {
      id: 'quit',
      title: 'Quit Habit',
      description: 'Break a bad habit. Track time since you stopped.',
      icon: Ban,
      color: 'text-red-400'
    },
    {
      id: 'count',
      title: 'Regular Habit',
      description: 'Track daily tasks, water, reading, etc. Build a streak.',
      icon: CheckSquare,
      color: 'text-emerald-400'
    },
  ];

  return (
    <div className="w-full flex flex-col gap-3 px-6 pb-12 pt-2">
      {options.map((option, index) => (
        <motion.button
          key={option.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelect(option.id)}
          className="w-full p-5 rounded-[24px] bg-zinc-900 border border-white/10 flex flex-col items-center text-center shadow-lg active:bg-zinc-800 transition-colors group relative overflow-hidden"
        >
          <div className="flex items-center gap-2 mb-2 z-10">
            <option.icon size={18} className={option.color} strokeWidth={2.5} />
            <span className="text-lg font-black uppercase tracking-tight text-white">{option.title}</span>
          </div>
          <p className="text-xs text-zinc-400 font-medium leading-relaxed max-w-[90%] z-10">
            {option.description}
          </p>
          
          {/* Subtle Glow Effect on Hover/Active */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-active:opacity-100 transition-opacity" />
        </motion.button>
      ))}
    </div>
  );
};

export default AddHabitMenu;
