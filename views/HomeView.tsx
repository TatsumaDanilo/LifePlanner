
import React, { useState, useMemo } from 'react';
import { Trophy, Book, Tv, Palette, Gamepad2, X, ChevronLeft, ChevronRight, ArrowUpRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppState, MediaItem } from '../types';

interface Props { 
  state: AppState; 
  expandedCategory: string | null;
  setExpandedCategory: (id: string | null) => void;
  viewDate: Date;
  onDateChange: (date: Date) => void;
  onNavigateToMedia: (type: MediaItem['type'], id?: string) => void;
}

interface CategoryCardProps {
  title: string;
  items: MediaItem[];
  allMedia: MediaItem[];
  icon: any;
  colorClass: string;
  isExpanded: boolean;
  onToggle: () => void;
  onNavigateToMedia: (type: MediaItem['type'], id?: string) => void;
  type: MediaItem['type'];
}

const iosTransition = {
  type: "spring",
  stiffness: 400,
  damping: 30,
  mass: 1,
} as const;

const fastTransition = {
  duration: 0.2,
  ease: [0.32, 0.72, 0, 1] as const
};

// Componente per immagini con caricamento ottimizzato (Lazy Fade-In)
const FadeImage = ({ src, alt, className, layoutId }: { src: string, alt: string, className: string, layoutId?: string }) => {
  const [loaded, setLoaded] = useState(false);
  
  if (!src || src === '') {
      return (
        <motion.div 
            layoutId={layoutId} 
            className={`bg-zinc-800 ${className}`} 
            transition={iosTransition}
        />
      );
  }

  return (
    <div className={`relative overflow-hidden bg-zinc-800 ${className}`}>
       <motion.img 
          layoutId={layoutId}
          src={src} 
          alt={alt} 
          className={`w-full h-full object-cover transition-opacity duration-300 ease-out ${loaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setLoaded(true)}
          transition={iosTransition}
          loading="lazy"
       />
       {!loaded && (
         <div className="absolute inset-0 animate-pulse bg-white/5" />
       )}
    </div>
  );
};

const CategoryCard: React.FC<CategoryCardProps> = ({ 
  title, 
  items, 
  allMedia,
  icon: Icon, 
  colorClass,
  isExpanded,
  onToggle,
  onNavigateToMedia,
  type
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedItem = items.find(i => i.id === selectedId);

  React.useEffect(() => {
    if (!isExpanded) setSelectedId(null);
  }, [isExpanded]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('it-IT');
  };

  const getItemFullTitle = (item: MediaItem) => {
    return item.title;
  };

  // Funzione ricorsiva per trovare l'immagine di copertina
  const getEffectiveImage = (item: MediaItem): string => {
    if (item.image && item.image.trim() !== '') return item.image;
    if (!item.isCollection) return '';

    const findImageRecursive = (parentId: string): string => {
       const children = allMedia.filter(m => m.parentId === parentId);
       for (const child of children) {
          if (child.image && child.image.trim() !== '') return child.image;
          if (child.isCollection) {
             const found = findImageRecursive(child.id);
             if (found) return found;
          }
       }
       return '';
    };

    return findImageRecursive(item.id);
  };

  const DateDisplay = ({ item, isCentered = false }: { item: MediaItem, isCentered?: boolean }) => {
    const labelSize = isCentered ? 'text-[9px]' : 'text-[7px]';
    const valueSize = isCentered ? 'text-[11px]' : 'text-[8px]';
    const padding = isCentered ? 'px-4 py-2' : 'px-2 py-0.5';
    const gap = isCentered ? 'gap-2.5' : 'gap-1';

    return (
      <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`flex flex-col ${gap} w-full items-center`}
      >
          <div className={`${padding} rounded-full bg-white/5 border border-white/10 w-fit`}>
              <span className={`${labelSize} font-bold text-zinc-500 uppercase tracking-widest mr-1.5`}>Completato:</span>
              <span className={`${valueSize} font-black text-white uppercase tracking-wider`}>
                {item.completedDate ? formatDate(item.completedDate) : 'In Corso'}
              </span>
          </div>
      </motion.div>
    );
  };

  return (
    <motion.div 
      layout
      transition={iosTransition}
      className={`relative ${
        isExpanded 
          ? 'col-span-2 row-span-2 z-30' 
          : 'col-span-1 z-10'
      }`}
    >
      <motion.div 
        layout
        transition={iosTransition}
        className={`flex flex-col h-full w-full ${
          isExpanded 
            ? 'bg-zinc-900/95 backdrop-blur-3xl p-5 shadow-2xl border-white/20' 
            : 'bg-white/[0.03] border-white/10 p-4 items-center justify-center hover:bg-white/5 active:scale-95 aspect-square'
        } rounded-[40px] border overflow-hidden relative`}
        onClick={!isExpanded ? onToggle : undefined}
      >
        <motion.div 
          layout
          className={`flex w-full ${isExpanded ? 'flex-row items-center justify-between mb-2' : 'flex-col items-center justify-center h-full gap-3'} ${selectedId ? 'opacity-0 pointer-events-none absolute' : 'opacity-100 relative'}`}
          transition={{ duration: 0.2 }}
        >
          <div className={`flex items-center ${isExpanded ? 'gap-3' : 'flex-col gap-3'}`}>
            <motion.div
              layout
              layoutId={`icon-container-${type}`}
              className={`flex-shrink-0 flex items-center justify-center rounded-[24px] border ${
                isExpanded 
                  ? 'w-10 h-10 bg-white/5 border-white/10' 
                  : 'w-16 h-16 bg-white/[0.02] border-white/5'
              }`}
            >
              <Icon 
                size={isExpanded ? 18 : 32} 
                className={`transition-colors duration-500 ${isExpanded ? colorClass : 'text-zinc-500'}`}
                strokeWidth={isExpanded ? 2.5 : 2}
              />
            </motion.div>

            <motion.div 
              layout 
              layoutId={`text-container-${type}`}
              className={`${isExpanded ? 'text-left' : 'text-center'}`}
            >
              <motion.h4 layout className="font-black text-[14px] text-white uppercase tracking-tighter leading-none">
                {title}
              </motion.h4>
              <motion.p layout className="text-[9px] text-zinc-500 font-black mt-1 uppercase tracking-[0.2em] truncate">
                {items.length} {items.length === 1 ? 'finito' : 'finiti'}
              </motion.p>
            </motion.div>
          </div>

          {isExpanded && !selectedId && (
            <motion.button 
              initial={{ opacity: 0, scale: 0.8 }} 
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={(e) => { e.stopPropagation(); onToggle(); }} 
              className="w-8 h-8 flex items-center justify-center text-zinc-400 bg-white/10 rounded-full border border-white/10 active:bg-white/20"
            >
              <X size={14} />
            </motion.button>
          )}
        </motion.div>

        <motion.div 
           layout
           className={`flex-1 w-full overflow-x-auto no-scrollbar flex items-center transition-opacity duration-300 ${selectedId ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        >
          <div className="flex space-x-4 h-full items-center pl-1">
            {items.length > 0 ? items.map((item) => (
              <motion.div
                key={item.id}
                layoutId={`card-container-${item.id}`}
                onClick={(e) => { e.stopPropagation(); setSelectedId(item.id); }}
                className="flex-shrink-0 w-40 flex flex-col items-start gap-3 cursor-pointer group"
                transition={iosTransition}
              >
                <motion.div 
                  layoutId={`image-container-${item.id}`}
                  className="relative w-full rounded-[22px] overflow-hidden border border-white/10 bg-zinc-800 aspect-[2/3] shadow-lg"
                  transition={iosTransition}
                >
                  <FadeImage 
                    layoutId={`img-${item.id}`} 
                    src={getEffectiveImage(item)} 
                    alt={item.title} 
                    className="w-full h-full"
                  />
                </motion.div>
                <div className="w-full px-1">
                  <motion.h5 
                    layoutId={`title-${item.id}`} 
                    className="text-[11px] font-black text-white uppercase leading-tight truncate text-left"
                    transition={iosTransition}
                  >
                    {getItemFullTitle(item)}
                  </motion.h5>
                </div>
              </motion.div>
            )) : (
              !selectedId && (
                <div className="w-full text-center opacity-30">
                  <p className="text-[10px] uppercase font-bold tracking-widest">Nessun traguardo</p>
                </div>
              )
            )}
          </div>
        </motion.div>

        <AnimatePresence>
          {selectedId && selectedItem && (
            <motion.div 
              key="detail-overlay"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={fastTransition}
              className="absolute inset-0 z-50 bg-zinc-900 flex flex-row p-4 gap-4 overflow-hidden rounded-[40px]"
            >
               <motion.div 
                 className="h-full w-[45%] rounded-[28px] overflow-hidden border border-white/10 shadow-2xl relative flex-shrink-0 bg-zinc-800 cursor-pointer"
                 onClick={(e) => { e.stopPropagation(); setSelectedId(null); }}
                 whileTap={{ scale: 0.98 }}
               >
                 <FadeImage 
                    src={getEffectiveImage(selectedItem)} 
                    alt={selectedItem.title} 
                    className="w-full h-full relative z-10"
                 />
               </motion.div>

               <div className="flex-1 flex flex-col h-full z-10 relative overflow-hidden">
                  <div className="flex flex-col items-center w-full text-center flex-shrink-0 pt-2">
                    <h2 className="text-[13px] font-black uppercase tracking-tighter leading-none text-white line-clamp-2">
                      {getItemFullTitle(selectedItem)}
                    </h2>

                    {selectedItem.type !== 'drawing' && (
                      <div className="mt-2 w-full">
                        <DateDisplay item={selectedItem} />
                      </div>
                    )}
                  </div>
                    
                  {selectedItem.type !== 'drawing' ? (
                    <div className="w-full flex-1 min-h-0 mt-3 mb-3 relative">
                        <div className="absolute inset-0 bg-white/[0.03] rounded-2xl border border-white/5 p-3 overflow-hidden">
                             <p className="text-[9px] font-medium leading-relaxed text-zinc-300 text-left line-clamp-6 italic">
                                {selectedItem.description || ""}
                             </p>
                        </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center mt-2 mb-2">
                      <DateDisplay item={selectedItem} isCentered={true} />
                    </div>
                  )}

                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onNavigateToMedia(type, selectedItem.id)}
                    className="w-full py-3 bg-white text-black rounded-xl flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform flex-shrink-0"
                  >
                    <span className="text-[10px] font-black uppercase tracking-[0.25em]">Dettagli</span>
                    <ArrowUpRight size={14} />
                  </motion.button>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

const HomeView: React.FC<Props> = ({ state, expandedCategory, setExpandedCategory, viewDate, onDateChange, onNavigateToMedia }) => {
  const monthName = viewDate.toLocaleString('it-IT', { month: 'long' });
  const yearShort = viewDate.getFullYear().toString().slice(-2);

  const getFilteredMedia = (type: MediaItem['type']) => {
    const targetMonthStr = (viewDate.getMonth() + 1).toString().padStart(2, '0');
    const targetYearStr = viewDate.getFullYear().toString();

    return state.media.filter(m => {
      if (m.isCollection) return false;
      if (!m.completedDate) return false;
      if (m.type !== type) return false;
      
      const [y, mm] = m.completedDate.split('-');
      return y === targetYearStr && mm === targetMonthStr;
    });
  };

  const categories = useMemo(() => {
    const base = [
      { id: 'book', title: 'Libri', icon: Book, color: 'text-blue-400' },
      { id: 'movie', title: 'Film/Serie', icon: Tv, color: 'text-red-400' },
      { id: 'game', title: 'Giochi', icon: Gamepad2, color: 'text-indigo-400' },
      { id: 'drawing', title: 'Arte', icon: Palette, color: 'text-emerald-400' },
    ] as const;

    if (!expandedCategory) return base;
    
    const expanded = base.find(c => c.id === expandedCategory);
    const others = base.filter(c => c.id !== expandedCategory);
    
    return expanded ? [expanded, ...others] : base;
  }, [expandedCategory]);

  return (
    <div className={`flex flex-col w-full ${expandedCategory ? 'h-auto' : 'h-full'}`}>
      
      <motion.header layout className="flex-shrink-0 mb-1 pt-1">
        <div className="flex items-center justify-between px-2">
          <span className="text-xl font-black opacity-20 tracking-tighter">{yearShort}</span>
          <div className="flex items-center space-x-2">
            <button onClick={() => { const d = new Date(viewDate); d.setMonth(d.getMonth() - 1); onDateChange(d); }} className="p-2 text-white/20"><ChevronLeft size={28} /></button>
            <h1 className="text-5xl font-black tracking-tighter capitalize">{monthName}</h1>
            <button onClick={() => { const d = new Date(viewDate); d.setMonth(d.getMonth() + 1); onDateChange(d); }} className="p-2 text-white/20"><ChevronRight size={28} /></button>
          </div>
        </div>
      </motion.header>

      <div className={`flex flex-col w-full ${!expandedCategory ? 'flex-1 justify-center' : ''}`}>
        <motion.div layout transition={iosTransition} className="liquid-blur rounded-[40px] px-6 py-3 w-full flex flex-col items-center justify-center mb-2 border border-white/5 shadow-xl flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-yellow-400/10 flex items-center justify-center mb-2 border border-yellow-400/20 shadow-[0_0_15px_rgba(250,204,21,0.1)]">
            <Trophy size={20} className="text-yellow-400" />
          </div>
          <div className="text-center">
              <p className="text-[9px] font-black uppercase tracking-[0.25em] text-zinc-500">Traguardi Raggiunti</p>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 gap-3 w-full relative flex-shrink-0">
          {categories.map((cat) => (
            <CategoryCard 
              key={cat.id} 
              title={cat.title} 
              icon={cat.icon} 
              colorClass={cat.color} 
              items={getFilteredMedia(cat.id)}
              allMedia={state.media}
              isExpanded={expandedCategory === cat.id} 
              onToggle={() => setExpandedCategory(expandedCategory === cat.id ? null : cat.id)} 
              onNavigateToMedia={onNavigateToMedia} 
              type={cat.id} 
            />
          ))}
        </div>
      </div>
      
      <div className="w-full flex-shrink-0 h-24" />
    </div>
  );
};

export default HomeView;
    