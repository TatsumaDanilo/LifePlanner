
import React, { useState, useMemo, useRef, useEffect, useLayoutEffect } from 'react';
import { Droplets, Sparkles, Plus, Clock, Moon, Bell, Trash2, X, Check, ChevronDown, ChevronUp, Lock, Link, PlayCircle, AlertCircle, ArrowUp } from 'lucide-react';
import { AppState, DailyBlock, Habit, MediaItem } from '../types';
import GlassCard from '../components/GlassCard';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  state: AppState;
  setState: (state: AppState) => void;
}

// Helper for color styles (Tailwind safe)
const getColorStyles = (color: string) => {
  const map: Record<string, string> = {
    zinc: 'bg-zinc-500/10 border-zinc-500/20 text-zinc-100',
    red: 'bg-red-500/10 border-red-500/20 text-red-100',
    orange: 'bg-orange-500/10 border-orange-500/20 text-orange-100',
    amber: 'bg-amber-500/10 border-amber-500/20 text-amber-100',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-100',
    teal: 'bg-teal-500/10 border-teal-500/20 text-teal-100',
    cyan: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-100',
    blue: 'bg-blue-500/10 border-blue-500/20 text-blue-100',
    indigo: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-100',
    violet: 'bg-violet-500/10 border-violet-500/20 text-violet-100',
    purple: 'bg-purple-500/10 border-purple-500/20 text-purple-100',
    fuchsia: 'bg-fuchsia-500/10 border-fuchsia-500/20 text-fuchsia-100',
    pink: 'bg-pink-500/10 border-pink-500/20 text-pink-100',
    rose: 'bg-rose-500/10 border-rose-500/20 text-rose-100',
  };
  return map[color] || map.blue;
};

const getDotColor = (color: string) => {
    const map: Record<string, string> = {
        zinc: 'bg-zinc-500', red: 'bg-red-500', orange: 'bg-orange-500',
        amber: 'bg-amber-500', emerald: 'bg-emerald-500', teal: 'bg-teal-500',
        cyan: 'bg-cyan-500', blue: 'bg-blue-500', indigo: 'bg-indigo-500',
        violet: 'bg-violet-500', purple: 'bg-purple-500', fuchsia: 'bg-fuchsia-500',
        pink: 'bg-pink-500', rose: 'bg-rose-500'
    };
    return map[color] || 'bg-blue-500';
};

// --- IMPROVED BLOCK EDITOR MODAL ---
const BlockEditorModal = ({ 
    initialTime, 
    initialActivity, 
    initialHabitId,
    initialMediaId,
    habits,
    mediaItems,
    isExisting,
    onClose, 
    onSave,
    onDelete
}: { 
    initialTime: string, 
    initialActivity: string, 
    initialHabitId?: string,
    initialMediaId?: string,
    habits: Habit[],
    mediaItems: MediaItem[],
    isExisting: boolean,
    onClose: () => void, 
    onSave: (activity: string, habitId?: string, mediaId?: string, addReminder?: boolean) => void,
    onDelete: () => void
}) => {
    const [activity, setActivity] = useState(initialActivity);
    const [selectedHabitId, setSelectedHabitId] = useState<string | undefined>(initialHabitId);
    const [selectedMediaId, setSelectedMediaId] = useState<string | undefined>(initialMediaId);
    const [addReminder, setAddReminder] = useState(false);

    // 1. Auto-Naming Logic: Update text when Habit or Media changes
    useEffect(() => {
        if (!selectedHabitId && !selectedMediaId) return;

        let newName = activity;
        const habit = habits.find(h => h.id === selectedHabitId);
        const media = mediaItems.find(m => m.id === selectedMediaId);

        if (habit && media) {
            newName = `${habit.name} • ${media.title}`;
        } else if (habit) {
            // Only update if current text is empty or matches the old naming pattern to avoid overwriting user notes
            if (!activity || activity === initialActivity || habits.some(h => h.name === activity)) {
                newName = habit.name;
            }
        } else if (media) {
            if (!activity) newName = media.title;
        }
        
        setActivity(newName);
    }, [selectedHabitId, selectedMediaId, habits, mediaItems]);

    // 2. Validation Logic: Check if reminder exists
    const selectedHabit = habits.find(h => h.id === selectedHabitId);
    const hasReminderAtTime = selectedHabit?.reminders?.some(r => r.time === initialTime);
    const isReminderMissing = selectedHabit && !hasReminderAtTime;
    const canSave = !!activity.trim() && (!isReminderMissing || addReminder);

    return (
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
            onClick={onClose}
        >
            <motion.div 
                initial={{ scale: 0.9, y: 20 }} 
                animate={{ scale: 1, y: 0 }} 
                exit={{ scale: 0.9, y: 20 }} 
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-sm bg-[#121212] border border-white/10 rounded-[32px] p-6 shadow-2xl relative"
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-white font-black text-xs">
                            {initialTime}
                        </div>
                        <h3 className="text-lg font-bold text-white">{isExisting ? 'Edit Block' : 'New Event'}</h3>
                    </div>
                    <button onClick={onClose} className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-400">
                        <X size={18} />
                    </button>
                </div>

                <div className="space-y-5 mb-8">
                    {/* Habit Selection (Dropdown) */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-2 flex items-center gap-2">
                            <Link size={10} className="text-indigo-400" /> Link Habit
                        </label>
                        <div className="relative">
                            <select 
                                value={selectedHabitId || ''}
                                onChange={(e) => setSelectedHabitId(e.target.value || undefined)}
                                className="w-full h-14 bg-zinc-900 border border-white/10 rounded-[20px] px-5 text-sm text-white focus:outline-none appearance-none font-medium"
                            >
                                <option value="">No Habit Linked</option>
                                {habits.map(h => (
                                    <option key={h.id} value={h.id}>{h.name}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={16} />
                        </div>
                    </div>

                    {/* Media Selection (Dropdown) */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-2 flex items-center gap-2">
                            <PlayCircle size={10} className="text-pink-400" /> Link Media (Optional)
                        </label>
                        <div className="relative">
                            <select 
                                value={selectedMediaId || ''}
                                onChange={(e) => setSelectedMediaId(e.target.value || undefined)}
                                className="w-full h-14 bg-zinc-900 border border-white/10 rounded-[20px] px-5 text-sm text-white focus:outline-none appearance-none font-medium"
                            >
                                <option value="">No Media Linked</option>
                                {mediaItems.filter(m => !m.isCollection && (m.status === 'ongoing' || m.status === 'paused')).map(m => (
                                    <option key={m.id} value={m.id}>
                                        {m.type === 'book' ? '📖' : m.type === 'movie' ? '🎬' : '🎮'} {m.title}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={16} />
                        </div>
                    </div>

                    {/* Activity Text Input */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-2">Display Name</label>
                        <input 
                            type="text"
                            value={activity}
                            onChange={(e) => setActivity(e.target.value)}
                            placeholder="e.g. Deep Work"
                            className="w-full h-14 bg-zinc-900 border border-white/10 rounded-[20px] px-5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/20 transition-colors font-bold"
                        />
                    </div>

                    {/* Reminder Validation Warning */}
                    <AnimatePresence>
                        {isReminderMissing && (
                            <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="bg-amber-500/10 border border-amber-500/20 rounded-[20px] p-4 flex items-center gap-3">
                                    <AlertCircle className="text-amber-500 flex-shrink-0" size={20} />
                                    <div className="flex-1">
                                        <p className="text-[10px] font-bold text-amber-200 uppercase tracking-wide leading-tight">Promemoria Obbligatorio</p>
                                        <p className="text-[10px] text-amber-400/80 leading-tight mt-1">Questa abitudine richiede un promemoria per essere salvata.</p>
                                    </div>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <div className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors ${addReminder ? 'bg-amber-500 border-amber-500' : 'border-amber-500/50'}`}>
                                            {addReminder && <Check size={14} className="text-black" strokeWidth={3} />}
                                        </div>
                                        <input type="checkbox" checked={addReminder} onChange={(e) => setAddReminder(e.target.checked)} className="hidden" />
                                    </label>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer Actions */}
                <div className="flex gap-3">
                    {isExisting && (
                        <button 
                            onClick={onDelete}
                            className="h-14 w-14 rounded-[20px] bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center active:scale-95 transition-transform"
                        >
                            <Trash2 size={20} />
                        </button>
                    )}
                    <button 
                        disabled={!canSave}
                        onClick={() => onSave(activity, selectedHabitId, selectedMediaId, addReminder)}
                        className={`flex-1 h-14 rounded-[20px] font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2 ${canSave ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'}`}
                    >
                        {isExisting ? 'Update' : 'Create'} <Check size={16} />
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

const DailyView: React.FC<Props> = ({ state, setState }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isAgendaExpanded, setIsAgendaExpanded] = useState(false);
  
  // State for Editor
  const [editorData, setEditorData] = useState<{ time: string, activity: string, habitId?: string, mediaId?: string, isExisting: boolean } | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  // Track if this is the first render to handle initial scroll instantly
  const isFirstRender = useRef(true);

  const updateWater = (delta: number) => {
    setState({ ...state, waterIntake: Math.max(0, state.waterIntake + delta) });
  };

  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setState({ ...state, dayEndTime: e.target.value });
  };

  const getLocalDateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Determine current time slot for focus
  const currentTimeSlot = useMemo(() => {
      const now = new Date();
      const h = now.getHours();
      const m = now.getMinutes();
      const isHalf = m >= 30;
      return `${h.toString().padStart(2, '0')}:${isHalf ? '30' : '00'}`;
  }, []);

  const hours = Array.from({ length: 24 * 2 }, (_, i) => {
    const hour = Math.floor(i / 2);
    const minute = i % 2 === 0 ? '00' : '30';
    return `${hour.toString().padStart(2, '0')}:${minute}`;
  });

  // Calculate visible hours based on expansion state (Restored)
  const visibleHours = useMemo(() => {
      if (isAgendaExpanded) return hours;
      
      const idx = hours.indexOf(currentTimeSlot);
      if (idx === -1) return hours.slice(0, 3);
      
      const start = Math.max(0, idx - 1);
      const end = Math.min(hours.length, idx + 2);
      
      if (idx === 0) return hours.slice(0, 3);
      if (idx === hours.length - 1) return hours.slice(hours.length - 3);
      
      return hours.slice(start, end);
  }, [isAgendaExpanded, hours, currentTimeSlot]);

  // --- MANUAL BLOCK MANAGEMENT ---

  const handleSlotClick = (time: string, existingBlock?: DailyBlock) => {
      setEditorData({
          time,
          activity: existingBlock ? existingBlock.activity : '',
          habitId: existingBlock?.habitId,
          mediaId: existingBlock?.mediaId,
          isExisting: !!existingBlock
      });
  };

  const handleDeleteBlock = () => {
      if (!editorData) return;
      const newBlocks = state.dailyBlocks.filter(b => b.time !== editorData.time);
      setState({ ...state, dailyBlocks: newBlocks });
      setEditorData(null);
  };

  const handleSaveBlock = (activity: string, habitId?: string, mediaId?: string, addReminder?: boolean) => {
      if (!editorData || !activity.trim()) return;

      // 0. Ensure Habit ID is linked if name matches exactly (Robustness)
      // This helps if user typed the name but didn't select from dropdown
      if (!habitId && activity.trim()) {
          const matched = state.habits.find(h => h.name.toLowerCase() === activity.trim().toLowerCase());
          if (matched) habitId = matched.id;
      }

      const newBlock: DailyBlock = {
          time: editorData.time,
          activity: activity,
          isFixed: false,
          habitId, // Save ID directly
          mediaId  // Save ID directly
      };

      let updatedHabits = [...state.habits];

      // 1. Mandatory Reminder Update
      if (habitId && addReminder) {
          updatedHabits = updatedHabits.map(h => {
              if (h.id === habitId) {
                  const newReminders = [...(h.reminders || [])];
                  // Prevent duplicates just in case
                  if (!newReminders.some(r => r.time === editorData.time)) {
                      newReminders.push({ time: editorData.time, days: [0,1,2,3,4,5,6] });
                  }
                  return { ...h, reminders: newReminders };
              }
              return h;
          });
      }

      // 2. Prepare Updated Blocks
      const otherBlocks = state.dailyBlocks.filter(b => b.time !== editorData.time);
      let updatedBlocks = [...otherBlocks, newBlock];
      
      // 3. Smart Stacking Check Logic
      if (habitId) {
          // Use state.habits to be absolutely sure we have the definition, 
          // including stackedAfterId which might have been set recently.
          const currentHabit = state.habits.find(h => h.id === habitId);
          
          if (currentHabit) {
              let parentHabit: Habit | undefined;
              
              // A. Resolve Dependency - ID Priority
              if (currentHabit.stackedAfterId) {
                  parentHabit = state.habits.find(h => h.id === currentHabit.stackedAfterId);
              }
              
              // B. Resolve Dependency - Name Fallback
              if (!parentHabit && currentHabit.stackTrigger) {
                  const triggerName = currentHabit.stackTrigger.trim().toLowerCase();
                  parentHabit = state.habits.find(h => h.name.toLowerCase() === triggerName);
              }

              if (parentHabit) {
                  // Check if Parent is already in the schedule (anywhere today)
                  // Note: updatedBlocks currently includes the block we just added (newBlock).
                  // We check if the PARENT is there.
                  const isParentScheduled = updatedBlocks.some(b => b.habitId === parentHabit!.id);
                  
                  if (!isParentScheduled) {
                      const currentIndex = hours.indexOf(editorData.time);
                      const prevIndex = currentIndex - 1; // Exactly 30 mins before
                      
                      if (prevIndex >= 0) {
                          const prevTime = hours[prevIndex];
                          // Check if the previous slot is occupied
                          const isPrevSlotOccupied = updatedBlocks.some(b => b.time === prevTime);
                          
                          if (!isPrevSlotOccupied) {
                              const confirmMessage = `Smart Stacking: "${currentHabit.name}" di solito segue "${parentHabit.name}".\n\nVuoi aggiungere "${parentHabit.name}" alle ${prevTime}?`;
                              
                              if (window.confirm(confirmMessage)) {
                                  const parentBlock: DailyBlock = {
                                      time: prevTime,
                                      activity: parentHabit.name,
                                      isFixed: false,
                                      habitId: parentHabit.id
                                  };
                                  updatedBlocks.push(parentBlock);
                              }
                          }
                      }
                  }
              }
          }
      }

      // 4. Final Sort and Save
      updatedBlocks.sort((a, b) => a.time.localeCompare(b.time));
      setState({ ...state, dailyBlocks: updatedBlocks, habits: updatedHabits });
      setEditorData(null);
  };

  const handleToggleComplete = (time: string, habitId?: string, mediaId?: string) => {
      if (!habitId) return; // Only habits can be toggled for now in this view
      const habit = state.habits.find(h => h.id === habitId);
      if (!habit) return;

      // Dependency Check Logic (ID-based with legacy fallback)
      const dateKey = getLocalDateKey(selectedDate);
      let dependencyId = habit.stackedAfterId;
      
      // Legacy fallback
      if (!dependencyId && habit.stackTrigger) {
          const dep = state.habits.find(h => h.name.toLowerCase() === habit.stackTrigger?.toLowerCase());
          if (dep) dependencyId = dep.id;
      }

      if (dependencyId) {
          const triggerHabit = state.habits.find(h => h.id === dependencyId);
          if (triggerHabit) {
              const triggerEntry = triggerHabit.history[dateKey];
              const isTriggerDone = typeof triggerEntry === 'number' ? triggerEntry >= triggerHabit.goal : (triggerEntry && triggerEntry.completedIds?.length > 0);
              
              if (!isTriggerDone) {
                  // Locked!
                  // Ideally show a toast here
                  alert(`Locked! Complete "${triggerHabit.name}" first.`);
                  return;
              }
          }
      }

      // Update Habit History
      const currentVal = (typeof habit.history[dateKey] === 'number') ? habit.history[dateKey] as number : 0;
      const isCompleting = currentVal < habit.goal;
      const newVal = isCompleting ? habit.goal : 0; // Simple toggle for daily view
      
      const newHistory = { ...habit.history, [dateKey]: newVal };
      let updatedHabits = state.habits.map(h => h.id === habitId ? { ...h, history: newHistory } : h);

      // Media Completion Check
      let updatedMedia = [...state.media];
      if (isCompleting && mediaId) {
          const media = updatedMedia.find(m => m.id === mediaId);
          if (media && media.status !== 'completed') {
              if (window.confirm(`Did you finish "${media.title}"?`)) {
                  updatedMedia = updatedMedia.map(m => m.id === mediaId ? { ...m, status: 'completed', completedDate: new Date().toISOString().split('T')[0] } : m);
              }
          }
      }

      setState({ ...state, habits: updatedHabits, media: updatedMedia });
  };

  const days = useMemo(() => {
    const arr = [];
    const today = new Date();
    for (let i = -3; i < 11; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      arr.push(d);
    }
    return arr;
  }, []);

  // Use useLayoutEffect to handle scroll position before paint to prevent visual jumps
  useLayoutEffect(() => {
    if (scrollRef.current) {
        const activeEl = scrollRef.current.querySelector<HTMLElement>('.active-day');
        if (activeEl) {
            // If it's the first render, we snap instantly.
            if (isFirstRender.current) {
                activeEl.scrollIntoView({
                    behavior: 'auto', // Instant scroll
                    inline: 'center',
                    block: 'nearest'
                });
                isFirstRender.current = false;
            } else {
                // Otherwise, smooth scroll for user navigation
                activeEl.scrollIntoView({
                    behavior: 'smooth',
                    inline: 'center',
                    block: 'nearest'
                });
            }
        }
    }
  }, [selectedDate]);

  const isToday = (d: Date) => d.toDateString() === new Date().toDateString();
  const isSelected = (d: Date) => d.toDateString() === selectedDate.toDateString();

  return (
    <div className="flex flex-col transform-gpu w-full h-auto pb-56">
      <header className="flex-shrink-0 px-6 pt-16 mb-4 flex items-center justify-between">
        <div>
            <h1 className="text-4xl font-black tracking-tighter">Daily Plan</h1>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] mt-1">Deep Work & Flow</p>
        </div>
        
        <div className="flex flex-col items-end">
            <span className="text-[8px] font-black uppercase tracking-widest text-zinc-600 mb-1">Fine Giornata</span>
            <div className="relative flex items-center gap-2 bg-zinc-900 border border-white/10 rounded-full pl-3 pr-4 py-2 shadow-sm cursor-pointer active:scale-95 transition-transform">
                <Moon size={14} className="text-indigo-400" />
                <span className="text-xs font-bold text-white tracking-wider tabular-nums">
                    {state.dayEndTime || "00:00"}
                </span>
                <input 
                    type="time" 
                    value={state.dayEndTime || "00:00"} 
                    onChange={handleEndTimeChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20 appearance-none bg-transparent" 
                />
            </div>
        </div>
      </header>

      <div className="space-y-6 px-6">
        <GlassCard 
          title="Brain Dump" 
          icon={<Sparkles size={18} className="text-purple-400" />}
          defaultExpanded={false}
        >
          <textarea
            value={state.brainDump}
            onChange={(e) => setState({ ...state, brainDump: e.target.value })}
            placeholder="Cosa hai in mente per oggi? Scrivi i tuoi pensieri alla rinfusa..."
            className="w-full h-24 bg-white/5 rounded-[24px] p-4 text-xs font-medium focus:outline-none border border-white/5 resize-none placeholder:text-zinc-700"
          />
        </GlassCard>

        <div className="space-y-3">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-black uppercase tracking-widest opacity-40 flex items-center gap-2">
              <Clock size={12} />
              Agenda Oraria
            </h3>
            <div className="flex items-center gap-2 bg-zinc-900 px-3 py-1 rounded-full border border-white/5">
                <Droplets size={12} className="text-blue-400" />
                <span className="text-[10px] font-black text-white">{state.waterIntake} bicchieri</span>
                <button onClick={() => updateWater(1)} className="p-1"><Plus size={10}/></button>
            </div>
          </div>
          
          {/* Expandable Agenda Container */}
          <div className="liquid-blur rounded-[40px] p-4 border border-white/5 flex flex-col transition-all duration-300">
                <motion.div 
                    initial={false}
                    animate={{ height: isAgendaExpanded ? 400 : 'auto' }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className={`space-y-2 no-scrollbar ${!isAgendaExpanded ? 'overflow-hidden' : 'overflow-y-auto'}`}
                >
                    {visibleHours.map((time) => {
                        const block = state.dailyBlocks.find(b => b.time === time);
                        const linkedHabit = block?.habitId ? state.habits.find(h => h.id === block.habitId) : null;
                        const linkedMedia = block?.mediaId ? state.media.find(m => m.id === block.mediaId) : null;
                        const isCurrentSlot = time === currentTimeSlot;

                        // Dependency Lock Logic
                        let isLocked = false;
                        if (linkedHabit) {
                            // Check ID based
                            let depId = linkedHabit.stackedAfterId;
                            // Fallback to name based
                            if (!depId && linkedHabit.stackTrigger) {
                                const dep = state.habits.find(h => h.name.toLowerCase() === linkedHabit.stackTrigger?.toLowerCase());
                                if (dep) depId = dep.id;
                            }

                            if (depId) {
                                const triggerHabit = state.habits.find(h => h.id === depId);
                                if (triggerHabit) {
                                    const dateKey = getLocalDateKey(selectedDate);
                                    const triggerEntry = triggerHabit.history[dateKey];
                                    const isTriggerDone = typeof triggerEntry === 'number' ? triggerEntry >= triggerHabit.goal : (triggerEntry && triggerEntry.completedIds?.length > 0);
                                    if (!isTriggerDone) isLocked = true;
                                }
                            }
                        }

                        // Completion Status
                        let isCompleted = false;
                        if (linkedHabit) {
                            const dateKey = getLocalDateKey(selectedDate);
                            const entry = linkedHabit.history[dateKey];
                            isCompleted = typeof entry === 'number' ? entry >= linkedHabit.goal : (entry && entry.completedIds?.length > 0);
                        }

                        return (
                            <div 
                                key={time} 
                                className="flex space-x-4 items-center h-12 group"
                            >
                                <span className={`text-[8px] font-black w-8 text-right tracking-tighter transition-colors ${isCurrentSlot ? 'text-indigo-400' : 'text-zinc-600'}`}>{time}</span>
                                <motion.div 
                                    whileTap={{ scale: 0.98 }}
                                    className={`flex-1 rounded-[18px] h-full flex items-center px-4 transition-all relative overflow-hidden cursor-pointer ${
                                    block 
                                    ? block.isFixed 
                                    ? 'bg-zinc-900 border border-white/10' 
                                    : linkedHabit 
                                        ? isCompleted 
                                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-100 opacity-60 grayscale'
                                            : getColorStyles(linkedHabit.color)
                                        : 'bg-indigo-500/10 border border-indigo-500/20 shadow-[inset_0_0_20px_rgba(99,102,241,0.05)]'
                                    : isCurrentSlot 
                                        ? 'bg-gradient-to-r from-indigo-500/10 to-transparent border-l-2 border-indigo-500' 
                                        : 'border border-dashed border-white/5 opacity-30 hover:opacity-50 hover:bg-white/5'
                                    }`}
                                >
                                    {block ? (
                                    <div className="flex items-center justify-between w-full relative z-10" onClick={() => handleSlotClick(time, block)}>
                                        <div className="flex flex-col justify-center overflow-hidden mr-2">
                                            <span className={`text-[11px] font-black tracking-tight uppercase truncate ${linkedHabit ? 'text-white' : 'text-white/90'}`}>
                                                {block.activity}
                                            </span>
                                            {linkedMedia && (
                                                <span className="text-[8px] font-bold text-white/50 truncate flex items-center gap-1">
                                                    <PlayCircle size={8} /> {linkedMedia.title}
                                                </span>
                                            )}
                                        </div>
                                        
                                        <div className="flex items-center gap-3">
                                            {linkedHabit && (
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleToggleComplete(time, linkedHabit.id, linkedMedia?.id); }}
                                                    disabled={isLocked}
                                                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${isLocked ? 'bg-zinc-800 text-zinc-600' : isCompleted ? 'bg-emerald-500 text-white shadow-lg' : 'bg-white/10 text-white/20 hover:bg-white/20'}`}
                                                >
                                                    {isLocked ? <Lock size={10} /> : <Check size={12} strokeWidth={isCompleted ? 4 : 2} />}
                                                </button>
                                            )}
                                            <div className="flex items-center gap-2">
                                                {linkedHabit && !isCompleted && <div className={`w-1.5 h-1.5 rounded-full ${getDotColor(linkedHabit.color)}`} />}
                                                {block.isFixed && <div className="w-1.5 h-1.5 rounded-full bg-zinc-500" />}
                                            </div>
                                        </div>
                                    </div>
                                    ) : (
                                    <div className="flex items-center justify-between w-full" onClick={() => handleSlotClick(time)}>
                                        <span className={`text-[9px] font-black uppercase tracking-widest transition-colors ${isCurrentSlot ? 'text-indigo-300' : 'text-zinc-800 group-hover:text-zinc-500'}`}>
                                            {isCurrentSlot ? 'Now' : 'Libero'}
                                        </span>
                                    </div>
                                    )}
                                </motion.div>
                            </div>
                        );
                    })}
                </motion.div>
                
                <button 
                    onClick={() => setIsAgendaExpanded(!isAgendaExpanded)}
                    className="w-full flex items-center justify-center pt-2 mt-2 text-zinc-500 hover:text-white transition-colors"
                >
                    {isAgendaExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
          </div>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="fixed bottom-28 left-0 right-0 z-30 flex gap-3 overflow-x-auto no-scrollbar py-2 px-6 mask-fade-edges snap-x snap-mandatory"
      >
        {days.map((date, i) => (
          <motion.button
            key={i}
            whileTap={{ scale: 0.9 }}
            onClick={() => setSelectedDate(date)}
            className={`flex-shrink-0 w-14 h-20 rounded-[24px] flex flex-col items-center justify-center transition-all duration-300 relative border snap-center ${
              isSelected(date) 
                ? 'bg-white border-white text-black shadow-[0_0_10px_rgba(255,255,255,0.05)] active-day' 
                : 'bg-white/5 border-white/5 text-zinc-500'
            }`}
          >
            <span className={`text-[9px] font-black uppercase tracking-tighter mb-1 ${isSelected(date) ? 'opacity-40' : 'opacity-20'}`}>
              {date.toLocaleDateString('it-IT', { weekday: 'short' }).slice(0, 3)}
            </span>
            <span className="text-xl font-black tracking-tighter leading-none">
              {date.getDate()}
            </span>
            {isToday(date) && !isSelected(date) && (
              <div className="absolute bottom-2 w-1 h-1 rounded-full bg-blue-500" />
            )}
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
          {editorData && (
              <BlockEditorModal 
                  initialTime={editorData.time}
                  initialActivity={editorData.activity}
                  initialHabitId={editorData.habitId}
                  initialMediaId={editorData.mediaId}
                  habits={state.habits}
                  mediaItems={state.media}
                  isExisting={editorData.isExisting}
                  onClose={() => setEditorData(null)}
                  onSave={handleSaveBlock}
                  onDelete={handleDeleteBlock}
              />
          )}
      </AnimatePresence>
    </div>
  );
};

export default DailyView;
