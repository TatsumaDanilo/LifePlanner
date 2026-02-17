// Complete implementation of HabitsView with support for Regular, Weight and Quit habits.
import React, { useState, useMemo, useEffect, useRef, useLayoutEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, animate } from 'framer-motion';
import { 
  Sun, Moon, Zap, ChevronLeft, ChevronRight, Calendar, Clock, Check, Plus, Minus, 
  Play, Pause, RotateCcw, X, CheckSquare, Timer as TimerIcon, ChevronsRight, 
  Flame, AlertCircle, BarChart2, LayoutGrid, Grid, CalendarDays, Trash2, Edit3, Scale, 
  TrendingUp, List as ListIcon, CornerDownRight, Ban, TimerReset 
} from 'lucide-react';
import { AppState, Habit, MicroHabit } from '../types';

interface Props {
  state: AppState;
  setState: (state: AppState) => void;
  onDetailOpen?: (isOpen: boolean) => void;
  onAddHabit?: () => void;
  onEditHabit?: (habit: Habit) => void;
}

const getColorClasses = (color: string) => {
  const map: Record<string, { bg: string, border: string, text: string, accent: string, glow: string, soft: string, hover: string }> = {
    zinc: { bg: 'bg-zinc-500/10', border: 'border-zinc-500/20', text: 'text-zinc-400', accent: 'bg-zinc-500', glow: 'shadow-zinc-500/20', soft: 'bg-zinc-500/20', hover: 'hover:bg-zinc-500/20' },
    red: { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400', accent: 'bg-red-500', glow: 'shadow-red-500/20', soft: 'bg-red-500/20', hover: 'hover:bg-red-500/20' },
    orange: { bg: 'bg-orange-500/10', border: 'border-orange-500/20', text: 'text-orange-400', accent: 'bg-orange-500', glow: 'shadow-orange-500/20', soft: 'bg-orange-500/20', hover: 'hover:bg-orange-500/20' },
    amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', accent: 'bg-amber-500', glow: 'shadow-amber-500/20', soft: 'bg-amber-500/20', hover: 'hover:bg-amber-500/20' },
    emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', accent: 'bg-emerald-500', glow: 'shadow-emerald-500/20', soft: 'bg-emerald-500/20', hover: 'hover:bg-emerald-500/20' },
    teal: { bg: 'bg-teal-500/10', border: 'border-teal-500/20', text: 'text-teal-400', accent: 'bg-teal-500', glow: 'shadow-teal-500/20', soft: 'bg-teal-500/20', hover: 'hover:bg-teal-500/20' },
    cyan: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', text: 'text-cyan-400', accent: 'bg-cyan-500', glow: 'shadow-cyan-500/20', soft: 'bg-cyan-500/20', hover: 'hover:bg-cyan-500/20' },
    blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400', accent: 'bg-blue-500', glow: 'shadow-blue-500/20', soft: 'bg-blue-500/20', hover: 'hover:bg-blue-500/20' },
    indigo: { bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', text: 'text-indigo-400', accent: 'bg-indigo-500', glow: 'shadow-indigo-500/20', soft: 'bg-indigo-500/20', hover: 'hover:bg-indigo-500/20' },
    violet: { bg: 'bg-violet-500/10', border: 'border-violet-500/20', text: 'text-violet-400', accent: 'bg-violet-500', glow: 'shadow-violet-500/20', soft: 'bg-violet-500/20', hover: 'hover:bg-violet-500/20' },
    purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400', accent: 'bg-purple-500', glow: 'shadow-purple-500/20', soft: 'bg-purple-500/20', hover: 'hover:bg-purple-500/20' },
    fuchsia: { bg: 'bg-fuchsia-500/10', border: 'border-fuchsia-500/20', text: 'text-fuchsia-400', accent: 'bg-fuchsia-500', glow: 'shadow-fuchsia-500/20', soft: 'bg-fuchsia-500/20', hover: 'hover:bg-fuchsia-500/20' },
    pink: { bg: 'bg-pink-500/10', border: 'border-pink-500/20', text: 'text-pink-400', accent: 'bg-pink-500', glow: 'shadow-pink-500/20', soft: 'bg-pink-500/20', hover: 'hover:bg-pink-500/20' },
    rose: { bg: 'bg-rose-500/10', border: 'border-rose-500/20', text: 'text-rose-400', accent: 'bg-rose-500', glow: 'shadow-rose-500/20', soft: 'bg-rose-500/20', hover: 'hover:bg-rose-500/20' },
  };
  return map[color] || map.blue;
};

const getHexFromColor = (color: string) => {
    const colors: Record<string, string> = {
        zinc: '#a1a1aa', red: '#f87171', orange: '#fb923c', amber: '#fbbf24',
        emerald: '#34d399', teal: '#2dd4bf', cyan: '#22d3ee', blue: '#60a5fa',
        indigo: '#818cf8', violet: '#a78bfa', purple: '#c084fc', fuchsia: '#e879f9',
        pink: '#f472b6', rose: '#fb7185'
    };
    return colors[color] || '#60a5fa';
};

const getDailyStructure = (habit: Habit, date: Date): MicroHabit[] => {
    if (!habit.structure || habit.structure.length === 0) return [];
    
    if (habit.dailyStructures) {
        const dayIndex = date.getDay(); 
        if (habit.dailyStructures[dayIndex]) {
            return habit.dailyStructures[dayIndex];
        }
    }
    return habit.structure;
};

const getStructureProgress = (habit: Habit, dateKey: string, structure: MicroHabit[]): { current: number, total: number, percentage: number } => {
    if (!structure || structure.length === 0) return { current: 0, total: 1, percentage: 0 };
    
    const historyEntry = habit.history[dateKey];
    let completedIds: string[] = [];
    
    if (typeof historyEntry === 'object' && historyEntry !== null && 'completedIds' in historyEntry) {
        const entryObj = historyEntry as { completedIds: string[] };
        completedIds = entryObj.completedIds || [];
    }

    let totalItems = 0;
    let completedCount = 0;

    const traverse = (items: MicroHabit[]) => {
        items.forEach(item => {
            totalItems++;
            if (completedIds.includes(item.id)) completedCount++;
            if (item.subHabits) traverse(item.subHabits);
        });
    };
    traverse(structure);

    return {
        current: completedCount,
        total: totalItems,
        percentage: totalItems === 0 ? 0 : (completedCount / totalItems) * 100
    };
};

const SimpleLineChart = ({ data, color, unit }: { data: { date: string, value: number }[], color: string, unit: string }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(0);
    const [height, setHeight] = useState(0);

    useLayoutEffect(() => {
        if (containerRef.current) {
            const { width, height } = containerRef.current.getBoundingClientRect();
            setWidth(width);
            setHeight(height);
        }
    }, []);

    if (!data || data.length === 0) return <div className="w-full h-full flex items-center justify-center text-zinc-600 text-[10px] font-bold uppercase tracking-widest">No Data</div>;

    const padding = 20;
    const effectiveWidth = width - padding * 2;
    const effectiveHeight = height - padding * 2;

    const values = data.map(d => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    const isSinglePoint = data.length === 1;

    const points = data.map((d, i) => {
        const x = padding + (isSinglePoint ? effectiveWidth / 2 : (i / (data.length - 1)) * effectiveWidth);
        const normalizedVal = (d.value - min) / range;
        const y = height - (padding + normalizedVal * effectiveHeight);
        return `${x},${y}`;
    }).join(' ');

    const themeColor = getHexFromColor(color);

    return (
        <div ref={containerRef} className="w-full h-full relative">
            {width > 0 && height > 0 && (
                <svg width={width} height={height} className="overflow-visible">
                    {[0, 0.5, 1].map(p => {
                        const y = height - (padding + p * effectiveHeight);
                        return <line key={p} x1={padding} y1={y} x2={width - padding} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="4 4" />;
                    })}

                    {!isSinglePoint && (
                        <polyline 
                            points={points} 
                            fill="none" 
                            stroke={themeColor} 
                            strokeWidth="3" 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            className="drop-shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                        />
                    )}

                    {data.map((d, i) => {
                        const x = padding + (isSinglePoint ? effectiveWidth / 2 : (i / (data.length - 1)) * effectiveWidth);
                        const normalizedVal = (d.value - min) / range;
                        const y = height - (padding + normalizedVal * effectiveHeight);
                        return (
                            <g key={i} className="group cursor-pointer">
                                <circle cx={x} cy={y} r="12" fill="transparent" />
                                <circle cx={x} cy={y} r="4" fill="#121212" stroke={themeColor} strokeWidth="2" className="transition-all group-hover:r-6 group-hover:fill-white" />
                                <g className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                    <rect x={x - 20} y={y - 35} width="40" height="22" rx="6" fill="#121212" stroke="rgba(255,255,255,0.2)" />
                                    <text x={x} y={y - 20} textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" dominantBaseline="middle">{d.value}</text>
                                </g>
                            </g>
                        );
                    })}
                </svg>
            )}
        </div>
    );
};

const getHabitConfig = (habit: Habit) => {
    let config = { type: 'every', days: [], daysPerWeek: 7 };
    try {
        if (habit.description && habit.description.startsWith('{')) {
            const data = JSON.parse(habit.description);
            config = { ...config, ...data };
        }
    } catch (e) {}
    return config;
};

const getLocalDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getStartOfWeek = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return monday;
};

const getWeeklyCompletions = (habit: Habit, currentDate: Date) => {
    const start = getStartOfWeek(currentDate);
    let count = 0;
    for(let i=0; i<7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        const k = getLocalDateKey(d);
        const entry = habit.history[k];
        let val = 0;
        if (typeof entry === 'number') val = entry;
        else if (entry && typeof entry === 'object') {
             const structure = getDailyStructure(habit, d);
             if (structure.length > 0) {
                 const { percentage } = getStructureProgress(habit, k, structure);
                 val = percentage >= 100 ? 1 : 0;
             }
        }
        
        if(val >= habit.goal) count++;
    }
    return count;
};

interface HabitCardProps {
  habit: Habit;
  onClick: () => void;
  onQuickAdd: (e: React.MouseEvent) => void;
  onSkip: (e: React.MouseEvent) => void;
  onTimer: (e: React.MouseEvent) => void;
  onDeleteRequest: () => void;
  onEditRequest: () => void;
  currentDate: Date;
  dayEndTime: string;
}

const HabitCard: React.FC<HabitCardProps> = ({ habit, onClick, onQuickAdd, onSkip, onTimer, onDeleteRequest, onEditRequest, currentDate, dayEndTime }) => {
  const styles = getColorClasses(habit.color);
  const dateKey = getLocalDateKey(currentDate);
  const historyEntry = habit.history[dateKey];
  
  let displayValue = 0;
  
  const dailyStructure = getDailyStructure(habit, currentDate);
  const hasStructure = dailyStructure.length > 0;
  
  if (typeof historyEntry === 'number') {
      displayValue = historyEntry === -1 ? 0 : historyEntry;
  } else if (historyEntry && typeof historyEntry === 'object') {
      const { current } = getStructureProgress(habit, dateKey, dailyStructure);
      displayValue = current;
  }

  const dailyGoal = hasStructure ? getStructureProgress(habit, dateKey, dailyStructure).total : habit.goal;
  const config = getHabitConfig(habit);
  
  const isWeight = habit.unit === 'kg' || habit.unit === 'lbs';
  const isQuit = habit.unit === 'minutes' && habit.description?.startsWith('Start:');
  const isFlexible = config.type === 'days_per'; 
  const weeklyTarget = isFlexible ? config.daysPerWeek : 7;
  const currentWeeklyCompletions = getWeeklyCompletions(habit, currentDate);
  const isWeeklyTargetMet = currentWeeklyCompletions >= weeklyTarget;

  const getBaseColor = (c: string) => {
      const colors: Record<string, string> = {
          red: '#ef4444', orange: '#f97316', amber: '#f59e0b', emerald: '#10b981', teal: '#14b8a6', cyan: '#06b6d4',
          blue: '#3b82f6', indigo: '#6366f1', violet: '#8b5cf6', purple: '#a855f7', fuchsia: '#d946ef', pink: '#ec4899', rose: '#f43f5e', zinc: '#71717a'
      };
      return colors[c] || '#3b82f6';
  };
  const baseHex = getBaseColor(habit.color);
  const rgba = (hex: string, alpha: number) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };
  
  const x = useMotionValue(0);

  const handleAction = (e: React.MouseEvent, action: (e: React.MouseEvent) => void) => {
      e.stopPropagation();
      animate(x, 0, { type: "spring", stiffness: 400, damping: 30 });
      action(e);
  };

  const handleDragEnd = () => {
      const currentX = x.get();
      if (currentX > 60) {
           animate(x, 120, { type: "spring", stiffness: 400, damping: 30 });
      } else if (currentX < -60) {
           animate(x, -120, { type: "spring", stiffness: 400, damping: 30 });
      } else {
           animate(x, 0, { type: "spring", stiffness: 400, damping: 30 });
      }
  };

  const [quitDuration, setQuitDuration] = useState<{days: number, hours: number, minutes: number, seconds: number} | null>(null);

  useEffect(() => {
      if (!isQuit) return;
      const startStr = habit.description?.replace('Start: ', '');
      if (!startStr) return;
      
      const update = () => {
          const start = new Date(startStr);
          const now = new Date();
          const diff = now.getTime() - start.getTime();
          if (diff < 0) {
              setQuitDuration({ days: 0, hours: 0, minutes: 0, seconds: 0 });
              return;
          }
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          setQuitDuration({ days, hours, minutes, seconds });
      };
      update();
      const interval = setInterval(update, 1000); 
      return () => clearInterval(interval);
  }, [habit, isQuit]);

  const weekData = useMemo(() => {
    const d = new Date(currentDate);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const startOfWeek = new Date(d.setDate(diff));

    const now = new Date();
    const [endH, endM] = (dayEndTime || "00:00").split(':').map(Number);
    if (endH > 0 && endH < 12 && (now.getHours() < endH || (now.getHours() === endH && now.getMinutes() < endM))) {
        now.setDate(now.getDate() - 1);
    }
    const adjustedTodayKey = getLocalDateKey(now);

    const days = [];
    let quitStartDate: Date | null = null;
    if (isQuit && habit.description) {
        const s = habit.description.replace('Start: ', '');
        if (s) quitStartDate = new Date(s);
    }

    for (let i = 0; i < 7; i++) {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        const k = getLocalDateKey(d);
        
        let status: 'completed' | 'partial' | 'skipped' | 'failed' | 'empty' = 'empty';
        let resetCount = 0;

        if (isQuit) {
             const resets = typeof habit.history[k] === 'number' ? habit.history[k] as number : 0;
             if (resets > 0) {
                 status = 'failed';
                 resetCount = resets;
             } else if (quitStartDate) {
                 const cellDateStart = new Date(d);
                 cellDateStart.setHours(0,0,0,0);
                 const quitDateStart = new Date(quitStartDate);
                 quitDateStart.setHours(0,0,0,0);

                 if (cellDateStart.getTime() === quitDateStart.getTime()) {
                     status = 'failed';
                 } else if (d >= quitStartDate && d <= now) {
                     status = 'completed';
                 }
             }
        } else {
            const valEntry = habit.history[k];
            let val = 0;
            let isComplete = false;
            let isSkip = false;

            if (typeof valEntry === 'number') {
                val = valEntry;
                isSkip = val === -1;
                isComplete = val >= habit.goal;
            } else if (valEntry && typeof valEntry === 'object') {
                const struct = getDailyStructure(habit, d);
                if (struct.length > 0) {
                    const { percentage } = getStructureProgress(habit, k, struct);
                    val = percentage > 0 ? 1 : 0;
                    isComplete = percentage >= 100;
                }
            }

            if (isSkip) { status = 'skipped'; } 
            else if (isComplete) { status = 'completed'; } 
            else if (val > 0) { status = 'partial'; } 
            else if (k < adjustedTodayKey) { status = 'failed'; }
        }
        
        days.push({ dayName: d.toLocaleDateString('en-US', { weekday: 'narrow' }), status, isToday: k === adjustedTodayKey, resetCount });
    }
    return days;
  }, [habit.history, currentDate, habit.goal, dayEndTime, habit, isQuit]);

  const getDynamicStatusClasses = (status: string, isToday: boolean) => {
      const successClass = 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]'; 
      const shouldUseGreen = isQuit || (isFlexible && isWeeklyTargetMet) || (!isFlexible);
      if (status === 'completed') {
          return shouldUseGreen ? successClass : `${styles.soft} border-${habit.color}-500/30 ${styles.text}`;
      }
      switch (status) {
        case 'skipped': return 'bg-orange-500/10 border-orange-500/20 text-orange-400';
        case 'failed': return 'bg-red-500/20 border-red-500/30 text-red-400'; 
        case 'partial': return `bg-${habit.color}-500/20 border-${habit.color}-500/30 text-${habit.color}-400`; 
        case 'empty': default: return isToday ? 'bg-transparent border-white text-white' : 'bg-white/5 border-transparent text-zinc-600';
    }
  };

  const progressPercent = Math.min(100, Math.max(0, (displayValue / dailyGoal) * 100));
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (progressPercent / 100) * circumference;
  
  const showDetailCount = hasStructure || (!isWeight && !isQuit);

  return (
    <div className="relative w-full mb-3 last:mb-0">
      <div className="absolute inset-0 flex justify-between items-center px-4 rounded-[28px] pointer-events-none">
         <div className="flex items-center gap-3 w-[110px] justify-start pointer-events-auto">
            <button onClick={(e) => { e.stopPropagation(); onDeleteRequest(); animate(x, 0); }} className="w-10 h-10 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center border border-red-500/30 active:scale-90 transition-transform"><Trash2 size={18} /></button>
            <button onClick={(e) => { e.stopPropagation(); onEditRequest(); animate(x, 0); }} className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center border border-white/20 active:scale-90 transition-transform"><Edit3 size={18} /></button>
         </div>
         <div className="flex items-center gap-3 w-[110px] justify-end pointer-events-auto">
            {!isWeight && !isQuit && (
                <>
                <button onClick={(e) => handleAction(e, onTimer)} className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30 active:scale-90 transition-transform"><TimerIcon size={18} /></button>
                <button onClick={(e) => handleAction(e, onSkip)} className="w-10 h-10 rounded-full bg-zinc-700/50 text-zinc-400 flex items-center justify-center border border-white/10 active:scale-90 transition-transform"><ChevronsRight size={18} /></button>
                </>
            )}
         </div>
      </div>
      
      <motion.div
        style={{ x }}
        drag="x"
        dragConstraints={{ left: (isWeight || isQuit) ? 0 : -120, right: 120 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        className="relative z-20 touch-pan-y transform-gpu"
      >
          <motion.div
            layoutId={`habit-card-${habit.id}`}
            onClick={() => { if (Math.abs(x.get()) < 5) onClick(); }}
            style={{ borderRadius: '28px', borderColor: rgba(baseHex, 0.2) }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`w-full overflow-hidden border flex flex-col p-4 cursor-pointer shadow-lg bg-zinc-900`}
          >
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                    <h3 className="text-sm font-black uppercase tracking-tight text-white leading-tight">{habit.name}</h3>
                    {isWeight && (<div className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/5 border border-white/5"><Scale size={10} className="text-zinc-400" /></div>)}
                    {isQuit && (<div className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/10 border border-red-500/20"><Ban size={10} className="text-red-400" /></div>)}
                    {!isWeight && !isQuit && (<div className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/5 border border-white/5"><Flame size={10} className={`${habit.streak > 0 ? styles.text : 'text-zinc-600'}`} fill={habit.streak > 0 ? "currentColor" : "none"} /><span className={`text-[9px] font-black ${habit.streak > 0 ? 'text-white' : 'text-zinc-600'}`}>{habit.streak}</span></div>)}
                </div>
                <div className="flex items-center gap-2">
                    {showDetailCount && (<div className="px-2 py-1 text-right"><span className="text-[10px] font-black text-white">{displayValue}</span><span className="text-[9px] font-bold text-zinc-500"> / {dailyGoal} {hasStructure ? 'micro' : (habit.unit === 'minutes' ? 'min' : (habit.unit === 'times' ? '' : habit.unit))}</span></div>)}
                    
                    {isQuit && quitDuration && (
                        <div className="flex flex-col items-end mr-1">
                            <span className="text-[12px] font-black text-white leading-none tabular-nums">
                                {quitDuration.days}d {quitDuration.hours}h <span className="opacity-50">{quitDuration.minutes}m {quitDuration.seconds}s</span>
                            </span>
                            <span className="text-[9px] font-bold text-zinc-500">Quit Time</span>
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        {isFlexible && !isWeight && !isQuit && (<div className="flex flex-col gap-[3px]">{Array.from({length: weeklyTarget}).map((_, idx) => { const reverseIdx = weeklyTarget - 1 - idx; const isFilled = reverseIdx < currentWeeklyCompletions; return (<div key={idx} className={`w-1 h-1 rounded-full transition-colors ${isFilled ? styles.bg.replace('/10', '') : 'bg-zinc-800'}`} />); })}</div>)}
                        
                        <button onClick={(e) => { e.stopPropagation(); hasStructure ? onClick() : onQuickAdd(e); }} className="relative w-10 h-10 flex items-center justify-center active:scale-90 transition-transform">
                            {!isWeight && !isQuit && (<svg viewBox="0 0 40 40" className="absolute inset-0 w-full h-full -rotate-90"><circle cx="20" cy="20" r={radius} fill="transparent" stroke="currentColor" strokeWidth="2.5" strokeDasharray="4 2" className="text-zinc-800" /><circle cx="20" cy="20" r={radius} fill="transparent" stroke={baseHex} strokeWidth="2.5" strokeDasharray={circumference} strokeDashoffset={dashOffset} strokeLinecap="round" className="transition-all duration-500 ease-out drop-shadow-[0_0_3px_rgba(255,255,255,0.3)]" /></svg>)}
                            
                            {isQuit ? (
                                <div className="w-10 h-10 rounded-[12px] bg-zinc-800 border border-white/10 text-red-400 flex items-center justify-center shadow-lg active:bg-red-500 active:text-white transition-colors">
                                    <RotateCcw size={16} strokeWidth={2.5} />
                                </div>
                            ) : (
                                <div className={`w-7 h-7 rounded-[8px] ${styles.accent} text-white flex items-center justify-center shadow-lg border border-white/10 z-10`}>
                                    {hasStructure ? <ListIcon size={14} strokeWidth={3} /> : <Plus size={14} strokeWidth={3} />}
                                </div>
                            )}
                        </button>
                    </div>
                </div>
            </div>
            {!isWeight && (<div className="w-full bg-zinc-900/60 rounded-[18px] p-1.5 flex justify-between items-center border border-white/5 shadow-inner" style={{ borderRadius: '18px' }}>
                {weekData.map((day, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-1 flex-1">
                        <div className={`w-full aspect-[4/3] max-w-[36px] rounded-[10px] flex items-center justify-center transition-all border ${getDynamicStatusClasses(day.status, day.isToday)} ${day.isToday ? 'ring-1 ring-white' : ''}`} style={{ borderRadius: '10px' }}>
                            {day.resetCount > 1 && <span className="text-[7px] font-black leading-none">{day.resetCount}x</span>}
                        </div>
                        <span className={`text-[8px] font-bold uppercase ${day.isToday ? 'text-white' : 'text-zinc-600'}`}>{day.dayName}</span>
                    </div>
                ))}
            </div>)}
          </motion.div>
      </motion.div>
    </div>
  );
};

// REPORT OVERLAY
type ReportTimeRange = 'week' | 'month' | 'year';
interface HabitReportOverlayProps { habits: Habit[]; onClose: () => void; dayEndTime: string; }
const HabitsReportOverlay: React.FC<HabitReportOverlayProps> = ({ habits, onClose, dayEndTime }) => {
    const [timeRange, setTimeRange] = useState<ReportTimeRange>('month');
    const [viewDate, setViewDate] = useState(new Date());
    const ranges = [{ id: 'week', label: 'Week', icon: LayoutGrid }, { id: 'month', label: 'Month', icon: CalendarDays }, { id: 'year', label: 'Year', icon: Grid }];
    
    const getRangeLabel = () => { 
        if (timeRange === 'week') { 
            const start = new Date(viewDate); 
            const day = start.getDay(); 
            const diff = start.getDate() - day + (day === 0 ? -6 : 1); 
            const monday = new Date(start.setDate(diff)); 
            const end = new Date(monday); 
            end.setDate(monday.getDate() + 6); 
            return `${monday.getDate()} ${monday.toLocaleString('default', { month: 'short' }).toUpperCase()} - ${end.getDate()} ${end.toLocaleString('default', { month: 'short' }).toUpperCase()}`; 
        } 
        if (timeRange === 'month') { 
            return viewDate.toLocaleString('default', { month: 'long', year: 'numeric' }).toUpperCase(); 
        } 
        return viewDate.getFullYear().toString(); 
    };

    const handlePrev = () => { 
        const d = new Date(viewDate); 
        if (timeRange === 'week') d.setDate(d.getDate() - 7); 
        if (timeRange === 'month') d.setMonth(d.getMonth() - 1); 
        if (timeRange === 'year') d.setFullYear(d.getFullYear() - 1); 
        setViewDate(d); 
    };

    const handleNext = () => { 
        const d = new Date(viewDate); 
        if (timeRange === 'week') d.setDate(d.getDate() + 7); 
        if (timeRange === 'month') d.setMonth(d.getMonth() + 1); 
        if (timeRange === 'year') d.setFullYear(d.getFullYear() + 1); 
        setViewDate(d); 
    };

    const handleToday = () => { setViewDate(new Date()); };

    const calculateDays = () => { 
        let start = new Date(viewDate); 
        let end = new Date(viewDate); 
        if (timeRange === 'week') { 
            const day = start.getDay(); 
            const diff = start.getDate() - day + (day === 0 ? -6 : 1); 
            start = new Date(start.setDate(diff)); 
            end = new Date(start); 
            end.setDate(start.getDate() + 6); 
        } else if (timeRange === 'month') { 
            start.setDate(1); 
            end = new Date(start); 
            end.setMonth(end.getMonth() + 1); 
            end.setDate(0); 
        } else { 
            start.setMonth(0, 1); 
            end.setMonth(11, 31); 
        } 
        const days = []; 
        const loop = new Date(start); 
        while (loop <= end) { 
            days.push(new Date(loop)); 
            loop.setDate(loop.getDate() + 1); 
        } 
        return days; 
    };

    const daysList = useMemo(calculateDays, [viewDate, timeRange]);
    
    const now = new Date();
    const [endH, endM] = (dayEndTime || "00:00").split(':').map(Number);
    if (now.getHours() < endH || (now.getHours() === endH && now.getMinutes() < endM)) {
        now.setDate(now.getDate() - 1);
    }
    const adjustedTodayKey = getLocalDateKey(now);

    const calculateCompletion = (habit: Habit) => { 
        let completed = 0; 
        let total = daysList.length; 
        daysList.forEach(day => { 
            const k = getLocalDateKey(day); 
            const valEntry = habit.history[k];
            let isComplete = false;
             if (typeof valEntry === 'number') {
                isComplete = valEntry >= habit.goal;
            } else if (valEntry && typeof valEntry === 'object') {
                 const struct = getDailyStructure(habit, day);
                 if (struct.length > 0) {
                    const { percentage } = getStructureProgress(habit, k, struct);
                    isComplete = percentage >= 100;
                 }
            }
            if(isComplete) completed++; 
        }); 
        return Math.round((completed / total) * 100); 
    };
    
    const scrollRef = useRef<HTMLDivElement>(null);
    useEffect(() => { if (scrollRef.current) { scrollRef.current.scrollTop = scrollRef.current.scrollHeight; } }, [habits, timeRange]);

    return (
        <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="fixed inset-0 z-[100] bg-black/95 flex flex-col">
             <div className="px-6 pt-16 flex items-center justify-between mb-6 flex-shrink-0">
                 <h2 className="text-2xl font-black uppercase tracking-tighter">Habits Report</h2>
                 <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 active:bg-white/10"><X size={20} /></button>
             </div>
            <div className="px-6 mb-4 flex-shrink-0">
                <div className="bg-zinc-900 rounded-[20px] p-1.5 flex border border-white/5">
                    {ranges.map(r => (
                        <button key={r.id} onClick={() => setTimeRange(r.id as ReportTimeRange)} className={`flex-1 py-3 rounded-[16px] flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${timeRange === r.id ? 'bg-white/10 text-white shadow-lg border border-white/5' : 'text-zinc-600'}`}>
                            <r.icon size={14} />{r.label}
                        </button>
                    ))}
                </div>
            </div>
            <div className="px-6 mb-8 flex-shrink-0">
                <div className="flex items-center gap-2">
                    <div className="flex-1 bg-zinc-900 rounded-[24px] px-6 flex items-center justify-center border border-white/5 h-14">
                        <span className="font-black text-sm uppercase tracking-wider text-zinc-300">{getRangeLabel()}</span>
                    </div>
                    <div className="bg-zinc-900 rounded-[24px] p-1 flex items-center border border-white/5 h-14">
                        <button onClick={handlePrev} className="w-12 h-full rounded-[18px] flex items-center justify-center text-zinc-400 active:scale-90 transition-transform"><ChevronLeft size={20} /></button>
                        <button onClick={handleToday} className="px-5 h-10 rounded-[18px] bg-white text-black font-black text-[10px] uppercase tracking-widest active:scale-95 transition-transform flex items-center shadow-lg">Today</button>
                        <button onClick={handleNext} className="w-12 h-full rounded-[18px] flex items-center justify-center text-zinc-400 active:scale-90 transition-transform"><ChevronRight size={20} /></button>
                    </div>
                </div>
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar px-6 relative z-0">
                <div className="min-h-full flex flex-col justify-end pb-32">
                    <div className="grid grid-cols-1 gap-4">
                        {habits.map(habit => { 
                            const completion = calculateCompletion(habit); 
                            const styles = getColorClasses(habit.color); 
                            const config = getHabitConfig(habit); 
                            const isFlexible = config.type === 'days_per'; 
                            const weeklyTarget = isFlexible ? config.daysPerWeek : 7; 
                            
                            return (
                                <div key={habit.id} className={`bg-zinc-900 rounded-[32px] p-5 border ${styles.border}`}>
                                    <div className="flex items-center justify-between mb-5">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-sm font-black uppercase text-white tracking-wide">{habit.name}</h3>
                                        </div>
                                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/5`}>
                                            <div className={`w-2 h-2 rounded-full ${styles.accent}`} />
                                            <span className="text-[10px] font-black text-zinc-400">{completion}%</span>
                                        </div>
                                    </div>
                                    <div className={`grid gap-1.5 w-full ${timeRange === 'week' ? 'grid-cols-7' : timeRange === 'month' ? 'grid-cols-7' : 'grid-cols-12'}`}>
                                        {daysList.map((day, idx) => { 
                                            const k = getLocalDateKey(day); 
                                            const valEntry = habit.history[k];
                                            const weeklyCompletions = getWeeklyCompletions(habit, day); 
                                            const isWeeklyMet = weeklyCompletions >= weeklyTarget; 
                                            const useGreen = !isFlexible || isWeeklyMet; 
                                            const isPast = k < adjustedTodayKey; 
                                            
                                            let isComplete = false; 
                                            let isSkip = false; 
                                            let isPartial = false;
                                            
                                            if (typeof valEntry === 'number') { 
                                                isSkip = valEntry === -1; 
                                                isComplete = valEntry >= habit.goal; 
                                                isPartial = valEntry > 0 && !isComplete; 
                                            } else if (valEntry && typeof valEntry === 'object') { 
                                                const s = getDailyStructure(habit, day); 
                                                if (s.length) { 
                                                    const p = getStructureProgress(habit, k, s).percentage; 
                                                    isComplete = p >= 100; 
                                                    isPartial = p > 0 && !isComplete; 
                                                } 
                                            }
                                            
                                            let status: 'completed' | 'skipped' | 'failed' | 'partial' | 'empty' = 'empty'; 
                                            if (isSkip) status = 'skipped'; 
                                            else if (isComplete) status = 'completed'; 
                                            else if (isPartial) status = 'partial'; 
                                            else if (isPast) status = 'failed'; 
                                            else status = 'empty'; 
                                            
                                            if (timeRange === 'year') { 
                                                let bgClass = 'bg-white/5'; 
                                                if (status === 'completed') bgClass = useGreen ? 'bg-emerald-500/20' : `${styles.soft}`; 
                                                if (status === 'failed') bgClass = 'bg-red-500/20'; 
                                                if (status === 'skipped') bgClass = 'bg-orange-500/20'; 
                                                if (status === 'partial') bgClass = 'bg-zinc-700'; 
                                                return <div key={idx} className={`aspect-square rounded-full ${bgClass}`} />; 
                                            } 
                                            
                                            let classes = 'bg-white/5 border-transparent text-zinc-600'; 
                                            if (status === 'completed') { 
                                                if (useGreen) { classes = 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'; } 
                                                else { classes = `${styles.soft} border-${habit.color}-500/30 ${styles.text}`; } 
                                            } else if (status === 'skipped') classes = 'bg-orange-500/10 border-orange-500/20 text-orange-400'; 
                                            else if (status === 'failed') classes = 'bg-red-500/20 border-red-500/30 text-red-400'; 
                                            else if (status === 'partial') classes = `bg-${habit.color}-500/20 border-${habit.color}-500/30 text-${habit.color}-400`; 
                                            
                                            return (<div key={idx} className={`aspect-square rounded-[8px] transition-all border ${classes}`}></div>); 
                                        })}
                                    </div>
                                </div>
                            ); 
                        })}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// MODALS
interface QuickTimerModalProps { habit: Habit; onClose: () => void; onSave: (val: number) => void; }
const QuickTimerModal: React.FC<QuickTimerModalProps> = ({ habit, onClose, onSave }) => {
    const styles = getColorClasses(habit.color);
    const [timerMode, setTimerMode] = useState<'stopwatch' | 'countdown'>(habit.timerDefault || 'stopwatch');
    const [timerRunning, setTimerRunning] = useState(false);
    const [timerSeconds, setTimerSeconds] = useState(0);
    const [initialCountdown, setInitialCountdown] = useState(habit.timerDuration ? habit.timerDuration * 60 : (habit.unit === 'minutes' ? habit.goal * 60 : 15 * 60));
    const intervalRef = useRef<number | null>(null);

    useEffect(() => { setTimerRunning(false); if (timerMode === 'stopwatch') { setTimerSeconds(0); } else { const defaultSecs = habit.timerDuration ? habit.timerDuration * 60 : (habit.unit === 'minutes' ? habit.goal * 60 : 15 * 60); setInitialCountdown(defaultSecs); setTimerSeconds(defaultSecs); } }, [timerMode, habit.goal, habit.unit, habit.timerDuration]);
    useEffect(() => { if (timerRunning) { intervalRef.current = window.setInterval(() => { if (timerMode === 'stopwatch') { setTimerSeconds(s => s + 1); } else { setTimerSeconds(s => { if (s <= 1) { setTimerRunning(false); return 0; } return s - 1; }); } }, 1000); } else if (intervalRef.current) { window.clearInterval(intervalRef.current); } return () => { if (intervalRef.current) window.clearInterval(intervalRef.current); }; }, [timerRunning, timerMode]);
    
    const handleSave = () => { let secondsToLog = 0; if (timerMode === 'stopwatch') { secondsToLog = timerSeconds; } else { secondsToLog = initialCountdown - timerSeconds; } if (secondsToLog > 0) { const valToAdd = habit.unit === 'minutes' ? Math.ceil(secondsToLog / 60) : 1; onSave(valToAdd); } onClose(); };
    
    return (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-6" onClick={onClose}><motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-sm bg-[#121212] border border-white/10 rounded-[36px] p-6 shadow-2xl overflow-hidden relative"><div className="flex justify-between items-center mb-6"><div className="flex items-center gap-3"><div className={`p-2 rounded-full bg-zinc-900 border ${styles.border} ${styles.text}`}>{habit.timeOfDay === 'morning' ? <Sun size={18} /> : habit.timeOfDay === 'evening' ? <Moon size={18} /> : <Zap size={18} />}</div><span className="text-lg font-black uppercase tracking-tighter text-white">{habit.name}</span></div><button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 active:bg-white/10"><X size={18} /></button></div><div className="flex flex-col items-center justify-center w-full min-h-0 mb-6"><div className="text-4xl font-black font-mono tracking-tighter tabular-nums text-white w-32 text-center mb-4">{Math.floor(timerSeconds / 60).toString().padStart(2, '0')}:{Math.floor(timerSeconds % 60).toString().padStart(2, '0')}</div><button onClick={() => setTimerRunning(!timerRunning)} className={`h-14 w-28 rounded-full flex items-center justify-center ${timerRunning ? 'bg-orange-500' : 'bg-emerald-500'} text-white shadow-[0_0_20px_rgba(16,185,129,0.2)] active:scale-95 transition-transform`}>{timerRunning ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" />}</button></div><div className="flex gap-3"><button onClick={onClose} className="flex-1 h-12 rounded-[20px] bg-zinc-900 border border-white/10 text-[10px] font-black uppercase tracking-widest text-zinc-400">Cancel</button><button onClick={handleSave} className="flex-1 h-12 rounded-[20px] bg-white text-black text-[10px] font-black uppercase tracking-widest shadow-lg">Save</button></div></motion.div></motion.div>);
};

const WeightLogModal: React.FC<{ habit: Habit, onClose: () => void, onSave: (val: number) => void, currentDate: Date }> = ({ habit, onClose, onSave, currentDate }) => {
    const styles = getColorClasses(habit.color); const dateKey = getLocalDateKey(currentDate); const val = habit.history[dateKey]; const [weight, setWeight] = useState(val && typeof val === 'number' ? String(val) : '');
    return (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[130] bg-black/80 backdrop-blur-md flex items-center justify-center p-6" onClick={onClose}><motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-sm bg-[#121212] border border-white/10 rounded-[36px] p-6 shadow-2xl overflow-hidden relative"><div className="flex justify-between items-center mb-6"><div className="flex items-center gap-3"><div className={`p-2 rounded-full bg-zinc-900 border ${styles.border} ${styles.text}`}><Scale size={18} /></div><span className="text-lg font-black uppercase tracking-tighter text-white">{habit.name}</span></div><button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 active:bg-white/10"><X size={18} /></button></div><div className="flex flex-col items-center justify-center w-full min-h-0 mb-8 pt-4"><div className="flex items-baseline gap-2"><input type="number" step="0.1" autoFocus value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="0.0" className="bg-transparent text-right text-6xl font-black text-white focus:outline-none w-40 placeholder:text-zinc-800" /><span className="text-xl font-bold text-zinc-500 uppercase">{habit.unit}</span></div><p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest mt-2">Log Weight for {currentDate.toLocaleDateString()}</p></div><div className="flex gap-3"><button onClick={onClose} className="flex-1 h-12 rounded-[20px] bg-zinc-900 border border-white/10 text-[10px] font-black uppercase tracking-widest text-zinc-400">Cancel</button><button onClick={() => { const v = parseFloat(weight); if (!isNaN(v)) onSave(v); }} className="flex-1 h-12 rounded-[20px] bg-white text-black text-[10px] font-black uppercase tracking-widest shadow-lg">Save</button></div></motion.div></motion.div>);
};

const SkipConfirmModal = ({ habit, onConfirm, onCancel }: { habit: Habit, onConfirm: () => void, onCancel: () => void }) => (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6" onClick={onCancel}><motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-[#121212] rounded-[32px] p-6 w-full max-w-xs border border-white/10 shadow-2xl text-center"><div className="w-16 h-16 rounded-full bg-zinc-800 mx-auto flex items-center justify-center mb-4 text-orange-400 border border-white/5"><AlertCircle size={32} /></div><h3 className="text-xl font-bold mb-2 text-white">Salta Abitudine</h3><p className="text-zinc-500 text-xs mb-6 px-2 leading-relaxed">Vuoi davvero saltare <span className="text-white font-bold">"{habit.name}"</span> per oggi?</p><div className="flex w-full gap-3"><button onClick={onCancel} className="flex-1 py-4 rounded-[20px] bg-white/5 font-bold text-zinc-400 active:bg-white/10 text-xs uppercase tracking-widest">No</button><button onClick={onConfirm} className="flex-1 py-4 rounded-[20px] bg-orange-500 font-bold text-white shadow-lg active:scale-95 transition-transform text-xs uppercase tracking-widest">Salta</button></div></motion.div></motion.div>);

const DeleteConfirmModal = ({ habit, onConfirm, onCancel }: { habit: Habit, onConfirm: () => void, onCancel: () => void }) => (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6" onClick={onCancel}><motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-[#121212] rounded-[32px] p-6 w-full max-w-xs border border-white/10 shadow-2xl text-center"><div className="w-16 h-16 rounded-full bg-zinc-800 mx-auto flex items-center justify-center mb-4 text-red-500 border border-white/5"><Trash2 size={32} /></div><h3 className="text-xl font-bold mb-2 text-white">Elimina Abitudine</h3><p className="text-zinc-500 text-xs mb-6 px-2 leading-relaxed">Vuoi davvero eliminare <span className="text-white font-bold">"{habit.name}"</span>? Questa azione è irreversibile.</p><div className="flex w-full gap-3"><button onClick={onCancel} className="flex-1 py-4 rounded-[20px] bg-white/5 font-bold text-zinc-400 active:bg-white/10 text-xs uppercase tracking-widest">Annulla</button><button onClick={onConfirm} className="flex-1 py-4 rounded-[20px] bg-red-600 font-bold text-white shadow-lg active:scale-95 transition-transform text-xs uppercase tracking-widest">Elimina</button></div></motion.div></motion.div>);

// DETAIL OVERLAY
interface HabitDetailOverlayProps {
  habit: Habit;
  onClose: () => void;
  state: AppState;
  setState: (state: AppState) => void;
  currentDate: Date;
  initialTab?: 'entries' | 'check' | 'timer';
  onAddHabit?: () => void;
  dayEndTime: string;
}

const HabitDetailOverlay: React.FC<HabitDetailOverlayProps> = ({ habit, onClose, state, setState, currentDate, initialTab = 'check', onAddHabit, dayEndTime }) => {
  const styles = getColorClasses(habit.color);
  const [activeTab, setActiveTab] = useState<'entries' | 'check' | 'timer'>(initialTab);
  const dateKey = getLocalDateKey(currentDate);
  const historyEntry = habit.history[dateKey];
  
  let currentValue = 0;
  if (typeof historyEntry === 'number') currentValue = historyEntry;
  else if (historyEntry && typeof historyEntry === 'object' && 'completedIds' in historyEntry) {
     currentValue = 0; 
  }

  const dailyStructure = getDailyStructure(habit, currentDate);
  const hasStructure = dailyStructure.length > 0;
  
  const { current: structCurrent, total: structTotal, percentage: structPercentage } = getStructureProgress(habit, dateKey, dailyStructure);

  const config = getHabitConfig(habit);
  const isFlexible = config.type === 'days_per';
  const weeklyTarget = isFlexible ? config.daysPerWeek : 7;
  const currentWeeklyCompletions = getWeeklyCompletions(habit, currentDate);
  const isWeeklyTargetMet = currentWeeklyCompletions >= weeklyTarget;
  const isWeight = habit.unit === 'kg' || habit.unit === 'lbs';

  const historyEntries = useMemo(() => {
    return Object.entries(habit.history)
        .map(([k, v]) => {
             let val = 0;
             if (typeof v === 'number') {
                 val = v;
             } else if (v && typeof v === 'object' && 'completedIds' in v) {
                 const c = (v as { completedIds: string[] }).completedIds;
                 val = (c && c.length > 0) ? 1 : 0;
             }
             return { date: k, value: val };
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [habit.history]);

  const lastRecordedWeight = historyEntries.length > 0 ? historyEntries[historyEntries.length - 1].value : 0;

  const [timerMode, setTimerMode] = useState<'stopwatch' | 'countdown'>(habit.timerDefault || 'stopwatch');
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [initialCountdown, setInitialCountdown] = useState(habit.timerDuration ? habit.timerDuration * 60 : (habit.unit === 'minutes' ? habit.goal * 60 : 15 * 60));
  const intervalRef = useRef<number | null>(null);

  useEffect(() => { setActiveTab(initialTab); }, [initialTab]);
  useEffect(() => { setTimerRunning(false); if(timerMode === 'stopwatch') setTimerSeconds(0); else { const d = habit.timerDuration ? habit.timerDuration * 60 : (habit.unit === 'minutes' ? habit.goal*60 : 15*60); setInitialCountdown(d); setTimerSeconds(d); } }, [timerMode, habit.goal, habit.unit, habit.timerDuration, activeTab]); 
  useEffect(() => { if(timerRunning) { intervalRef.current = window.setInterval(() => { if(timerMode === 'stopwatch') setTimerSeconds(s => s + 1); else setTimerSeconds(s => { if(s<=1){ setTimerRunning(false); return 0;} return s-1; }); }, 1000); } else if (intervalRef.current) window.clearInterval(intervalRef.current); return () => { if(intervalRef.current) window.clearInterval(intervalRef.current); }; }, [timerRunning, timerMode]);

  const updateValue = (delta: number) => {
    const baseVal = currentValue === -1 ? 0 : currentValue;
    const newVal = Math.max(0, baseVal + delta);
    const newHistory = { ...habit.history, [dateKey]: newVal };
    const updatedHabits = state.habits.map(h => h.id === habit.id ? { ...h, history: newHistory } : h);
    setState({ ...state, habits: updatedHabits });
  };

  const handleSkip = () => {
    const newVal = currentValue === -1 ? 0 : -1;
    const newHistory = { ...habit.history, [dateKey]: newVal };
    const updatedHabits = state.habits.map(h => h.id === habit.id ? { ...h, history: newHistory } : h);
    setState({ ...state, habits: updatedHabits });
  };

  const handleTimerSave = () => {
    let secondsToLog = timerMode === 'stopwatch' ? timerSeconds : initialCountdown - timerSeconds;
    if (secondsToLog > 0) {
        const valToAdd = habit.unit === 'minutes' ? Math.ceil(secondsToLog / 60) : 1;
        updateValue(valToAdd);
    }
    setTimerRunning(false);
    if (timerMode === 'stopwatch') setTimerSeconds(0); else setTimerSeconds(initialCountdown);
  };
  
  const toggleMicroHabit = (microId: string) => {
      const entry = habit.history[dateKey];
      let currentCompletedIds: string[] = [];
      
      if (entry && typeof entry === 'object' && 'completedIds' in entry) {
          currentCompletedIds = [...(entry as { completedIds: string[] }).completedIds];
      }

      if (currentCompletedIds.includes(microId)) {
          currentCompletedIds = currentCompletedIds.filter(id => id !== microId);
      } else {
          currentCompletedIds.push(microId);
      }
      
      const newHistory = { ...habit.history, [dateKey]: { completedIds: currentCompletedIds } };
      const updatedHabits = state.habits.map(h => h.id === habit.id ? { ...h, history: newHistory } : h);
      setState({ ...state, habits: updatedHabits });
  };

  const renderChecklist = (items: MicroHabit[], level = 0) => {
      const entry = habit.history[dateKey];
      let completedIds: string[] = [];
      if (entry && typeof entry === 'object' && 'completedIds' in entry) {
          completedIds = (entry as { completedIds: string[] }).completedIds;
      }

      return (
          <div className={`flex flex-col gap-2 w-full ${level > 0 ? 'ml-6 border-l border-white/10 pl-3 mt-1' : ''}`}>
              {items.map(item => {
                  const isChecked = completedIds.includes(item.id);
                  return (
                      <div key={item.id} className="flex flex-col">
                          <button 
                            onClick={() => toggleMicroHabit(item.id)}
                            className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${isChecked ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-white/5 border-white/5 active:bg-white/10'}`}
                          >
                              <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${isChecked ? 'bg-emerald-500 border-emerald-500 text-black' : 'border-zinc-500'}`}>
                                  {isChecked && <Check size={14} strokeWidth={4} />}
                              </div>
                              <span className={`text-sm font-bold text-left flex-1 ${isChecked ? 'text-emerald-100 line-through opacity-50' : 'text-white'}`}>{item.title}</span>
                          </button>
                          {item.subHabits && item.subHabits.length > 0 && renderChecklist(item.subHabits, level + 1)}
                      </div>
                  );
              })}
          </div>
      );
  };

  const now = new Date();
  const [endH, endM] = (dayEndTime || "00:00").split(':').map(Number);
  if (now.getHours() < endH || (now.getHours() === endH && now.getMinutes() < endM)) {
      now.setDate(now.getDate() - 1);
  }
  const adjustedTodayKey = getLocalDateKey(now);

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-6">
        <motion.div className="absolute inset-0 bg-black/80 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
        <motion.div layoutId={`habit-card-${habit.id}`} initial={{ borderRadius: 28 }} animate={{ borderRadius: 48 }} exit={{ borderRadius: 28 }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="w-full max-w-sm h-[85vh] bg-[#0a0a0a] overflow-hidden relative shadow-2xl border border-white/10 flex flex-col z-10" onClick={(e) => e.stopPropagation()}>
             <div className="w-full h-full flex flex-col relative">
                <div className="absolute top-[-25%] left-[-15%] w-[90%] h-[70%] bg-purple-900/15 blur-[140px] rounded-full pointer-events-none z-0 mix-blend-screen" />
                <div className="pt-8 px-6 pb-2 flex items-center justify-end z-10 relative">
                    <button onClick={onClose} className="w-12 h-12 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-zinc-400 active:bg-white/20 active:text-white transition-colors"><X size={22} /></button>
                </div>
                
                <div className="flex-1 flex flex-col relative overflow-hidden z-10">
                    <AnimatePresence mode="wait">
                         {activeTab === 'check' && (
                            <motion.div key="check" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="flex-1 w-full flex flex-col items-center justify-between pb-48 pt-4">
                                <div className="flex flex-col items-center flex-shrink-0 px-6 w-full">
                                    <h2 className="text-4xl font-black uppercase tracking-tighter text-center mb-3 leading-none text-white drop-shadow-md">{habit.name}</h2>
                                    {!isWeight && (
                                        <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full backdrop-blur-md border border-white/5 shadow-lg ${isWeeklyTargetMet ? 'bg-emerald-500/20 border-emerald-500/30' : 'bg-white/10'}`}>
                                            <span className={`text-[10px] font-bold uppercase tracking-widest ${isWeeklyTargetMet ? 'text-emerald-400' : 'text-zinc-400'}`}>Streak</span>
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${isWeeklyTargetMet ? 'text-white' : 'text-white'}`}>{habit.streak} {isFlexible ? 'Wks' : 'Days'}</span>
                                        </div>
                                    )}
                                </div>
                                
                                {hasStructure ? (
                                    <div className="flex-1 w-full flex flex-col min-h-0 py-4 px-6 overflow-hidden">
                                        <div className="mb-4 flex items-center justify-between">
                                            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Tasks Today</span>
                                            <span className="text-xs font-black text-white">{Math.round(structPercentage)}% Done</span>
                                        </div>
                                        <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden mb-6">
                                            <motion.div 
                                                initial={{ width: 0 }} 
                                                animate={{ width: `${structPercentage}%` }} 
                                                className={`h-full ${structPercentage >= 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                            />
                                        </div>
                                        <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
                                            {renderChecklist(dailyStructure)}
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                    <div className="flex-1 w-full flex items-center justify-center min-h-0 py-4">
                                        <div className="relative w-56 h-56 flex-shrink-0 flex items-center justify-center">
                                                {!isWeight && (
                                                    <svg className="w-full h-full rotate-[-90deg] drop-shadow-2xl">
                                                        <circle cx="50%" cy="50%" r="45%" className="stroke-zinc-900" strokeWidth="20" fill="none" />
                                                        <motion.circle 
                                                            initial={{ pathLength: 0 }} 
                                                            animate={{ pathLength: currentValue === -1 ? 0 : Math.min(1, currentValue / habit.goal) }}
                                                            transition={{ duration: 0.5, ease: "easeOut" }}
                                                            cx="50%" cy="50%" r="45%" 
                                                            className={`stroke-${(isFlexible && !isWeeklyTargetMet) ? habit.color : 'emerald'}-500`} 
                                                            strokeWidth="20" 
                                                            fill="none" 
                                                            strokeLinecap="round" 
                                                        />
                                                    </svg>
                                                )}
                                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                    <motion.div key={currentValue} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center">
                                                        <div className="flex items-baseline justify-center gap-2">
                                                            <span className="text-6xl font-black tracking-tighter text-white">{isWeight ? lastRecordedWeight : (currentValue === -1 ? '-' : currentValue)}</span>
                                                            <span className="text-3xl font-black text-blue-400 uppercase transform translate-y-[-4px]">{habit.unit}</span>
                                                        </div>
                                                        <div className="flex flex-col items-center mt-2">
                                                            <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold">{isWeight ? 'Current' : 'Goal'}</span>
                                                            <span className="text-sm font-black text-zinc-300">
                                                                {isWeight 
                                                                    ? (habit.goal > 0 && <span className="opacity-60">{habit.goal} {habit.unit}</span>) 
                                                                    : <>{habit.goal} <span className="text-[9px] opacity-60">{habit.unit}</span></>
                                                                }
                                                            </span>
                                                        </div>
                                                    </motion.div>
                                                </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-center gap-5 w-full px-6 flex-shrink-0">
                                            {!isWeight && <button onClick={() => updateValue(-1)} className="w-16 h-16 flex-shrink-0 rounded-[24px] bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-500 active:bg-white/5 active:scale-95 transition-all shadow-lg"><Minus size={24} strokeWidth={3} /></button>}
                                            {!isWeight && <button onClick={handleSkip} className={`w-16 h-16 flex-shrink-0 rounded-[24px] flex items-center justify-center shadow-lg active:scale-95 transition-all border ${currentValue === -1 ? 'bg-zinc-800 border-white/20 text-zinc-500' : 'bg-zinc-900 border-white/10 text-zinc-500 hover:text-white'}`}><ChevronsRight size={24} strokeWidth={2} /></button>}
                                            <button onClick={() => isWeight ? onAddHabit && onAddHabit() : updateValue(1)} className={`w-20 h-20 flex-shrink-0 rounded-[30px] ${styles.accent} text-white flex items-center justify-center shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] active:scale-95 transition-all ${styles.glow}`}><Plus size={32} strokeWidth={3} /></button>
                                    </div>
                                    </>
                                )}
                            </motion.div>
                         )}

                         {activeTab === 'entries' && (
                             <motion.div key="entries" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="flex-1 w-full h-full overflow-hidden relative">
                                <div className="absolute inset-0 overflow-y-auto no-scrollbar px-6 pt-4 pb-48">
                                    {isWeight ? (
                                        <>
                                            <div className="flex-shrink-0 flex flex-col items-center mb-6">
                                                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1">{habit.goal > 0 ? 'Target' : 'Current'}</span>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-4xl font-black text-white">{habit.goal > 0 ? habit.goal : lastRecordedWeight}</span>
                                                    <span className="text-xs font-bold text-zinc-500">{habit.unit}</span>
                                                </div>
                                            </div>
                                            <div className="w-full flex-shrink-0 mb-6 relative" style={{ height: '300px', width: '99%' }}>
                                                 <SimpleLineChart data={historyEntries} color={habit.color} unit={habit.unit} />
                                            </div>
                                            <div className="space-y-2 w-full">
                                                {historyEntries.slice().reverse().map((entry, idx) => (
                                                    <div key={idx} className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-[20px] border border-white/5">
                                                        <span className="text-xs font-bold text-zinc-400">{new Date(entry.date).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit' })}</span>
                                                        <div className="flex items-center gap-1"><span className="text-sm font-black text-white">{entry.value}</span><span className="text-[10px] font-bold text-zinc-600">{habit.unit}</span></div>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <h2 className="text-2xl font-black uppercase tracking-tighter mb-6 text-white text-center flex-shrink-0">Calendar</h2>
                                            <div className="bg-zinc-900/50 rounded-[24px] overflow-hidden w-full border border-white/5 flex-shrink-0">
                                                <div className="grid grid-cols-7 gap-[1px] bg-zinc-900/50">
                                                    {Array.from({length: 35}).map((_, i) => {
                                                        const today = new Date();
                                                        const d = new Date(today.getFullYear(), today.getMonth(), 1);
                                                        const startDay = d.getDay() === 0 ? 6 : d.getDay() - 1; 
                                                        const dayNum = i - startDay + 1;
                                                        const isValid = dayNum > 0 && dayNum <= 31; 
                                                        if (!isValid) return <div key={i} className="aspect-square bg-transparent" />;
                                                        const actualDate = new Date(today.getFullYear(), today.getMonth(), dayNum);
                                                        const k = getLocalDateKey(actualDate);
                                                        const valEntry = habit.history[k];
                                                        
                                                        let isDone = false;
                                                        let isSkipped = false;
                                                        let isPartial = false;
                                                        
                                                        if (typeof valEntry === 'number') {
                                                            isDone = valEntry >= habit.goal;
                                                            isSkipped = valEntry === -1;
                                                            isPartial = valEntry > 0 && valEntry < habit.goal;
                                                        } else if (valEntry && typeof valEntry === 'object') {
                                                            const s = getDailyStructure(habit, actualDate);
                                                            if (s.length) {
                                                                const p = getStructureProgress(habit, k, s).percentage;
                                                                isDone = p >= 100;
                                                                isPartial = p > 0 && !isDone;
                                                            }
                                                        }

                                                        const isFuture = dayNum > today.getDate();
                                                        const weeklyCompletions = getWeeklyCompletions(habit, actualDate);
                                                        const isWeeklyMet = weeklyCompletions >= weeklyTarget;
                                                        const useGreen = !isFlexible || isWeeklyMet;
                                                        const isPast = k < adjustedTodayKey;

                                                        let cellClass = 'bg-zinc-800/80 text-zinc-500';
                                                        if (isFuture) { cellClass = 'bg-zinc-900/30 text-zinc-700'; } 
                                                        else if (isSkipped) { cellClass = 'bg-orange-500/20 text-orange-400'; } 
                                                        else if (isPartial) { cellClass = `bg-${habit.color}-500/20 text-${habit.color}-400`; } 
                                                        else if (isDone) { if (useGreen) { cellClass = 'bg-emerald-500/30 text-emerald-400'; } else { cellClass = `bg-${habit.color}-500/30 text-${habit.color}-400`; } }
                                                        else if (isPast && !isDone) { cellClass = 'bg-red-500/20 text-red-400'; }

                                                        return (<div key={i} className={`aspect-square flex items-center justify-center text-[10px] font-bold ${cellClass}`}>{dayNum}</div>);
                                                    })}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                             </motion.div>
                         )}

                         {activeTab === 'timer' && !isWeight && (
                             <motion.div key="timer" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="flex-1 w-full flex flex-col items-center justify-start pt-24 px-6 h-full">
                                <div className="flex-shrink-0 flex flex-col items-center w-full mb-10">
                                    <div className="flex bg-zinc-800 p-1 rounded-2xl border border-white/5 w-full max-w-[200px]">
                                        <button onClick={() => setTimerMode('stopwatch')} className={`flex-1 py-2 rounded-xl flex items-center justify-center text-[9px] font-black uppercase tracking-widest transition-all ${timerMode === 'stopwatch' ? 'bg-white text-black shadow-lg' : 'text-zinc-500'}`}>Stopwatch</button>
                                        <button onClick={() => setTimerMode('countdown')} className={`flex-1 py-2 rounded-xl flex items-center justify-center text-[9px] font-black uppercase tracking-widest transition-all ${timerMode === 'countdown' ? 'bg-white text-black shadow-lg' : 'text-zinc-500'}`}>Timer</button>
                                    </div>
                                </div>
                                <div className="flex-1 w-full flex items-center justify-center min-h-0">
                                    <div className="w-56 h-56 rounded-full border-4 border-zinc-800 flex items-center justify-center relative flex-shrink-0 bg-zinc-900">
                                        <div className="absolute inset-0 rounded-full border-4 border-white/10" />
                                        {timerRunning && (<motion.div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-b-transparent border-l-transparent" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} />)}
                                        <div className="text-5xl font-black font-mono tracking-tighter tabular-nums text-white">{Math.floor(timerSeconds / 60).toString().padStart(2, '0')}:{Math.floor(timerSeconds % 60).toString().padStart(2, '0')}</div>
                                    </div>
                                </div>
                                <div className="flex-shrink-0 flex items-center justify-center gap-6 w-full mb-20">
                                    <button onClick={() => { setTimerRunning(false); if(timerMode==='stopwatch') setTimerSeconds(0); else setTimerSeconds(initialCountdown); }} className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 active:scale-95 transition-transform border border-white/5"><RotateCcw size={20}/></button>
                                    <button onClick={() => setTimerRunning(!timerRunning)} className={`w-20 h-20 rounded-[30px] flex items-center justify-center ${timerRunning ? 'bg-orange-500' : 'bg-emerald-500'} text-white shadow-xl active:scale-95 transition-transform`}>{timerRunning ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" />}</button>
                                    <button onClick={handleTimerSave} className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center active:scale-95 transition-transform shadow-lg"><Check size={24}/></button>
                                </div>
                             </motion.div>
                         )}
                    </AnimatePresence>
                </div>
                
                <div className="absolute bottom-6 left-0 right-0 px-6 z-40 flex justify-center">
                    <div className="p-2 rounded-[32px] flex w-full max-w-sm bg-zinc-900/80 backdrop-blur-md border border-white/10 shadow-2xl">
                        {[ { id: 'entries', label: isWeight ? 'Report' : 'Calendar', icon: isWeight ? TrendingUp : Calendar }, { id: 'check', label: 'Check', icon: CheckSquare }, !isWeight ? { id: 'timer', label: 'Timer', icon: Clock } : null ].filter(Boolean).map((tab: any) => { const isActive = activeTab === tab.id; return ( <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex-1 py-4 rounded-[24px] flex flex-col items-center justify-center gap-1.5 transition-all duration-300 ${isActive ? 'bg-white text-black shadow-lg scale-100' : 'text-zinc-500 hover:bg-white/5 scale-95'}`}><tab.icon size={20} strokeWidth={isActive ? 2.5 : 2} /><span className="text-[9px] font-black uppercase tracking-widest">{tab.label}</span></button>); })}
                    </div>
                </div>
             </div>
        </motion.div>
    </motion.div>
  );
};

const HabitsView: React.FC<Props> = ({ state, setState, onDetailOpen, onAddHabit, onEditHabit }) => {
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [skipHabit, setSkipHabit] = useState<Habit | null>(null);
  const [deleteHabit, setDeleteHabit] = useState<Habit | null>(null);
  const [quickTimerHabit, setQuickTimerHabit] = useState<Habit | null>(null);
  const [weightLogHabit, setWeightLogHabit] = useState<Habit | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  const selectedHabit = state.habits.find(h => h.id === selectedHabitId);

  useEffect(() => {
    if (onDetailOpen) onDetailOpen(!!selectedHabitId);
  }, [selectedHabitId, onDetailOpen]);

  const changeDate = (days: number) => {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + days);
      setCurrentDate(newDate);
  };

  const updateHabitValue = (habit: Habit, delta: number) => {
    const dateKey = getLocalDateKey(currentDate);
    const entry = habit.history[dateKey];
    
    let currentVal = 0;
    if (typeof entry === 'number') {
        currentVal = entry === -1 ? 0 : entry;
    }
    
    const newVal = Math.max(0, currentVal + delta);
    const newHistory = { ...habit.history, [dateKey]: newVal };
    const updatedHabits = state.habits.map(h => h.id === habit.id ? { ...h, history: newHistory } : h);
    setState({ ...state, habits: updatedHabits });
  };

  const updateWeightValue = (habit: Habit, value: number) => {
      const dateKey = getLocalDateKey(currentDate);
      const newHistory = { ...habit.history, [dateKey]: value };
      const updatedHabits = state.habits.map(h => h.id === habit.id ? { ...h, history: newHistory } : h);
      setState({ ...state, habits: updatedHabits });
  };
  
  const handleSkipConfirm = () => {
      if (skipHabit) {
          const dateKey = getLocalDateKey(currentDate);
          const newHistory = { ...skipHabit.history, [dateKey]: -1 };
          const updatedHabits = state.habits.map(h => h.id === skipHabit.id ? { ...h, history: newHistory } : h);
          setState({ ...state, habits: updatedHabits });
          setSkipHabit(null);
      }
  };

  const handleDeleteConfirm = () => {
      if (deleteHabit) {
          const updatedHabits = state.habits.filter(h => h.id !== deleteHabit.id);
          setState({ ...state, habits: updatedHabits });
          setDeleteHabit(null);
      }
  };

  const sortedHabits = [...state.habits].sort((a, b) => {
      const times = { morning: 0, any: 1, evening: 2 };
      return times[a.timeOfDay] - times[b.timeOfDay];
  });

  return (
    <div className="flex flex-col h-full w-full">
        <header className="flex-shrink-0 px-6 pt-16 pb-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-4xl font-black uppercase tracking-tighter">Habits</h1>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] mt-1">Consistency is Key</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => setShowReport(true)} className="w-12 h-12 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-400 active:bg-white/10 active:text-white transition-colors"><BarChart2 size={20} /></button>
                    <button onClick={onAddHabit} className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-lg active:scale-90 transition-transform"><Plus size={24} /></button>
                </div>
            </div>

            <div className="flex items-center justify-between bg-zinc-900/50 rounded-[20px] p-1 border border-white/5">
                <button onClick={() => changeDate(-1)} className="w-12 h-12 flex items-center justify-center text-zinc-400 active:text-white active:bg-white/5 rounded-[16px] transition-colors"><ChevronLeft size={20}/></button>
                <div className="flex flex-col items-center">
                    <span className="text-sm font-black uppercase tracking-widest text-white">{currentDate.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                    {currentDate.toDateString() === new Date().toDateString() ? (<span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">Today</span>) : (<span className="text-[9px] font-bold text-zinc-600 uppercase tracking-wider">{currentDate.getFullYear()}</span>)}
                </div>
                <button onClick={() => changeDate(1)} className="w-12 h-12 flex items-center justify-center text-zinc-400 active:text-white active:bg-white/5 rounded-[16px] transition-colors"><ChevronRight size={20}/></button>
            </div>
        </header>

        <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-32">
             <div className="space-y-4">
                 {sortedHabits.length > 0 ? sortedHabits.map(habit => (
                     <HabitCard 
                        key={habit.id} 
                        habit={habit} 
                        currentDate={currentDate}
                        dayEndTime={state.dayEndTime || "00:00"}
                        onClick={() => setSelectedHabitId(habit.id)}
                        onQuickAdd={(e) => { if (habit.unit === 'kg' || habit.unit === 'lbs') { setWeightLogHabit(habit); } else { updateHabitValue(habit, 1); } }}
                        onSkip={(e) => setSkipHabit(habit)}
                        onTimer={(e) => setQuickTimerHabit(habit)}
                        onDeleteRequest={() => setDeleteHabit(habit)}
                        onEditRequest={() => onEditHabit && onEditHabit(habit)}
                     />
                 )) : (
                     <div className="flex flex-col items-center justify-center py-20 opacity-30">
                         <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4"><CheckSquare size={32} /></div>
                         <p className="text-xs font-black uppercase tracking-widest">No Habits Yet</p>
                     </div>
                 )}
             </div>
        </div>

        <AnimatePresence>
            {showReport && (<HabitsReportOverlay habits={state.habits} onClose={() => setShowReport(false)} dayEndTime={state.dayEndTime || "00:00"} />)}
            {selectedHabit && (<HabitDetailOverlay habit={selectedHabit} onClose={() => setSelectedHabitId(null)} state={state} setState={setState} currentDate={currentDate} onAddHabit={() => setWeightLogHabit(selectedHabit)} dayEndTime={state.dayEndTime || "00:00"} />)}
            {skipHabit && (<SkipConfirmModal habit={skipHabit} onConfirm={handleSkipConfirm} onCancel={() => setSkipHabit(null)} />)}
            {deleteHabit && (<DeleteConfirmModal habit={deleteHabit} onConfirm={handleDeleteConfirm} onCancel={() => setDeleteHabit(null)} />)}
            {quickTimerHabit && (<QuickTimerModal habit={quickTimerHabit} onClose={() => setQuickTimerHabit(null)} onSave={(val) => updateHabitValue(quickTimerHabit, val)} />)}
            {weightLogHabit && (<WeightLogModal habit={weightLogHabit} currentDate={currentDate} onClose={() => setWeightLogHabit(null)} onSave={(val) => { updateWeightValue(weightLogHabit, val); setWeightLogHabit(null); }} />)}
        </AnimatePresence>
    </div>
  );
};

export default HabitsView;