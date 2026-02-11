
import React, { useState, useEffect, useRef } from 'react';
import { MediaItem } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, Type as TypeIcon, Sparkles, Loader2, Folder, Info, Box, Upload, ArrowLeft } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface Props {
  type: MediaItem['type'];
  initialData?: Partial<MediaItem>;
  onSave: (item: Partial<MediaItem>) => void;
  onCancel: () => void;
}

// Interfaccia per i candidati trovati dall'AI
interface MetadataCandidate {
  posterUrl: string;
  fullTitle: string;
  synopsis: string;
  collectionName?: string;
  groupLabel?: string;
  volIndex?: number;
  year?: string;
}

const AddMediaForm: React.FC<Props> = ({ type, initialData, onSave, onCancel }) => {
  const isEditing = !!initialData?.id;
  const isInsideCollection = !!initialData?.parentId; 
  
  const [mode, setMode] = useState<'item' | 'collection'>(initialData?.isCollection ? 'collection' : 'item');
  
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  
  const [candidates, setCandidates] = useState<MetadataCandidate[]>([]);
  const [showCandidates, setShowCandidates] = useState(false);
  
  const [seriesTitle, setSeriesTitle] = useState('');
  const [seasonNumber, setSeasonNumber] = useState<string>('');
  const [volumeNumber, setVolumeNumber] = useState<number | undefined>();
  const [status, setStatus] = useState<MediaItem['status']>('ongoing');
  const [startDate, setStartDate] = useState('');
  const [completedDate, setCompletedDate] = useState('');

  const [collectionName, setCollectionName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData) {
        if (initialData.isCollection) {
            setMode('collection');
            setCollectionName(initialData.seriesTitle || initialData.title || '');
            setImageUrl(initialData.image || '');
            setDescription(initialData.description || '');
        } else {
            setMode('item');
            setTitle(initialData.title || '');
            setSeriesTitle(initialData.seriesTitle || '');
            setSeasonNumber(initialData.seasonNumber || '');
            setVolumeNumber(initialData.volumeNumber);
            setImageUrl(initialData.image || '');
            setDescription(initialData.description || '');
            setStatus(initialData.status || 'ongoing');
            setStartDate(initialData.startDate || '');
            setCompletedDate(initialData.completedDate || '');
        }
    } else {
        setStartDate(new Date().toISOString().split('T')[0]);
    }
  }, [initialData]);

  const getLabels = () => {
    switch(type) {
      case 'book': return { itemTitle: 'Titolo Libro', collTitle: 'Nome Autore o Collezione', desc: 'Sinossi o note...' };
      case 'game': return { itemTitle: 'Titolo Gioco', collTitle: 'Nome Collezione', desc: 'Sinossi o note...' };
      case 'drawing': return { itemTitle: 'Nome', collTitle: 'Nome Collezione', desc: 'Note' };
      case 'movie': 
      default: return { itemTitle: isInsideCollection ? 'Titolo Episodio' : 'Film', collTitle: 'Nome Serie TV / Collezione', desc: 'Sinossi o note...' };
    }
  };

  const labels = getLabels();

  const fetchMetadata = async () => {
    if (type === 'drawing') return;
    const query = mode === 'item' ? title : collectionName;
    if (!query.trim()) return;
    
    setIsFetching(true);
    setCandidates([]);
    setShowCandidates(false);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      let prompt = "";

      // Istruzioni MOLTO specifiche per evitare link rotti e velocizzare
      const imageInstruction = `
        IMPORTANTE PER LE IMMAGINI:
        1. Usa Google Search per trovare immagini REALI e ATTUALI.
        2. NON indovinare o costruire URL (es. non inventare link Wikipedia).
        3. Cerca URL che puntano direttamente a immagini (jpg/png) da fonti affidabili come store ufficiali (Steam, PS Store, Amazon), database (IMDb, Goodreads) o siti di notizie.
        4. Se non trovi un URL diretto sicuro al 100%, lascia il campo posterUrl vuoto o usa un URL generico di placeholder.
        5. L'URL deve essere accessibile pubblicamente senza autenticazione.
      `;
      
      if (mode === 'item') {
        prompt = `Sei un assistente veloce per metadati media (${type}). 
        Query utente: "${query}".
        ${imageInstruction}
        Trova 3 varianti (Massimo). Restituisci SOLO un ARRAY JSON valido con: fullTitle, synopsis (breve in italiano), collectionName, posterUrl.`;
      } else {
        prompt = `Sei un assistente veloce per collezioni media (${type}). 
        Query utente: "${query}".
        ${imageInstruction}
        Trova 1-2 varianti. Restituisci SOLO un ARRAY JSON valido con: collectionName, synopsis (breve in italiano), posterUrl.`;
      }

      // USO DI GEMINI FLASH PER VELOCITÀ MASSIMA
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview", 
        contents: prompt,
        config: { 
            tools: [{googleSearch: {}}], 
            responseMimeType: "application/json",
            temperature: 0.3 // Bassa temperatura per essere più fattuale e meno creativo sugli URL
        }
      });
      
      const rawData = JSON.parse(response.text || '[]');
      const results: MetadataCandidate[] = Array.isArray(rawData) ? rawData : [rawData];
      if (results.length > 0) {
        setCandidates(results);
        setShowCandidates(true);
      }
    } catch (e) { 
      console.error(e); 
    } finally { 
      setIsFetching(false); 
    }
  };

  const handleSelectCandidate = (candidate: MetadataCandidate) => {
    if (mode === 'item') {
        setTitle(candidate.fullTitle || title);
        setSeriesTitle(candidate.collectionName || seriesTitle || '');
    } else {
        setCollectionName(candidate.collectionName || candidate.fullTitle || collectionName);
    }
    setDescription(candidate.synopsis || '');
    setImageUrl(candidate.posterUrl || '');
    setShowCandidates(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImageUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'item') {
        if (!title.trim()) return;
        const finalStatus = completedDate ? 'completed' : status;
        onSave({ id: initialData?.id, parentId: initialData?.parentId, title, seriesTitle: seriesTitle || undefined, seasonNumber: seasonNumber || undefined, volumeNumber: volumeNumber || undefined, description, image: imageUrl, type, status: finalStatus, startDate, completedDate, isCollection: false });
    } else {
        if (!collectionName.trim()) return;
        onSave({ id: initialData?.id, parentId: initialData?.parentId, title: collectionName, seriesTitle: collectionName, description, image: imageUrl, type, status: 'ongoing', isCollection: true, startDate: initialData?.startDate || new Date().toISOString().split('T')[0] });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full h-[75dvh] flex flex-col relative overflow-hidden">
      
      {/* OVERLAY CANDIDATES */}
      <AnimatePresence>
        {showCandidates && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="absolute inset-0 z-50 bg-[#121212] flex flex-col pt-2 px-6"
          >
             <div className="flex items-center justify-between mb-4">
               <button type="button" onClick={() => setShowCandidates(false)} className="flex items-center gap-2 text-zinc-400">
                  <ArrowLeft size={18} />
                  <span className="text-xs font-bold uppercase tracking-widest">Indietro</span>
               </button>
               <span className="text-xs font-black uppercase tracking-widest text-white">Scegli Risultato</span>
             </div>
             <div className="flex-1 overflow-y-auto no-scrollbar grid grid-cols-2 gap-4 pb-32">
                {candidates.map((cand, idx) => (
                  <motion.div key={idx} onClick={() => handleSelectCandidate(cand)} className="flex flex-col gap-2 cursor-pointer group">
                    <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-zinc-800 border border-white/10 group-active:scale-95 transition-transform">
                       {cand.posterUrl ? (
                         <img 
                            src={cand.posterUrl} 
                            alt={cand.fullTitle} 
                            className="w-full h-full object-cover" 
                            loading="lazy"
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).parentElement?.classList.add('bg-zinc-700');
                            }}
                         />
                       ) : (
                         <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                            <ImageIcon size={24} className="text-zinc-600" />
                         </div>
                       )}
                    </div>
                    <div className="px-1"><p className="text-[10px] font-black uppercase text-white truncate">{cand.fullTitle || cand.collectionName}</p></div>
                  </motion.div>
                ))}
             </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* COMPACT FLEX CONTENT AREA (NO SCROLL) */}
      <div className="flex-1 flex flex-col px-6 pb-28 pt-2 overflow-hidden">
        
        {/* 1. Flexible Description Area (TOP - Pushes everything down) */}
        {mode === 'item' ? (
             <div className="relative flex-1 min-h-0 flex flex-col mb-3">
                 <div className="absolute left-5 top-4 text-zinc-500 z-10 pointer-events-none"><Info size={18} /></div>
                 <textarea 
                    placeholder={labels.desc} 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                    className="w-full flex-1 bg-white/[0.03] border border-white/10 rounded-[32px] pt-4 pb-10 pl-12 pr-4 text-xs font-medium focus:outline-none shadow-inner resize-none" 
                 />
            </div>
        ) : (
             // Spacer for Collection mode to keep items at the bottom
             <div className="flex-1" />
        )}

        {/* 2. Date Inputs (Only Item Mode) */}
        {mode === 'item' && (
          <div className="flex gap-2 mb-3 flex-shrink-0">
            <div className="relative flex-1 h-12">
               <span className="absolute left-4 top-1.5 text-[7px] font-black uppercase text-zinc-500 tracking-widest">Inizio</span>
               <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full h-full bg-white/[0.03] border border-white/10 rounded-[20px] pt-4 pb-1 pl-4 pr-2 text-[10px] font-bold focus:outline-none shadow-inner text-white appearance-none" />
            </div>
            <div className="relative flex-1 h-12">
               <span className="absolute left-4 top-1.5 text-[7px] font-black uppercase text-zinc-500 tracking-widest">Fine</span>
               <input type="date" value={completedDate} onChange={(e) => setCompletedDate(e.target.value)} className="w-full h-full bg-white/[0.03] border border-white/10 rounded-[20px] pt-4 pb-1 pl-4 pr-2 text-[10px] font-bold focus:outline-none shadow-inner text-white appearance-none" />
            </div>
          </div>
        )}

        {/* 3. Image Input */}
        <div className="flex gap-2 items-center mb-3 flex-shrink-0">
            <div className="relative flex-1 h-12">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500"><ImageIcon size={18} /></div>
              <input type="text" placeholder="URL Immagine..." value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="w-full h-full bg-white/[0.03] border border-white/10 rounded-[24px] pl-12 pr-4 text-xs font-bold focus:outline-none shadow-inner truncate" />
            </div>
            <button type="button" onClick={() => fileInputRef.current?.click()} className="w-12 h-12 rounded-[24px] bg-white/[0.03] border border-white/10 flex items-center justify-center text-zinc-400 active:bg-white/10 transition-colors flex-shrink-0"><Upload size={18} /></button>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
        </div>

        {/* 4. Title Input */}
        {mode === 'item' ? (
            <div className="mb-3 flex-shrink-0">
                <div className="relative h-12">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500"><TypeIcon size={18} /></div>
                  <input autoFocus={!isEditing} type="text" placeholder={labels.itemTitle} value={title} onChange={(e) => setTitle(e.target.value)} className="w-full h-full bg-white/[0.03] border border-white/10 rounded-[24px] pl-12 pr-14 text-sm font-bold focus:outline-none focus:border-purple-500/50 transition-all shadow-inner" required />
                  {type !== 'drawing' && (
                    <button type="button" onClick={fetchMetadata} className="absolute right-1 top-1 bottom-1 w-10 rounded-[20px] bg-purple-600 text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform">
                        {isFetching ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                    </button>
                  )}
                </div>
            </div>
        ) : (
            <div className="mb-3 flex-shrink-0">
                <div className="relative h-12">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500"><Box size={18} /></div>
                    <input autoFocus={!isEditing} type="text" placeholder={labels.collTitle} value={collectionName} onChange={(e) => setCollectionName(e.target.value)} className="w-full h-full bg-white/[0.03] border border-white/10 rounded-[24px] pl-12 pr-14 text-sm font-bold focus:outline-none focus:border-purple-500/50 transition-all shadow-inner" required />
                    {type !== 'drawing' && (
                        <button type="button" onClick={fetchMetadata} className="absolute right-1 top-1 bottom-1 w-10 rounded-[20px] bg-purple-600 text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform">
                          {isFetching ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                        </button>
                    )}
                </div>
            </div>
        )}

        {/* 5. Toggle Switch (Bottom of content) */}
        {!isEditing && (
          <div className="flex bg-white/5 p-1 rounded-[20px] border border-white/5 flex-shrink-0">
              <button type="button" onClick={() => setMode('item')} className={`flex-1 py-2 rounded-[16px] text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${mode === 'item' ? 'bg-white text-black shadow-lg' : 'text-zinc-500'}`}><TypeIcon size={12} />Elemento</button>
              <button type="button" onClick={() => setMode('collection')} className={`flex-1 py-2 rounded-[16px] text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${mode === 'collection' ? 'bg-white text-black shadow-lg' : 'text-zinc-500'}`}><Folder size={12} />Collezione</button>
          </div>
        )}
      </div>

      {/* FIXED ACTION FOOTER WITH "VEDO NON VEDO" EFFECT */}
      <div 
        className="absolute bottom-0 left-0 right-0 z-40 px-6 pb-6 pt-10 bg-gradient-to-t from-black/60 to-transparent backdrop-blur-xl pointer-events-none"
        style={{
            maskImage: 'linear-gradient(to top, black 50%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to top, black 50%, transparent 100%)'
        }}
      >
        <div className="flex gap-4 pointer-events-auto">
          <button type="button" onClick={onCancel} className="flex-1 py-5 bg-zinc-900/50 border border-white/10 rounded-[28px] text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 active:bg-white/10 transition-colors backdrop-blur-md">Annulla</button>
          <button type="submit" onClick={(e) => { e.preventDefault(); handleSubmit(e as any); }} className="flex-1 py-5 bg-white text-black rounded-[28px] text-[10px] font-black uppercase tracking-[0.2em] active:scale-95 transition-all shadow-xl shadow-white/5">
              {isEditing ? 'Aggiorna' : 'Salva'}
          </button>
        </div>
      </div>
    </form>
  );
};

export default AddMediaForm;
