
import React, { useState, useEffect, useMemo, useRef, useLayoutEffect } from 'react';
import { AppState, MediaItem } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, X, Edit3, Trash2, Plus, Check, Play, Pause, Bookmark, LayoutGrid, List, Folder } from 'lucide-react';

interface Props {
  state: AppState;
  activeSection: MediaItem['type'];
  onSectionChange: (section: MediaItem['type']) => void;
  initialSelectedId: string | null;
  onSelectedIdChange?: (id: string | null) => void;
  onDeleteMedia?: (id: string) => void;
  onDeleteCollection?: (seriesTitle: string) => void;
  onDeleteMultipleMedia?: (ids: string[]) => void;
  onOpenForm?: (type: MediaItem['type'], data: Partial<MediaItem>) => void;
  onUpdateMedia?: (data: Partial<MediaItem>) => void;
  onAddMultipleMedia?: (items: MediaItem[]) => void;
  onPopulatingChange?: (isPopulating: boolean) => void;
  onSeriesViewChange?: (isOpen: boolean) => void;
}

const FadeImage = ({ src, alt, className }: { src: string, alt: string, className: string }) => {
  const [loaded, setLoaded] = useState(false);
  
  if (!src || src === '') {
      return <div className={`bg-zinc-800 ${className}`} />;
  }

  return (
    <div className={`relative overflow-hidden bg-zinc-800 ${className}`}>
       <img 
          src={src} 
          alt={alt} 
          className={`w-full h-full object-cover transition-opacity duration-300 ease-out ${loaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setLoaded(true)}
          loading="lazy"
       />
       {!loaded && (
         <div className="absolute inset-0 animate-pulse bg-white/5" />
       )}
    </div>
  );
};

const MediaView: React.FC<Props> = ({ 
  state, activeSection, onSectionChange, initialSelectedId, 
  onSelectedIdChange, onDeleteMedia, onDeleteCollection, onOpenForm, onUpdateMedia, onSeriesViewChange 
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId);
  const [navigationStack, setNavigationStack] = useState<MediaItem[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [confirmAction, setConfirmAction] = useState<{ type: 'item' | 'collection', id: string, title: string } | null>(null);
  
  // Refs per gestire lo swipe manuale e lo scroll
  const touchStartRef = useRef<{ x: number, y: number } | null>(null);
  const mainScrollRef = useRef<HTMLDivElement>(null);
  const collectionScrollRef = useRef<HTMLDivElement>(null);

  const currentFolder = navigationStack[navigationStack.length - 1];

  // Auto-scroll Main View
  useLayoutEffect(() => {
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTop = mainScrollRef.current.scrollHeight;
      requestAnimationFrame(() => {
        if (mainScrollRef.current) {
            mainScrollRef.current.scrollTop = mainScrollRef.current.scrollHeight;
        }
      });
    }
  }, [activeSection, viewMode]);

  // Auto-scroll Collection View
  useLayoutEffect(() => {
     if (collectionScrollRef.current) {
         collectionScrollRef.current.scrollTop = collectionScrollRef.current.scrollHeight;
         requestAnimationFrame(() => {
            if (collectionScrollRef.current) {
                collectionScrollRef.current.scrollTop = collectionScrollRef.current.scrollHeight;
            }
         });
     }
  }, [navigationStack]);

  useEffect(() => {
    setSelectedId(initialSelectedId);
  }, [initialSelectedId]);

  const selectedItem = useMemo(() => state.media.find(m => m.id === selectedId), [state.media, selectedId]);

  // Filtra gli elementi visibili basandosi sulla cartella corrente
  const visibleEntities = useMemo(() => {
    return state.media.filter(m => {
        const typeMatch = m.type === activeSection;
        const parentMatch = m.parentId === (currentFolder ? currentFolder.id : undefined);
        return typeMatch && parentMatch;
    });
  }, [state.media, activeSection, currentFolder]);

  useEffect(() => {
    if (onSeriesViewChange) onSeriesViewChange(navigationStack.length > 0);
  }, [navigationStack, onSeriesViewChange]);

  const handleSetSelectedId = (id: string | null) => {
    setSelectedId(id);
    if (onSelectedIdChange) onSelectedIdChange(id);
  };

  // Nuova logica di Swipe basata su Touch Events nativi per affidabilità mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    if (navigationStack.length > 0 || selectedId) return; // Disabilita swipe in cartelle o dettagli

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const diffX = touchStartRef.current.x - touchEndX;
    const diffY = touchStartRef.current.y - touchEndY;
    
    // Resetta
    touchStartRef.current = null;

    // Logica:
    // 1. Lo spostamento orizzontale deve essere significativo (> 50px)
    // 2. Lo spostamento orizzontale deve essere maggiore di quello verticale (per non interferire con lo scroll)
    if (Math.abs(diffX) > 50 && Math.abs(diffX) > Math.abs(diffY)) {
       const tabs: MediaItem['type'][] = ['book', 'movie', 'game', 'drawing'];
       const currentIndex = tabs.indexOf(activeSection);

       if (diffX > 0) {
         // Swipe Sinistra -> Prossima Tab
         if (currentIndex < tabs.length - 1) onSectionChange(tabs[currentIndex + 1]);
       } else {
         // Swipe Destra -> Tab Precedente
         if (currentIndex > 0) onSectionChange(tabs[currentIndex - 1]);
       }
    }
  };

  const getEffectiveImage = (item: MediaItem): string => {
    if (item.image && item.image.trim() !== '') return item.image;
    if (!item.isCollection) return '';

    const findImageRecursive = (parentId: string): string => {
       const children = state.media.filter(m => m.parentId === parentId);
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

  const getStatusUI = (status: MediaItem['status']) => {
    switch (status) {
      case 'completed': return { 
        icon: <Check size={32} />, 
        color: 'text-emerald-500', 
        bg: 'bg-emerald-500/10', 
        btn: 'bg-emerald-500 text-white' 
      };
      case 'paused': return { 
        icon: <Pause size={32} fill="currentColor" />, 
        color: 'text-orange-500', 
        bg: 'bg-orange-500/10', 
        btn: 'bg-orange-500 text-white' 
      };
      default: return { 
        icon: <Play size={32} fill="currentColor" />, 
        color: 'text-zinc-500', 
        bg: 'bg-white/5', 
        btn: 'bg-white text-black' 
      };
    }
  };

  const handleToggleStatus = () => {
    if (!selectedItem || !onUpdateMedia) return;
    
    let nextStatus: MediaItem['status'];
    let completedDate: string | undefined = selectedItem.completedDate;

    if (selectedItem.status === 'ongoing') {
      nextStatus = 'paused';
    } else if (selectedItem.status === 'paused') {
      nextStatus = 'completed';
      completedDate = new Date().toISOString().split('T')[0];
    } else {
      nextStatus = 'ongoing';
      completedDate = undefined;
    }

    onUpdateMedia({
      id: selectedItem.id,
      status: nextStatus,
      completedDate
    });
  };

  const handleEditItem = (item: MediaItem) => {
      onOpenForm?.(item.type, item);
  };

  const handleEnterFolder = (folder: MediaItem) => {
    setNavigationStack([...navigationStack, folder]);
  };

  const handleGoBack = () => {
    setNavigationStack(navigationStack.slice(0, -1));
  };

  const handleCloseAllCollections = () => {
    setNavigationStack([]);
    handleSetSelectedId(null);
  };

  const handleAddItemToCurrentContext = () => {
      onOpenForm?.(activeSection, { 
          type: activeSection,
          parentId: currentFolder?.id,
          seriesTitle: currentFolder?.seriesTitle || currentFolder?.title
      });
  };

  const executeDelete = () => {
      if (!confirmAction) return;
      if (confirmAction.type === 'item') {
          onDeleteMedia?.(confirmAction.id);
          handleSetSelectedId(null);
      } else {
          onDeleteMedia?.(confirmAction.id); 
          if (currentFolder?.id === confirmAction.id) {
              handleGoBack();
          }
      }
      setConfirmAction(null);
  };

  return (
    <div className="flex flex-col h-full w-full relative overflow-hidden">
      <AnimatePresence mode="wait">
        {selectedId ? (
          <motion.div 
            key="detail" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] flex flex-col bg-transparent backdrop-blur-[40px] h-full overflow-hidden"
          >
            <header className="flex-shrink-0 pt-16 px-6 flex justify-between items-center z-10">
               <button onClick={() => handleSetSelectedId(null)} className="w-12 h-12 rounded-full bg-white/10 border border-white/10 flex items-center justify-center active:scale-90 transition-transform shadow-xl"><ChevronLeft/></button>
               {navigationStack.length > 0 ? (
                 <button onClick={handleCloseAllCollections} className="w-12 h-12 rounded-full bg-white/10 border border-white/10 flex items-center justify-center active:scale-90 transition-transform shadow-xl"><X/></button>
               ) : (
                 <div className="w-12" /> 
               )}
            </header>
            
            <div className="flex-1 px-8 flex flex-col items-center justify-center min-h-0 py-4">
               <div className="w-48 aspect-[2/3] rounded-[32px] overflow-hidden shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)] border border-white/10 mb-6 bg-zinc-900 flex-shrink-0">
                  <FadeImage src={selectedItem?.image || ''} className="w-full h-full" alt={selectedItem?.title || ''} />
               </div>
               <div className="flex flex-col items-center mb-6 flex-shrink-0">
                  <h1 className="text-3xl font-black uppercase tracking-tighter text-center leading-tight mb-2 px-2 text-white drop-shadow-lg">{selectedItem?.title}</h1>
                  <div className="flex items-center gap-2 opacity-50">
                    <Bookmark size={10} className="text-zinc-400" />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em]">{selectedItem?.seriesTitle || 'Elemento'}</span>
                  </div>
               </div>
               <div className="w-full max-h-[25vh] bg-white/[0.05] backdrop-blur-md border border-white/10 rounded-[36px] p-6 relative overflow-hidden shadow-2xl flex flex-col min-h-[100px]">
                  <div className="flex-1 overflow-y-auto no-scrollbar">
                    <p className="text-sm font-medium text-zinc-200 italic leading-relaxed text-center">
                      {selectedItem?.description ? `"${selectedItem.description}"` : ""}
                    </p>
                  </div>
               </div>
            </div>

            <footer className="flex-shrink-0 h-32 flex items-center justify-center gap-8 px-6 pb-10 bg-gradient-to-t from-black/20 to-transparent z-20">
               <button onClick={() => setConfirmAction({ type: 'item', id: selectedId, title: selectedItem?.title || '' })} className="w-16 h-16 rounded-[28px] bg-white/10 backdrop-blur-xl border border-white/10 text-zinc-300 flex items-center justify-center active:bg-red-500/20 active:text-red-500 transition-colors">
                  <Trash2 size={24}/>
               </button>
               <button onClick={handleToggleStatus} className={`w-20 h-20 rounded-[34px] ${getStatusUI(selectedItem?.status || 'ongoing').btn} flex items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.3)] active:scale-90 transition-all`}>
                  {getStatusUI(selectedItem?.status || 'ongoing').icon}
               </button>
               <button onClick={() => selectedItem && handleEditItem(selectedItem)} className="w-16 h-16 rounded-[28px] bg-white/10 backdrop-blur-xl border border-white/10 text-zinc-300 flex items-center justify-center active:bg-white/20 active:text-white transition-colors">
                  <Edit3 size={24}/>
               </button>
            </footer>
          </motion.div>
        ) : navigationStack.length > 0 ? (
          <motion.div key="collection-view" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col h-full overflow-hidden relative">
             <header className="flex-shrink-0 px-6 pt-16 pb-4 flex items-center gap-4">
                <button onClick={handleGoBack} className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center shadow-lg active:scale-90"><ChevronLeft/></button>
                <div className="flex-1 min-w-0">
                   <h1 className="text-3xl font-black uppercase tracking-tighter truncate leading-none">{currentFolder.title}</h1>
                </div>
                <button onClick={handleCloseAllCollections} className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center shadow-lg active:scale-90"><X/></button>
             </header>

             <div ref={collectionScrollRef} className="flex-1 px-6 overflow-y-auto no-scrollbar pt-2 relative z-0">
                <div className="min-h-full flex flex-col justify-end pb-32 space-y-3">
                    {visibleEntities.length === 0 ? (
                        <div className="h-64 flex flex-col items-center justify-center opacity-20">
                            <Plus size={48} strokeWidth={1} />
                            <p className="text-[10px] font-black uppercase tracking-widest mt-4">Nessun contenuto</p>
                        </div>
                    ) : (
                        visibleEntities.map(item => (
                            <div 
                              key={item.id} 
                              onClick={() => item.isCollection ? handleEnterFolder(item) : handleSetSelectedId(item.id)} 
                              className="p-4 rounded-[36px] bg-white/[0.04] border border-white/5 flex items-center gap-5 active:bg-white/10 transition-colors"
                            >
                               <div className="w-14 h-20 rounded-2xl overflow-hidden flex-shrink-0 bg-zinc-800 shadow-md">
                                    <FadeImage src={getEffectiveImage(item)} className="w-full h-full" alt={item.title} />
                               </div>
                               <div className="flex-1 min-w-0">
                                  <h4 className="text-[14px] font-black uppercase text-white truncate mb-0.5">{item.title}</h4>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">
                                        {item.isCollection ? '' : `N. ${item.volumeNumber || '1'}`}
                                    </span>
                                  </div>
                               </div>
                               <div className={`w-10 h-10 rounded-full flex items-center justify-center border border-white/5 ${item.isCollection ? 'bg-white/5 text-white/40' : getStatusUI(item.status).bg + ' ' + getStatusUI(item.status).color}`}>
                                  {item.isCollection ? <Folder size={14} /> : React.cloneElement(getStatusUI(item.status).icon as React.ReactElement<any>, { size: 14 })}
                               </div>
                            </div>
                        ))
                    )}
                </div>
             </div>
             
             <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center gap-6 z-40 px-6">
                <button onClick={() => setConfirmAction({ type: 'collection', id: currentFolder.id, title: currentFolder.title })} className="w-16 h-16 rounded-[24px] bg-white/10 backdrop-blur-xl border border-white/10 flex items-center justify-center shadow-xl active:bg-red-500/20 transition-colors">
                    <Trash2 size={22} className="text-zinc-400" />
                </button>
                <button onClick={handleAddItemToCurrentContext} className="w-20 h-20 rounded-[32px] bg-white text-black flex items-center justify-center shadow-2xl active:scale-95 transition-transform">
                    <Plus size={36} strokeWidth={2.5} />
                </button>
                <button onClick={() => handleEditItem(currentFolder)} className="w-16 h-16 rounded-[24px] bg-white/10 backdrop-blur-xl border border-white/10 flex items-center justify-center shadow-xl active:bg-white/20 transition-colors">
                    <Edit3 size={22} className="text-zinc-400" />
                </button>
             </div>
          </motion.div>
        ) : (
          <motion.div 
            key="main" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="flex flex-col h-full overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            style={{ touchAction: 'pan-y' }}
          >
             <header className="px-6 pt-16 pb-4">
                <div className="flex items-center justify-between mb-6">
                   <h1 className="text-4xl font-black uppercase tracking-tighter">Media</h1>
                   <div className="flex bg-white/5 rounded-2xl p-1 border border-white/10 scale-90">
                      <button onClick={() => setViewMode('grid')} className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white text-black shadow-md' : 'text-zinc-600'}`}><LayoutGrid size={18}/></button>
                      <button onClick={() => setViewMode('list')} className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white text-black shadow-md' : 'text-zinc-600'}`}><List size={18}/></button>
                   </div>
                </div>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                   {['book', 'movie', 'game', 'drawing'].map(type => (
                     <button key={type} onClick={() => onSectionChange(type as any)} className={`px-5 py-3 rounded-2xl text-[9px] font-black uppercase tracking-[0.15em] transition-all border ${activeSection === type ? 'bg-white text-black border-white shadow-xl' : 'bg-white/5 text-zinc-500 border-white/5'}`}>{type === 'movie' ? 'Video' : type}</button>
                   ))}
                </div>
             </header>

             <div ref={mainScrollRef} className="flex-1 overflow-y-auto no-scrollbar px-6 pt-2 relative z-0">
                <div className="min-h-full flex flex-col justify-end pb-32">
                    {viewMode === 'grid' ? (
                      <div className="grid grid-cols-2 gap-6">
                        {visibleEntities.length > 0 ? visibleEntities.map((item) => (
                          <div 
                            key={item.id} 
                            onClick={() => item.isCollection ? handleEnterFolder(item) : handleSetSelectedId(item.id)} 
                            className="flex flex-col gap-3 group active:scale-95 transition-transform"
                          >
                             <div className="px-1">
                                <h4 className="text-[12px] font-black uppercase tracking-tighter text-white truncate leading-none">{item.title}</h4>
                             </div>
                             <div className="w-full aspect-[2/3] relative">
                                <div className="w-full h-full rounded-[36px] overflow-hidden border border-white/10 relative shadow-xl bg-zinc-900 z-10">
                                    <FadeImage src={getEffectiveImage(item)} className="w-full h-full" alt={item.title} />
                                    {item.isCollection && (
                                        <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center">
                                            <Folder size={14} className="text-white" />
                                        </div>
                                    )}
                                </div>
                             </div>
                          </div>
                        )) : (
                            <div className="col-span-2 flex flex-col items-center justify-center h-48 opacity-20">
                                <p className="text-[9px] font-black uppercase tracking-widest">Lista vuota</p>
                            </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {visibleEntities.length > 0 ? visibleEntities.sort((a,b) => (b.completedDate||'').localeCompare(a.completedDate||'')).map(item => (
                          <div key={item.id} onClick={() => item.isCollection ? handleEnterFolder(item) : handleSetSelectedId(item.id)} className="p-4 rounded-[32px] bg-white/[0.03] border border-white/5 flex items-center gap-5 active:bg-white/10 transition-colors">
                             <div className="w-14 h-20 rounded-2xl overflow-hidden flex-shrink-0 bg-zinc-800 shadow-md">
                                <FadeImage src={getEffectiveImage(item)} className="w-full h-full" alt={item.title} />
                             </div>
                             <div className="flex-1 min-w-0">
                                <h4 className="text-[14px] font-black uppercase text-white truncate">{item.title}</h4>
                                <span className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest">{item.isCollection ? '' : item.seriesTitle || 'Singolo'}</span>
                             </div>
                             <div className={`w-9 h-9 rounded-full flex items-center justify-center border border-white/5 ${item.isCollection ? 'bg-white/5' : getStatusUI(item.status).bg} ${item.isCollection ? 'text-white/20' : getStatusUI(item.status).color}`}>
                                {item.isCollection ? <Folder size={14} /> : React.cloneElement(getStatusUI(item.status).icon as React.ReactElement<any>, { size: 14 })}
                             </div>
                          </div>
                        )) : (
                            <div className="flex flex-col items-center justify-center h-48 opacity-20">
                                <p className="text-[9px] font-black uppercase tracking-widest">Lista vuota</p>
                            </div>
                        )}
                      </div>
                    )}
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {confirmAction && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setConfirmAction(null)} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110]" />
            <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 10 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 10 }}
               className="fixed left-6 right-6 bottom-32 bg-[#121212] rounded-[32px] p-6 z-[120] border border-white/10 shadow-2xl"
            >
                <div className="flex flex-col items-center text-center">
                    <h3 className="text-xl font-bold mb-2">Elimina {confirmAction.type === 'collection' ? 'Cartella' : 'Elemento'}?</h3>
                    <p className="text-zinc-500 text-xs mb-6 px-4 leading-relaxed">
                        Vuoi davvero eliminare <span className="text-white font-bold">"{confirmAction.title}"</span>?
                    </p>
                    <div className="flex w-full gap-3">
                        <button onClick={() => setConfirmAction(null)} className="flex-1 py-4 rounded-[20px] bg-white/5 font-bold text-zinc-400 active:bg-white/10 text-xs uppercase tracking-widest">No</button>
                        <button onClick={executeDelete} className="flex-1 py-4 rounded-[20px] bg-red-500 font-bold text-white shadow-lg active:scale-95 transition-transform text-xs uppercase tracking-widest">Si</button>
                    </div>
                </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MediaView;
