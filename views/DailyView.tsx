
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Droplets, Sparkles, Plus, Minus, Clock, Calendar as CalendarIcon, Moon, Loader2 } from 'lucide-react';
import { AppState, DailyBlock } from '../types';
import GlassCard from '../components/GlassCard';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenAI, Type } from "@google/genai";

interface Props {
  state: AppState;
  setState: (state: AppState) => void;
}

const DailyView: React.FC<Props> = ({ state, setState }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isOptimizing, setIsOptimizing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const updateWater = (delta: number) => {
    setState({ ...state, waterIntake: Math.max(0, state.waterIntake + delta) });
  };

  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setState({ ...state, dayEndTime: e.target.value });
  };

  const optimizeWithAI = async () => {
    if (!state.brainDump.trim()) return;
    setIsOptimizing(true);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Agisci come un esperto di produttività. Prendi questo "brain dump" dell'utente e trasformalo in una tabella oraria ottimizzata (Daily Blocks).
      Identifica le attività prioritarie, raggruppa compiti simili e suggerisci orari realistici tra le 07:00 e le 23:00.
      Brain Dump: "${state.brainDump}"
      Restituisci solo un array JSON di oggetti con proprietà "time" (formato HH:mm, step di 30 min) e "activity" (stringa breve).`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                time: { type: Type.STRING },
                activity: { type: Type.STRING },
              },
              required: ["time", "activity"]
            }
          }
        }
      });

      const blocks: { time: string, activity: string }[] = JSON.parse(response.text || '[]');
      const newDailyBlocks: DailyBlock[] = blocks.map(b => ({
        time: b.time,
        activity: b.activity,
        isFixed: false
      }));

      setState({ ...state, dailyBlocks: newDailyBlocks });
    } catch (error) {
      console.error("AI Optimization failed", error);
    } finally {
      setIsOptimizing(false);
    }
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

  useEffect(() => {
    if (scrollRef.current) {
      const activeEl = scrollRef.current.querySelector('.active-day');
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, []);

  const hours = Array.from({ length: 24 * 2 }, (_, i) => {
    const hour = Math.floor(i / 2);
    const minute = i % 2 === 0 ? '00' : '30';
    return `${hour.toString().padStart(2, '0')}:${minute}`;
  });

  const isToday = (d: Date) => d.toDateString() === new Date().toDateString();
  const isSelected = (d: Date) => d.toDateString() === selectedDate.toDateString();

  return (
    <div className="flex flex-col transform-gpu px-1 w-full h-auto pb-32">
      <header className="flex-shrink-0 px-1 mb-4 flex items-center justify-between">
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

      <div 
        ref={scrollRef}
        className="flex space-x-3 overflow-x-auto no-scrollbar py-4 mb-4 -mx-4 px-4 mask-fade-edges"
      >
        {days.map((date, i) => (
          <motion.button
            key={i}
            whileTap={{ scale: 0.9 }}
            onClick={() => setSelectedDate(date)}
            className={`flex-shrink-0 w-14 h-20 rounded-[24px] flex flex-col items-center justify-center transition-all duration-300 relative border ${
              isSelected(date) 
                ? 'bg-white border-white text-black shadow-[0_0_25px_rgba(255,255,255,0.3)] active-day' 
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

      <div className="space-y-6">
        <GlassCard 
          title="Brain Dump" 
          icon={<Sparkles size={18} className="text-purple-400" />}
          defaultExpanded={true}
        >
          <textarea
            value={state.brainDump}
            onChange={(e) => setState({ ...state, brainDump: e.target.value })}
            placeholder="Cosa hai in mente per oggi? Scrivi i tuoi pensieri alla rinfusa..."
            className="w-full h-24 bg-white/5 rounded-[24px] p-4 text-xs font-medium focus:outline-none border border-white/5 resize-none placeholder:text-zinc-700"
          />
          <motion.button 
            disabled={isOptimizing}
            onClick={optimizeWithAI}
            whileTap={{ scale: 0.98 }}
            className="w-full mt-3 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-[20px] font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center space-x-2 shadow-lg shadow-purple-500/20 active:opacity-80 transition-opacity disabled:opacity-50"
          >
            {isOptimizing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            <span>{isOptimizing ? 'Ottimizzazione...' : 'Ottimizza con AI'}</span>
          </motion.button>
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
          <div className="liquid-blur rounded-[40px] p-4 max-h-[400px] overflow-y-auto no-scrollbar space-y-2 border border-white/5">
            {hours.map((time) => {
              const block = state.dailyBlocks.find(b => b.time === time);
              return (
                <div key={time} className="flex space-x-4 items-center h-12">
                  <span className="text-[8px] font-black text-zinc-600 w-8 text-right tracking-tighter">{time}</span>
                  <div className={`flex-1 rounded-[18px] h-full flex items-center px-4 transition-all ${
                    block 
                    ? block.isFixed 
                      ? 'bg-zinc-900 border border-white/10' 
                      : 'bg-indigo-500/10 border border-indigo-500/20 shadow-[inset_0_0_20px_rgba(99,102,241,0.05)]'
                    : 'border border-dashed border-white/5 opacity-30'
                  }`}>
                    {block ? (
                      <div className="flex items-center justify-between w-full">
                        <span className="text-[11px] font-black tracking-tight text-white/90 uppercase truncate">{block.activity}</span>
                        {block.isFixed && <div className="w-1.5 h-1.5 rounded-full bg-zinc-500" />}
                      </div>
                    ) : (
                      <span className="text-[9px] font-black uppercase tracking-widest text-zinc-800">Libero</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyView;
