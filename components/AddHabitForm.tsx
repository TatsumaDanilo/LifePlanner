
// ... existing imports ...
import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, ChevronRight, Bell, Calendar, ChevronLeft, Check, Scale, Hash, Ban, ChevronDown, Clock, Repeat, Minus, Plus, Save, X, RotateCcw, Timer, Hourglass, Trash2, ChevronUp, CornerDownRight, List, Link } from 'lucide-react';
import { Habit, MicroHabit } from '../types';

interface Props {
  type: string;
  initialData?: Habit;
  onBack: () => void;
  onSave: (habitData: Partial<Habit>) => void;
}

const COLORS = [
  { id: 'zinc', bg: 'bg-zinc-500' },
  { id: 'red', bg: 'bg-red-500' },
  { id: 'orange', bg: 'bg-orange-500' },
  { id: 'amber', bg: 'bg-amber-500' },
  { id: 'emerald', bg: 'bg-emerald-500' },
  { id: 'teal', bg: 'bg-teal-500' },
  { id: 'cyan', bg: 'bg-cyan-500' },
  { id: 'blue', bg: 'bg-blue-500' },
  { id: 'indigo', bg: 'bg-indigo-500' },
  { id: 'violet', bg: 'bg-violet-500' },
  { id: 'purple', bg: 'bg-purple-500' },
  { id: 'fuchsia', bg: 'bg-fuchsia-500' },
  { id: 'pink', bg: 'bg-pink-500' },
  { id: 'rose', bg: 'bg-rose-500' },
];

const MILESTONES = [
  { id: '1d', label: '1 day' },
  { id: '2d', label: '2 days' },
  { id: '3d', label: '3 days' },
  { id: '1w', label: '1 week' },
  { id: '2w', label: '2 weeks' },
  { id: '3w', label: '3 weeks' },
  { id: '1m', label: '1 month' },
  { id: '3m', label: '3 months' },
];

const HABIT_UNITS = ['time', 'minute', 'hour'];
const PERIODS = ['Day', 'Week', 'Month', 'Year'];
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const AddHabitForm: React.FC<Props> = ({ type, initialData, onBack, onSave }) => {
  // Navigation State
  const [step, setStep] = useState(1);

  // --- STEP 1 STATE ---
  const [name, setName] = useState('');
  const [color, setColor] = useState('zinc');
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  // Weight Specific
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg'); 
  const [goalDirection, setGoalDirection] = useState('lose');
  const [targetWeightEnabled, setTargetWeightEnabled] = useState(false);
  const [targetWeight, setTargetWeight] = useState('80.0');

  // Quit Specific
  const [quitDate, setQuitDate] = useState(new Date().toISOString().split('T')[0]);
  const [quitTime, setQuitTime] = useState(new Date().toTimeString().slice(0, 5));

  // Count/Regular Specific
  const [countValue, setCountValue] = useState(1);
  const [countUnit, setCountUnit] = useState('time');
  const [countPeriod, setCountPeriod] = useState('Day');
  const [isUnitPickerOpen, setIsUnitPickerOpen] = useState(false);
  const [isPeriodPickerOpen, setIsPeriodPickerOpen] = useState(false);
  
  // Custom Unit Modal
  const [isCustomUnitModalOpen, setIsCustomUnitModalOpen] = useState(false);
  const [customSingular, setCustomSingular] = useState('');
  const [customPlural, setCustomPlural] = useState('');
  
  // Frequency
  const [frequencyType, setFrequencyType] = useState<'every' | 'specific' | 'days_per'>('every');
  const [selectedDays, setSelectedDays] = useState<number[]>([0,1,2,3,4,5,6]);
  const [daysPerWeek, setDaysPerWeek] = useState(3);

  // --- STEP 2 STATE ---
  const [hasReminder, setHasReminder] = useState(false);
  const [reminderDays, setReminderDays] = useState<number[]>([0,1,2,3,4,5,6]); // Default all days
  const [currentReminderTime, setCurrentReminderTime] = useState('09:00');
  const [reminderTimes, setReminderTimes] = useState<string[]>([]); // List of added times
  const [description, setDescription] = useState('');
  
  // Increment Settings
  const [incrementAmount, setIncrementAmount] = useState<number | string>(1);
  const [isIncrementModalOpen, setIsIncrementModalOpen] = useState(false);
  
  // Timer Settings
  const [timerDefault, setTimerDefault] = useState<'stopwatch' | 'countdown'>('stopwatch');
  const [countdownDuration, setCountdownDuration] = useState(15); // minutes
  const [isTimerSettingsModalOpen, setIsTimerSettingsModalOpen] = useState(false);

  // Micro-Habits (Checklist) Settings
  const [structure, setStructure] = useState<MicroHabit[]>([]);
  const [newMicroHabitTitle, setNewMicroHabitTitle] = useState('');
  const [activeParentId, setActiveParentId] = useState<string | null>(null); // For creating sub-tasks

  const scrollRef = useRef<HTMLDivElement>(null);

  // Populate from Initial Data if Editing
  useEffect(() => {
    if (initialData) {
        setName(initialData.name);
        setColor(initialData.color);
        setDescription(initialData.description || '');
        setCountValue(initialData.goal);
        setIncrementAmount(initialData.increment || 1); 
        
        if (initialData.structure) {
            setStructure(initialData.structure);
        }

        // LOAD REMINDERS
        if (initialData.reminders && initialData.reminders.length > 0) {
            setHasReminder(true);
            setReminderTimes(initialData.reminders.map(r => r.time));
            if (initialData.reminders[0].days) {
                setReminderDays(initialData.reminders[0].days);
            }
        }
        
        if (initialData.unit === 'kg' || initialData.unit === 'lbs') {
            setWeightUnit(initialData.unit);
            if (initialData.goal > 0) {
                setTargetWeight(initialData.goal.toString());
                setTargetWeightEnabled(true);
            } else {
                setTargetWeightEnabled(false);
            }
        } else if (initialData.unit === 'minutes') {
             // Basic fallback for time
        } else {
             setCountUnit(initialData.unit);
        }

        try {
            if (initialData.description && initialData.description.startsWith('{')) {
                const config = JSON.parse(initialData.description);
                if (config.type) setFrequencyType(config.type);
                if (config.days) setSelectedDays(config.days);
                if (config.daysPerWeek) setDaysPerWeek(config.daysPerWeek);
                if (config.text) setDescription(config.text);
            }
        } catch(e) {}
    }
  }, [initialData]);

  // Robust Auto-Scroll to Bottom Logic
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const scrollToBottom = () => {
        el.scrollTop = el.scrollHeight;
    };
    scrollToBottom();
    const timeout = setTimeout(scrollToBottom, 300);
    return () => { clearTimeout(timeout); };
  }, [step, reminderTimes.length, hasReminder, targetWeightEnabled, notificationsEnabled, frequencyType, isUnitPickerOpen, isPeriodPickerOpen, isColorPickerOpen]);

  // --- HANDLERS ---

  const handleNextStep = () => {
      if (!name.trim()) return;
      setStep(2);
  };

  const handleFinalSave = () => {
    // Construct Final Object
    const habitData: Partial<Habit> = {
      id: initialData?.id, 
      name,
      color,
      timeOfDay: 'any', 
      streak: initialData?.streak || 0,
      history: initialData?.history || {},
      unit: type === 'value' ? weightUnit : (type === 'count' ? countUnit as any : 'minutes'),
      goal: 0,
      increment: Number(incrementAmount) || 1, 
      description: description || undefined,
      structure: structure.length > 0 ? structure : undefined, 
      reminders: hasReminder ? reminderTimes.map(t => ({ time: t, days: reminderDays })) : [], 
    };

    if (type === 'value') {
        habitData.goal = targetWeightEnabled ? (parseFloat(targetWeight) || 0) : 0;
        habitData.description = description || goalDirection; 
    } else if (type === 'quit') {
        const startDateTime = `${quitDate}T${quitTime}`;
        habitData.description = `Start: ${startDateTime}`; 
        habitData.unit = 'minutes'; 
    } else if (type === 'count') {
        habitData.goal = structure.length > 0 ? 1 : countValue;
        
        const frequencyConfig = {
            type: frequencyType,
            days: frequencyType === 'specific' ? selectedDays : [],
            daysPerWeek: frequencyType === 'days_per' ? daysPerWeek : 7,
            text: description 
        };
        habitData.description = JSON.stringify(frequencyConfig);
    }

    onSave(habitData);
  };

  // ... (rest of the component methods: adjustWeight, toggleTargetWeight, etc. remain the same)
  const adjustWeight = (delta: number) => {
    const current = parseFloat(targetWeight) || 0;
    const newVal = Math.max(0, Math.round((current + delta) * 10) / 10);
    setTargetWeight(newVal.toFixed(1));
  };

  const toggleTargetWeight = () => {
      const newState = !targetWeightEnabled;
      setTargetWeightEnabled(newState);
      if (!newState && goalDirection === 'gain') {
          setGoalDirection('lose');
      }
  };

  const toggleWeightUnit = () => {
      setWeightUnit(prev => prev === 'kg' ? 'lbs' : 'kg');
  };

  const toggleDaySelection = (index: number) => {
      if (selectedDays.includes(index)) {
          setSelectedDays(selectedDays.filter(d => d !== index));
      } else {
          setSelectedDays([...selectedDays, index].sort());
      }
  };
  
  const toggleReminderDay = (index: number) => {
      if (reminderDays.includes(index)) {
          setReminderDays(reminderDays.filter(d => d !== index));
      } else {
          setReminderDays([...reminderDays, index].sort());
      }
  };

  const handleAddReminderTime = () => {
      if (!reminderTimes.includes(currentReminderTime)) {
          setReminderTimes([...reminderTimes, currentReminderTime].sort());
      }
  };

  const handleRemoveReminderTime = (timeToRemove: string) => {
      setReminderTimes(reminderTimes.filter(t => t !== timeToRemove));
  };

  const handleSaveCustomUnit = () => {
      if (customPlural.trim()) {
          setCountUnit(customPlural.toLowerCase());
      } else if (customSingular.trim()) {
          setCountUnit(customSingular.toLowerCase());
      }
      setIsCustomUnitModalOpen(false);
      setIsUnitPickerOpen(false);
  };
  
  const addMicroHabit = () => {
      if (!newMicroHabitTitle.trim()) return;
      
      const newMicro: MicroHabit = {
          id: Math.random().toString(36).substr(2, 9),
          title: newMicroHabitTitle,
          subHabits: []
      };

      if (activeParentId) {
          const updateRecursive = (list: MicroHabit[]): MicroHabit[] => {
              return list.map(item => {
                  if (item.id === activeParentId) {
                      return { ...item, subHabits: [...(item.subHabits || []), newMicro] };
                  }
                  if (item.subHabits && item.subHabits.length > 0) {
                      return { ...item, subHabits: updateRecursive(item.subHabits) };
                  }
                  return item;
              });
          };
          setStructure(updateRecursive(structure));
          setActiveParentId(null);
      } else {
          setStructure([...structure, newMicro]);
      }
      setNewMicroHabitTitle('');
  };
  
  const deleteMicroHabit = (idToDelete: string) => {
       const deleteRecursive = (list: MicroHabit[]): MicroHabit[] => {
          return list.filter(item => item.id !== idToDelete).map(item => ({
              ...item,
              subHabits: item.subHabits ? deleteRecursive(item.subHabits) : []
          }));
       };
       setStructure(deleteRecursive(structure));
  };

  const renderNameColorSection = () => (
    <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
            <label className="text-[11px] font-black uppercase tracking-widest text-white">Name</label>
            <HelpCircle size={12} className="text-zinc-600" />
        </div>
        
        <AnimatePresence>
            {isColorPickerOpen && (
                <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                >
                    <div className="mb-3 p-3 bg-zinc-900/50 rounded-[24px] border border-white/5 grid grid-cols-7 gap-2">
                        {COLORS.map(c => (
                            <button
                                key={c.id}
                                onClick={() => { setColor(c.id); setIsColorPickerOpen(false); }}
                                className={`w-full aspect-square rounded-[10px] ${c.bg} transition-transform ${color === c.id ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-black' : 'opacity-60 hover:opacity-100 active:scale-95'}`}
                            />
                        ))}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
        
        <div className="relative w-full h-14">
            <button 
                onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
                className={`absolute left-2 top-2 bottom-2 aspect-square rounded-[14px] ${COLORS.find(c => c.id === color)?.bg} shadow-lg border border-white/10 z-10 active:scale-90 transition-transform`}
            />
            <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name your Habit" 
                className="w-full h-full bg-zinc-900 border border-white/10 rounded-[20px] pl-16 pr-5 text-sm font-bold text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/20 transition-colors"
            />
        </div>
    </div>
  );
  
  const renderStructureList = (list: MicroHabit[], level = 0) => {
      return (
          <div className={`flex flex-col gap-2 ${level > 0 ? 'ml-6' : ''}`}>
              {list.map(item => (
                  <div key={item.id}>
                      <div className="flex items-center gap-2 bg-zinc-900 border border-white/5 rounded-xl p-3">
                          {level > 0 && <CornerDownRight size={14} className="text-zinc-600" />}
                          <span className="text-xs font-bold text-white flex-1">{item.title}</span>
                          <button onClick={() => setActiveParentId(item.id)} className="p-1.5 rounded-lg bg-white/5 text-zinc-400 hover:text-white"><Plus size={14} /></button>
                          <button onClick={() => deleteMicroHabit(item.id)} className="p-1.5 rounded-lg bg-white/5 text-red-400/70 hover:text-red-400"><Trash2 size={14} /></button>
                      </div>
                      {item.subHabits && item.subHabits.length > 0 && renderStructureList(item.subHabits, level + 1)}
                  </div>
              ))}
          </div>
      );
  };

  const renderStep1 = () => (
    <div className="min-h-full flex flex-col justify-end px-6 pb-28 pt-2">
      {type === 'value' && (
          <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2"><label className="text-[11px] font-black uppercase tracking-widest text-white">Target Weight</label></div>
                  <button onClick={toggleTargetWeight} className={`w-12 h-7 rounded-full transition-colors duration-300 relative ${targetWeightEnabled ? 'bg-blue-500' : 'bg-zinc-700'}`}><div className={`absolute top-1 bottom-1 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${targetWeightEnabled ? 'left-6' : 'left-1'}`} /></button>
              </div>
              <div className={`transition-opacity duration-300 ${targetWeightEnabled ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                  <div className="flex gap-3 mb-4">
                      <div className="flex-1 h-14 bg-zinc-900 border border-white/10 rounded-[20px] px-2 flex items-center justify-between">
                          <button onClick={() => adjustWeight(-0.1)} className="w-10 h-10 flex items-center justify-center text-zinc-500 active:bg-white/5 rounded-full active:text-white transition-colors"><Minus size={18} /></button>
                          <div className="flex items-baseline gap-1"><span className="text-xl font-black text-white">{targetWeight}</span><span className="text-xs font-bold text-zinc-500">{weightUnit}</span></div>
                          <button onClick={() => adjustWeight(0.1)} className="w-10 h-10 flex items-center justify-center text-zinc-500 active:bg-white/5 rounded-full active:text-white transition-colors"><Plus size={18} /></button>
                      </div>
                      <button onClick={toggleWeightUnit} className="w-20 h-14 bg-zinc-900 border border-white/10 rounded-[20px] flex items-center justify-center text-sm font-bold text-zinc-300 active:bg-white/5 transition-colors">{weightUnit === 'kg' ? 'KG' : 'LBS'}</button>
                  </div>
                  <div className="flex bg-zinc-900 p-1 rounded-[16px] border border-white/5">
                      <button onClick={() => setGoalDirection('lose')} className={`flex-1 py-2.5 rounded-[12px] text-[10px] font-black uppercase tracking-wider transition-all ${goalDirection === 'lose' ? 'bg-white text-black shadow-lg' : 'text-zinc-500'}`}>Lose</button>
                      <button onClick={() => setGoalDirection('maintain')} className={`flex-1 py-2.5 rounded-[12px] text-[10px] font-black uppercase tracking-wider transition-all ${goalDirection === 'maintain' ? 'bg-white text-black shadow-lg' : 'text-zinc-500'}`}>Maintain</button>
                      <button onClick={() => setGoalDirection('gain')} className={`flex-1 py-2.5 rounded-[12px] text-[10px] font-black uppercase tracking-wider transition-all ${goalDirection === 'gain' ? 'bg-white text-black shadow-lg' : 'text-zinc-500'}`}>Gain</button>
                  </div>
              </div>
              <div className="w-full h-px bg-white/5 my-6" />
          </div>
      )}

      {type === 'quit' && (
          <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2"><label className="text-[11px] font-black uppercase tracking-widest text-white">Milestone Notifications</label></div>
                  <button onClick={() => setNotificationsEnabled(!notificationsEnabled)} className={`w-12 h-7 rounded-full transition-colors duration-300 relative ${notificationsEnabled ? 'bg-blue-500' : 'bg-zinc-700'}`}><div className={`absolute top-1 bottom-1 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${notificationsEnabled ? 'left-6' : 'left-1'}`} /></button>
              </div>
              <div className={`w-full overflow-x-auto no-scrollbar transition-opacity duration-300 ${notificationsEnabled ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                  <div className="flex gap-2 pb-2">
                      {MILESTONES.map((m) => (<div key={m.id} className="flex-shrink-0 px-5 py-3 bg-zinc-800 rounded-[14px] border border-white/5"><span className="text-[10px] font-bold text-zinc-400 whitespace-nowrap">{m.label}</span></div>))}
                  </div>
              </div>
              <div className="w-full h-px bg-white/5 my-6" />
              <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3"><label className="text-[11px] font-black uppercase tracking-widest text-white">Quit Start Date</label></div>
                    <div className="flex gap-3">
                        <div className="flex-1 relative h-14 bg-zinc-900 border border-white/10 rounded-[20px] overflow-hidden">
                             <input type="date" value={quitDate} onChange={(e) => setQuitDate(e.target.value)} className="absolute inset-0 w-full h-full bg-transparent text-center text-sm font-bold text-white uppercase focus:outline-none px-4 z-10 opacity-0" />
                             <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><Calendar size={16} className="text-zinc-500 mr-2" /><span className="text-sm font-bold text-white">{new Date(quitDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span></div>
                        </div>
                        <div className="w-32 relative h-14 bg-zinc-900 border border-white/10 rounded-[20px] overflow-hidden">
                             <input type="time" value={quitTime} onChange={(e) => setQuitTime(e.target.value)} className="absolute inset-0 w-full h-full bg-transparent text-center text-sm font-bold text-white uppercase focus:outline-none px-4 z-10 opacity-0" />
                             <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><Clock size={16} className="text-zinc-500 mr-2" /><span className="text-sm font-bold text-white">{quitTime}</span></div>
                        </div>
                    </div>
              </div>
              <div className="w-full h-px bg-white/5 my-6" />
          </div>
      )}

      {type === 'count' && (
          <>
              <div className={`mb-6 space-y-3 ${countPeriod !== 'Day' ? 'opacity-30 pointer-events-none' : ''}`}>
                  {[{ id: 'every', label: 'Every day of the week' }, { id: 'specific', label: 'Specific days of the week' }, { id: 'days_per', label: 'Number of days per week' }].map((opt) => (
                      <div key={opt.id} onClick={() => countPeriod === 'Day' && setFrequencyType(opt.id as any)} className="flex items-center justify-between gap-3 cursor-pointer group">
                          <span className={`text-sm font-bold transition-colors ${frequencyType === opt.id ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-300'}`}>{opt.label}</span>
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${frequencyType === opt.id ? 'border-blue-500 bg-blue-500/20' : 'border-zinc-600 bg-transparent group-hover:border-zinc-500'}`}>
                              {frequencyType === opt.id && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)]" />}
                          </div>
                      </div>
                  ))}
                  <AnimatePresence mode="wait">
                      {frequencyType === 'specific' && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden pt-2">
                              <div className="flex gap-2 flex-wrap justify-end">
                                  {WEEKDAYS.map((day, idx) => (
                                      <button key={day} onClick={() => toggleDaySelection(idx)} className={`w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-black uppercase transition-all ${selectedDays.includes(idx) ? 'bg-white text-black shadow-lg scale-105' : 'bg-zinc-800 text-zinc-500 border border-white/5'}`}>{day.charAt(0)}</button>
                                  ))}
                              </div>
                          </motion.div>
                      )}
                      {frequencyType === 'days_per' && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden pt-2 flex justify-end">
                               <div className="h-12 bg-zinc-900 border border-white/10 rounded-[16px] px-2 flex items-center justify-between w-40">
                                  <button onClick={() => setDaysPerWeek(Math.max(1, daysPerWeek - 1))} className="w-8 h-8 flex items-center justify-center text-zinc-500 active:bg-white/5 rounded-full active:text-white transition-colors"><Minus size={16} /></button>
                                  <span className="text-sm font-black text-white">{daysPerWeek} days</span>
                                  <button onClick={() => setDaysPerWeek(Math.min(7, daysPerWeek + 1))} className="w-8 h-8 flex items-center justify-center text-zinc-500 active:bg-white/5 rounded-full active:text-white transition-colors"><Plus size={16} /></button>
                               </div>
                          </motion.div>
                      )}
                  </AnimatePresence>
              </div>
              <div className="w-full h-px bg-white/5 my-6" />
              <div className="mb-6">
                  <div className="text-center mb-2"><span className="text-[10px] text-zinc-400 font-medium">At least</span></div>
                  <div className="flex items-center justify-center gap-3">
                       <div className="h-14 bg-zinc-900 border border-white/10 rounded-[20px] px-2 flex items-center justify-between min-w-[140px]">
                          <button onClick={() => setCountValue(Math.max(1, countValue - 1))} className="w-10 h-10 flex items-center justify-center text-zinc-500 active:bg-white/5 rounded-full active:text-white transition-colors"><Minus size={18} /></button>
                          <span className="text-xl font-black text-white w-8 text-center">{countValue}</span>
                          <button onClick={() => setCountValue(countValue + 1)} className="w-10 h-10 flex items-center justify-center text-zinc-500 active:bg-white/5 rounded-full active:text-white transition-colors"><Plus size={18} /></button>
                       </div>
                       <div className="relative">
                          <button onClick={() => setIsUnitPickerOpen(!isUnitPickerOpen)} className="h-14 bg-zinc-900 border border-white/10 rounded-[20px] px-4 flex items-center justify-between gap-2 min-w-[100px] active:bg-white/5 transition-colors">
                              <span className="text-sm font-bold text-white">{countUnit}</span><ChevronDown size={14} className="text-zinc-500" />
                          </button>
                          <AnimatePresence>
                              {isUnitPickerOpen && (
                                  <motion.div initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }} className="absolute top-full mt-2 left-0 w-full min-w-[120px] bg-zinc-800 border border-white/10 rounded-[16px] overflow-hidden shadow-xl z-50">
                                      <div className="py-1">
                                          {HABIT_UNITS.map(u => (<button key={u} onClick={() => { setCountUnit(u); setIsUnitPickerOpen(false); }} className="w-full text-left px-4 py-2.5 text-xs font-bold text-zinc-300 hover:bg-white/10 hover:text-white transition-colors">{u}</button>))}
                                          <div className="h-px bg-white/10 my-1 mx-2" />
                                          <button onClick={() => setIsCustomUnitModalOpen(true)} className="w-full text-left px-4 py-2.5 text-xs font-bold text-white hover:bg-white/10 transition-colors flex items-center justify-between">Custom Units <ChevronRight size={12} /></button>
                                      </div>
                                  </motion.div>
                              )}
                          </AnimatePresence>
                       </div>
                  </div>
                  <div className="flex items-center justify-center gap-2 mt-3">
                       <span className="text-[10px] text-zinc-400 font-medium">per</span>
                       <div className="relative">
                          <button onClick={() => setIsPeriodPickerOpen(!isPeriodPickerOpen)} className="px-3 py-1.5 bg-zinc-800 rounded-[12px] border border-white/5 flex items-center gap-2 active:bg-zinc-700"><span className="text-xs font-bold text-white">{countPeriod}</span><ChevronDown size={10} className="text-zinc-500" /></button>
                          <AnimatePresence>{isPeriodPickerOpen && (<motion.div initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }} className="absolute top-full mt-2 left-1/2 -translate-x-1/2 min-w-[100px] bg-zinc-900 border border-white/10 rounded-[16px] overflow-hidden shadow-xl z-50 py-1">{PERIODS.map(p => (<button key={p} onClick={() => { setCountPeriod(p); setIsPeriodPickerOpen(false); }} className="w-full text-center px-4 py-2 text-xs font-bold text-zinc-300 hover:bg-white/10 hover:text-white">{p}</button>))}</motion.div>)}</AnimatePresence>
                       </div>
                  </div>
              </div>
              <div className="w-full h-px bg-white/5 my-6" />
          </>
      )}

      {renderNameColorSection()}
    </div>
  );

  const renderStep2 = () => (
    <div className="min-h-full flex flex-col justify-end px-6 pb-28 pt-2">
      
      {/* Description */}
      <div className="mb-6">
           <div className="flex items-center gap-2 mb-3">
                <label className="text-[11px] font-black uppercase tracking-widest text-white">Notes / Motivation</label>
           </div>
           <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Why is this habit important?" 
                className="w-full h-24 bg-zinc-900 border border-white/10 rounded-[20px] p-4 text-xs font-medium text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/20 transition-colors resize-none"
           />
      </div>

      <div className="w-full h-px bg-white/5 my-6" />

      {/* Reminders */}
      <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2"><Bell size={14} className="text-zinc-400"/><label className="text-[11px] font-black uppercase tracking-widest text-white">Reminders</label></div>
              <button onClick={() => setHasReminder(!hasReminder)} className={`w-12 h-7 rounded-full transition-colors duration-300 relative ${hasReminder ? 'bg-blue-500' : 'bg-zinc-700'}`}><div className={`absolute top-1 bottom-1 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${hasReminder ? 'left-6' : 'left-1'}`} /></button>
          </div>
          
          <AnimatePresence>
            {hasReminder && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                             <div className="relative flex-1 h-14 bg-zinc-900 border border-white/10 rounded-[20px] overflow-hidden">
                                 <input type="time" value={currentReminderTime} onChange={(e) => setCurrentReminderTime(e.target.value)} className="absolute inset-0 w-full h-full bg-transparent text-center text-sm font-bold text-white focus:outline-none px-4 z-10 opacity-0" />
                                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><span className="text-lg font-black text-white">{currentReminderTime}</span></div>
                             </div>
                             <button onClick={handleAddReminderTime} className="w-14 h-14 bg-zinc-900 border border-white/10 rounded-[20px] flex items-center justify-center text-zinc-400 active:bg-white/5 active:text-white transition-colors"><Plus size={20}/></button>
                        </div>
                        
                        {reminderTimes.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {reminderTimes.map(t => (
                                    <div key={t} className="px-3 py-1.5 bg-zinc-800 rounded-[12px] border border-white/5 flex items-center gap-2">
                                        <span className="text-xs font-bold text-white">{t}</span>
                                        <button onClick={() => handleRemoveReminderTime(t)} className="text-zinc-500 hover:text-white"><X size={12}/></button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div>
                            <div className="flex gap-1 flex-wrap justify-between mt-2">
                                {WEEKDAYS.map((day, idx) => (
                                    <button key={day} onClick={() => toggleReminderDay(idx)} className={`w-8 h-8 rounded-full flex items-center justify-center text-[9px] font-black uppercase transition-all ${reminderDays.includes(idx) ? 'bg-white text-black shadow-lg scale-105' : 'bg-zinc-800 text-zinc-500 border border-white/5'}`}>{day.charAt(0)}</button>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
          </AnimatePresence>
      </div>

      {type === 'count' && (
          <>
            <div className="w-full h-px bg-white/5 my-6" />

            {/* Micro Habits */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2"><List size={14} className="text-zinc-400"/><label className="text-[11px] font-black uppercase tracking-widest text-white">Micro-Habits</label></div>
                </div>
                
                <div className="bg-zinc-900/50 border border-white/5 rounded-[24px] p-4 mb-3 min-h-[60px]">
                    {structure.length > 0 ? renderStructureList(structure) : <div className="text-center py-2"><span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">No sub-tasks</span></div>}
                </div>

                <div className="flex gap-2">
                     <div className="relative flex-1">
                        {activeParentId && <div className="absolute -top-5 left-2 text-[9px] text-zinc-400 flex items-center gap-1"><CornerDownRight size={10} /> Adding sub-task</div>}
                        <input 
                            type="text" 
                            value={newMicroHabitTitle} 
                            onChange={(e) => setNewMicroHabitTitle(e.target.value)} 
                            placeholder={activeParentId ? "Sub-task title..." : "Add a task..."}
                            className="w-full h-12 bg-zinc-900 border border-white/10 rounded-[16px] px-4 text-xs font-bold text-white focus:outline-none placeholder:text-zinc-600"
                            onKeyDown={(e) => e.key === 'Enter' && addMicroHabit()}
                        />
                     </div>
                     <button onClick={addMicroHabit} className="w-12 h-12 bg-zinc-800 border border-white/10 rounded-[16px] flex items-center justify-center text-white active:bg-white/10 transition-colors"><Plus size={18} /></button>
                     {activeParentId && <button onClick={() => setActiveParentId(null)} className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-[16px] flex items-center justify-center text-red-400 active:bg-red-500/20 transition-colors"><X size={18} /></button>}
                </div>
            </div>

            <div className="w-full h-px bg-white/5 my-6" />

            <div className="grid grid-cols-2 gap-3 mb-6">
                <button onClick={() => setIsIncrementModalOpen(true)} className="h-20 bg-zinc-900 border border-white/10 rounded-[24px] flex flex-col items-center justify-center gap-2 active:bg-zinc-800 transition-colors">
                    <Plus size={20} className="text-zinc-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Increment</span>
                    <span className="text-xs font-bold text-white">+{incrementAmount}</span>
                </button>
                <button onClick={() => setIsTimerSettingsModalOpen(true)} className="h-20 bg-zinc-900 border border-white/10 rounded-[24px] flex flex-col items-center justify-center gap-2 active:bg-zinc-800 transition-colors">
                    <Clock size={20} className="text-zinc-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Timer</span>
                    <span className="text-xs font-bold text-white capitalize">{timerDefault}</span>
                </button>
            </div>
          </>
      )}
    </div>
  );

  return (
    <div className="w-full flex flex-col h-[65vh] relative">
       <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar relative">
          <AnimatePresence mode="wait">
              {step === 1 ? (
                  <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="min-h-full">{renderStep1()}</motion.div>
              ) : (
                  <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="min-h-full">{renderStep2()}</motion.div>
              )}
          </AnimatePresence>
       </div>

       <div className="absolute bottom-0 left-0 right-0 z-40 px-6 pb-6 pt-10 bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
        <div className="flex gap-4 pointer-events-auto">
          {!(step === 1 && initialData) && (
            <button onClick={step === 1 ? onBack : () => setStep(1)} className="flex-1 py-5 bg-zinc-900 border border-white/10 rounded-[20px] text-[10px] font-black uppercase tracking-[0.2em] text-white active:bg-white/10 transition-colors flex items-center justify-center gap-2">{step === 1 ? <><ChevronLeft size={14} /> Back</> : 'Cancel'}</button>
          )}
          <button onClick={step === 1 ? handleNextStep : handleFinalSave} className={`flex-1 py-5 bg-white text-black rounded-[20px] text-[10px] font-black uppercase tracking-[0.2em] active:scale-95 transition-all shadow-xl shadow-white/5 flex items-center justify-center gap-2`}>{step === 1 ? <><span className="mr-1">Next</span> <ChevronRight size={14} /></> : 'Save Habit'}</button>
        </div>
      </div>
      
      {/* ... Existing Modals (Custom Unit, Increment, Timer) ... */}
      <AnimatePresence>
         {isCustomUnitModalOpen && (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md flex flex-col items-center justify-end sm:justify-center" onClick={(e) => e.stopPropagation()}>
                 <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="w-full bg-[#121212] rounded-t-[32px] sm:rounded-[32px] p-6 pb-12 border-t sm:border border-white/10 shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
                    <div className="w-12 h-1 bg-zinc-700 rounded-full mx-auto mb-6" />
                    <div className="flex items-center justify-between mb-8"><h2 className="text-xl font-black uppercase tracking-tighter text-white">Custom Units</h2><button onClick={() => setIsCustomUnitModalOpen(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-zinc-400"><X size={16} /></button></div>
                    <div className="space-y-4 mb-8">
                         <div className="space-y-2"><label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 pl-2">Singular</label><input type="text" value={customSingular} onChange={(e) => setCustomSingular(e.target.value)} placeholder="cup" className="w-full h-14 bg-zinc-900 border border-white/10 rounded-[20px] px-5 text-sm font-bold text-white focus:outline-none" /></div>
                         <div className="space-y-2"><label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 pl-2">Plural</label><input type="text" value={customPlural} onChange={(e) => setCustomPlural(e.target.value)} placeholder="cups" className="w-full h-14 bg-zinc-900 border border-white/10 rounded-[20px] px-5 text-sm font-bold text-white focus:outline-none" /></div>
                    </div>
                    <div className="flex gap-3"><button onClick={() => setIsCustomUnitModalOpen(false)} className="flex-1 h-14 rounded-[20px] bg-zinc-900 border border-white/10 text-[10px] font-black uppercase tracking-widest text-zinc-400">Cancel</button><button onClick={handleSaveCustomUnit} className="flex-1 h-14 rounded-[20px] bg-white text-black text-[10px] font-black uppercase tracking-widest shadow-lg">Save Unit</button></div>
                 </motion.div>
             </motion.div>
         )}
      </AnimatePresence>

      <AnimatePresence>
         {isIncrementModalOpen && (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-md flex flex-col items-center justify-end sm:justify-center" onClick={() => setIsIncrementModalOpen(false)}>
                 <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="w-full bg-[#121212] rounded-t-[32px] sm:rounded-[32px] p-6 pb-12 border-t sm:border border-white/10 shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
                    <div className="text-center mb-6"><h2 className="text-lg font-bold text-white">Custom Increment Amount</h2></div>
                    <div className="flex items-center justify-center gap-4 mb-6">
                        <div className="h-16 bg-zinc-900 border border-white/10 rounded-[24px] px-3 flex items-center gap-4">
                            <button onClick={() => setIncrementAmount(Math.max(1, Number(incrementAmount) - 1))} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-400"><Minus size={18}/></button>
                            <input type="number" value={incrementAmount} onChange={(e) => setIncrementAmount(Number(e.target.value))} className="bg-transparent text-center w-20 text-2xl font-black text-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                            <button onClick={() => setIncrementAmount(Number(incrementAmount) + 1)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-400"><Plus size={18}/></button>
                        </div>
                        <span className="text-lg font-bold text-white">{type === 'count' ? countUnit : (type === 'value' ? weightUnit : 'time')}</span>
                    </div>
                    <p className="text-center text-xs text-zinc-500 mb-8 px-8">When you tap on the habit increment button (+), this amount will be added</p>
                    <div className="flex gap-3"><button onClick={() => setIsIncrementModalOpen(false)} className="flex-1 h-14 rounded-[20px] bg-zinc-900 border border-white/10 text-[10px] font-black uppercase tracking-widest text-zinc-400">Close</button><button onClick={() => setIsIncrementModalOpen(false)} className="flex-1 h-14 rounded-[20px] bg-white text-black text-[10px] font-black uppercase tracking-widest shadow-lg">Apply</button></div>
                 </motion.div>
             </motion.div>
         )}
      </AnimatePresence>

      <AnimatePresence>
         {isTimerSettingsModalOpen && (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-md flex flex-col items-center justify-end sm:justify-center" onClick={() => setIsTimerSettingsModalOpen(false)}>
                 <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="w-full bg-[#121212] rounded-t-[32px] sm:rounded-[32px] p-6 pb-12 border-t sm:border border-white/10 shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
                    <div className="text-center mb-8"><h2 className="text-lg font-bold text-white">Timer Settings</h2></div>
                    <div className="mb-6 space-y-6 px-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2"><span className="text-sm font-bold text-white">Timer Default</span><HelpCircle size={14} className="text-zinc-600" /></div>
                            <div className="flex bg-zinc-900 rounded-[14px] p-1 border border-white/5">
                                <button onClick={() => setTimerDefault('stopwatch')} className={`px-3 py-2 rounded-[10px] text-[10px] font-bold uppercase transition-all ${timerDefault === 'stopwatch' ? 'bg-white text-black shadow-md' : 'text-zinc-500'}`}>Stopwatch</button>
                                <button onClick={() => setTimerDefault('countdown')} className={`px-3 py-2 rounded-[10px] text-[10px] font-bold uppercase transition-all ${timerDefault === 'countdown' ? 'bg-white text-black shadow-md' : 'text-zinc-500'}`}>Countdown</button>
                            </div>
                        </div>
                        {timerDefault === 'countdown' && (
                             <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2"><span className="text-sm font-bold text-white">Countdown Default</span><HelpCircle size={14} className="text-zinc-600" /></div>
                                <div className="bg-zinc-900 border border-white/10 rounded-[16px] px-4 py-2 flex items-center gap-2">
                                     <button onClick={() => setCountdownDuration(Math.max(1, countdownDuration - 5))} className="text-zinc-500 active:text-white"><Minus size={14}/></button>
                                     <span className="text-sm font-black text-white w-12 text-center">{countdownDuration} m</span>
                                     <button onClick={() => setCountdownDuration(countdownDuration + 5)} className="text-zinc-500 active:text-white"><Plus size={14}/></button>
                                </div>
                             </div>
                        )}
                    </div>
                    <div className="flex gap-3 mt-8"><button onClick={() => setIsTimerSettingsModalOpen(false)} className="flex-1 h-14 rounded-[20px] bg-zinc-900 border border-white/10 text-[10px] font-black uppercase tracking-widest text-zinc-400">Cancel</button><button onClick={() => setIsTimerSettingsModalOpen(false)} className="flex-1 h-14 rounded-[20px] bg-white text-black text-[10px] font-black uppercase tracking-widest shadow-lg">Apply</button></div>
                 </motion.div>
             </motion.div>
         )}
      </AnimatePresence>

    </div>
  );
};

export default AddHabitForm;
