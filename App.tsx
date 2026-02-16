
import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import HomeView from './views/HomeView';
import DailyView from './views/DailyView';
import HabitsView from './views/HabitsView';
import MediaView from './views/MediaView';
import BottomNav from './components/BottomNav';
import FloatingMenu from './components/FloatingMenu';
import BottomSheet from './components/BottomSheet';
import AddMediaForm from './components/AddMediaForm';
import AddHabitMenu from './components/AddHabitMenu'; 
import AddHabitForm from './components/AddHabitForm'; 
import { TabType, AppState, MediaItem, Habit } from './types';
import { initialData } from './utils/mockData';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [appState, setAppState] = useState<AppState>(initialData);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Form State management
  const [activeSheet, setActiveSheet] = useState<MediaItem['type'] | null>(null);
  const [formInitialData, setFormInitialData] = useState<Partial<MediaItem> | undefined>(undefined);
  
  // New state for Habit Creation Flow
  const [isHabitCreatorOpen, setIsHabitCreatorOpen] = useState(false);
  const [selectedHabitType, setSelectedHabitType] = useState<string | null>(null);
  const [habitToEdit, setHabitToEdit] = useState<Habit | undefined>(undefined);

  const [expandedHomeCategory, setExpandedHomeCategory] = useState<string | null>(null);
  const [viewDate, setViewDate] = useState(new Date());
  const [mediaCategory, setMediaCategory] = useState<MediaItem['type']>('book');
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
  const [isMagicPopulating, setIsMagicPopulating] = useState(false);
  const [isSeriesViewOpen, setIsSeriesViewOpen] = useState(false);

  // New state to track if habit detail overlay is open
  const [isHabitDetailOpen, setIsHabitDetailOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('thumb_planner_state');
    if (saved) {
      try {
        setAppState(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved state", e);
      }
    }
  }, []);

  // --- NOTIFICATION ENGINE ---
  useEffect(() => {
    // 1. Request Permission on Mount
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }

    // 2. Scheduler: check every 30 seconds
    const interval = setInterval(() => {
      if (!("Notification" in window) || Notification.permission !== "granted") return;

      const now = new Date();
      const currentTime = now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
      // WEEKDAYS are ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] so 0=Mon
      // JS getDay() is 0=Sun, 1=Mon. So:
      const currentDay = (now.getDay() + 6) % 7; 

      appState.habits.forEach(habit => {
        if (!habit.reminders) return;
        
        habit.reminders.forEach(reminder => {
          if (reminder.time === currentTime && reminder.days.includes(currentDay)) {
            // Simple prevention of duplicate notifications within the same minute
            const lastSentKey = `notif_${habit.id}_${currentTime}_${now.toDateString()}`;
            if (!sessionStorage.getItem(lastSentKey)) {
              new Notification(habit.name, {
                body: `È ora del tuo obiettivo: ${habit.name}!`,
                icon: "/favicon.ico", // Or app icon
                silent: false
              });
              sessionStorage.setItem(lastSentKey, "true");
            }
          }
        });
      });
    }, 30000); // Check every 30s to hit the minute

    return () => clearInterval(interval);
  }, [appState.habits]);

  const saveState = (newState: AppState) => {
    setAppState(newState);
    localStorage.setItem('thumb_planner_state', JSON.stringify(newState));
  };

  useEffect(() => {
    setExpandedHomeCategory(null);
    setIsMenuOpen(false);
    setActiveSheet(null);
    setFormInitialData(undefined);
    setIsHabitDetailOpen(false); 
    
    // Close and reset habit creator
    setIsHabitCreatorOpen(false);
    setSelectedHabitType(null);
    setHabitToEdit(undefined);
  }, [activeTab]);

  const onNavigateToMedia = (type: MediaItem['type'], id?: string) => {
    setMediaCategory(type);
    setSelectedMediaId(id || null);
    setActiveTab('media');
  };

  const handleAction = (action: string) => {
    const type = action === 'art' ? 'drawing' : action as MediaItem['type'];
    setFormInitialData(undefined);
    setActiveSheet(type);
  };

  const handleOpenFormWithData = (type: MediaItem['type'], data: Partial<MediaItem>) => {
    setFormInitialData(data);
    setActiveSheet(type);
  };

  const handleAddMedia = (data: Partial<MediaItem>) => {
    let newItemId: string | undefined;
    let newItemType: MediaItem['type'] | undefined;
    let isCollection = false;

    setAppState(prev => {
      let newState: AppState;
      
      if (data.id) {
        newState = {
          ...prev,
          media: prev.media.map(m => m.id === data.id ? { ...m, ...data } as MediaItem : m)
        };
      } else {
        const newItem: MediaItem = {
          id: Math.random().toString(36).substr(2, 9),
          title: data.title || 'Senza Titolo',
          type: data.type || 'book',
          image: data.image || '', 
          status: data.status || 'ongoing',
          description: data.description,
          startDate: data.startDate || new Date().toISOString().split('T')[0],
          completedDate: data.completedDate,
          seriesTitle: data.seriesTitle,
          seasonNumber: data.seasonNumber,
          volumeNumber: data.volumeNumber,
          isCollection: data.isCollection,
          parentId: data.parentId,
        };
        
        newItemId = newItem.id;
        newItemType = newItem.type;
        isCollection = !!newItem.isCollection;

        newState = {
          ...prev,
          media: [newItem, ...prev.media]
        };
      }
      
      localStorage.setItem('thumb_planner_state', JSON.stringify(newState));
      return newState;
    });

    setActiveSheet(null);
    setFormInitialData(undefined);

    setTimeout(() => {
      if (newItemId && newItemType && isCollection) {
        setActiveTab('media');
        setMediaCategory(newItemType);
      }
    }, 50);
  };

  const handleDeleteMedia = (id: string) => {
    setAppState(prev => {
      const getChildIds = (parentId: string): string[] => {
        const children = prev.media.filter(m => m.parentId === parentId);
        let ids = children.map(c => c.id);
        children.forEach(c => {
            if (c.isCollection) {
                ids = [...ids, ...getChildIds(c.id)];
            }
        });
        return ids;
      };

      const idsToDelete = [id, ...getChildIds(id)];
      const newState = {
        ...prev,
        media: prev.media.filter(m => !idsToDelete.includes(m.id))
      };
      
      localStorage.setItem('thumb_planner_state', JSON.stringify(newState));
      return newState;
    });
    setSelectedMediaId(null);
  };

  const handleUpdateState = (newState: AppState) => {
    saveState(newState);
  };
  
  const handleHabitTypeSelect = (type: string) => {
      setSelectedHabitType(type);
  };

  const handleEditHabit = (habit: Habit) => {
      let type = 'count';
      if (habit.unit === 'kg' || habit.unit === 'lbs') type = 'value';
      else if (habit.description?.includes('Start:')) type = 'quit';
      
      setHabitToEdit(habit);
      setSelectedHabitType(type);
      setIsHabitCreatorOpen(true);
  };

  const handleCreateHabit = (habitData: Partial<Habit>) => {
      if (habitData.id) {
           const updatedHabits = appState.habits.map(h => h.id === habitData.id ? { ...h, ...habitData } as Habit : h);
           handleUpdateState({ ...appState, habits: updatedHabits });
      } else {
           const newHabit: Habit = {
              id: Math.random().toString(36).substr(2, 9),
              name: habitData.name || 'New Habit',
              description: habitData.description,
              timeOfDay: habitData.timeOfDay || 'any',
              color: habitData.color || 'blue',
              goal: habitData.goal !== undefined ? habitData.goal : 1, 
              unit: habitData.unit || 'times',
              streak: 0,
              history: {},
              structure: habitData.structure, 
              dailyStructures: habitData.dailyStructures,
              reminders: habitData.reminders // Save reminders
           };
           handleUpdateState({ ...appState, habits: [...appState.habits, newHabit] });
      }
      
      setIsHabitCreatorOpen(false);
      setSelectedHabitType(null);
      setHabitToEdit(undefined);
  };

  const renderView = () => {
    switch (activeTab) {
      case 'home': return (
        <HomeView 
          state={appState} 
          expandedCategory={expandedHomeCategory} 
          setExpandedCategory={setExpandedHomeCategory}
          viewDate={viewDate}
          onDateChange={setViewDate}
          onNavigateToMedia={onNavigateToMedia}
        />
      );
      case 'daily': return <DailyView state={appState} setState={handleUpdateState} />;
      case 'habits': return (
        <HabitsView 
          state={appState} 
          setState={handleUpdateState} 
          onDetailOpen={setIsHabitDetailOpen}
          onAddHabit={() => { setHabitToEdit(undefined); setSelectedHabitType(null); setIsHabitCreatorOpen(true); }}
          onEditHabit={handleEditHabit}
        />
      );
      case 'media': return (
        <MediaView 
          state={appState} 
          activeSection={mediaCategory} 
          onSectionChange={setMediaCategory} 
          initialSelectedId={selectedMediaId}
          onSelectedIdChange={setSelectedMediaId}
          onDeleteMedia={handleDeleteMedia}
          onOpenForm={handleOpenFormWithData}
          onUpdateMedia={handleAddMedia}
          onSeriesViewChange={setIsSeriesViewOpen}
        />
      );
      default: return <HomeView state={appState} expandedCategory={expandedHomeCategory} setExpandedCategory={setExpandedHomeCategory} viewDate={viewDate} onDateChange={setViewDate} onNavigateToMedia={onNavigateToMedia} />;
    }
  };

  const isDetailViewOpen = (activeTab === 'media' && selectedMediaId !== null);
  const isScrollLocked = (activeTab === 'home' && !expandedHomeCategory) || isDetailViewOpen || activeSheet !== null || isHabitCreatorOpen || isMagicPopulating || (activeTab === 'media' && isSeriesViewOpen) || isHabitDetailOpen;
  
  const showGlobalUI = !isMagicPopulating && !(activeTab === 'media' && (selectedMediaId !== null || isSeriesViewOpen)) && !isHabitDetailOpen;
  
  const showFloatingMenu = showGlobalUI && activeTab !== 'home' && activeTab !== 'habits' && !isHabitDetailOpen;

  const bottomPadding = (activeTab === 'home' || activeTab === 'media' || activeTab === 'habits') ? 'pb-0' : (showGlobalUI ? 'pb-32' : 'pb-4');
  
  const containerPadding = 'p-0';

  return (
    <div className="relative w-full h-full max-w-[600px] mx-auto flex flex-col overflow-hidden bg-[#0a0a0a] text-white shadow-2xl md:border-x md:border-white/10 transform-gpu">
      <div className="absolute top-[-25%] left-[-15%] w-[90%] h-[70%] bg-purple-900/15 blur-[140px] rounded-full pointer-events-none z-0 mix-blend-screen" />
      <div className="absolute bottom-[-15%] right-[-15%] w-[80%] h-[70%] bg-blue-900/10 blur-[120px] rounded-full pointer-events-none z-0 mix-blend-screen" />

      <main 
        className={`relative z-10 flex-1 overflow-x-hidden no-scrollbar h-full ${isScrollLocked ? 'overflow-y-hidden' : 'overflow-y-auto'}`}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, scale: 1.01 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.99 }}
            transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
            className={`${containerPadding} h-full w-full ${bottomPadding}`}
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {showFloatingMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-32 right-6 z-50 pointer-events-auto"
          >
            <FloatingMenu 
              isOpen={isMenuOpen} 
              onToggle={() => setIsMenuOpen(!isMenuOpen)}
              onAction={handleAction}
              isSingleAction={activeTab === 'media'}
              onSingleAction={() => handleAction(mediaCategory)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showGlobalUI && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none"
          >
            <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeSheet && (
          <BottomSheet 
            title="" 
            onClose={() => { setActiveSheet(null); setFormInitialData(undefined); }}
          >
            <AddMediaForm 
              type={activeSheet} 
              initialData={formInitialData}
              onSave={handleAddMedia} 
              onCancel={() => { setActiveSheet(null); setFormInitialData(undefined); }} 
            />
          </BottomSheet>
        )}
      </AnimatePresence>

      {/* Habit Creation Sheet */}
      <AnimatePresence>
        {isHabitCreatorOpen && (
          <BottomSheet 
            title="" 
            onClose={() => { setIsHabitCreatorOpen(false); setSelectedHabitType(null); setHabitToEdit(undefined); }}
          >
             <AnimatePresence mode="wait">
                 {!selectedHabitType ? (
                    <motion.div key="menu" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                        <AddHabitMenu onSelect={handleHabitTypeSelect} />
                    </motion.div>
                 ) : (
                    <motion.div key="form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                        <AddHabitForm 
                            type={selectedHabitType} 
                            initialData={habitToEdit}
                            onBack={() => { setSelectedHabitType(null); setHabitToEdit(undefined); }} 
                            onSave={handleCreateHabit}
                        />
                    </motion.div>
                 )}
             </AnimatePresence>
          </BottomSheet>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
