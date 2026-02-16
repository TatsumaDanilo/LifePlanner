
export type TabType = 'home' | 'daily' | 'habits' | 'media';

export interface MicroHabit {
  id: string;
  title: string;
  subHabits?: MicroHabit[]; // Nested sub-habits
}

export interface Habit {
  id: string;
  name: string;
  description?: string;
  timeOfDay: 'morning' | 'evening' | 'any'; 
  color: string; 
  goal: number;
  increment?: number; // Added property
  unit: 'times' | 'minutes' | 'kg' | 'lbs';
  streak: number;
  // History can now store a number (legacy/simple) OR an object with completed micro-habit IDs
  history: { [key: string]: number | { completedIds: string[] } }; 
  
  // New structural fields
  structure?: MicroHabit[]; // Default structure
  dailyStructures?: { [dayIndex: number]: MicroHabit[] }; // 0 (Sun) - 6 (Sat) overrides

  // Notification settings
  reminders?: { time: string; days: number[] }[];
  
  // Smart Stacking
  stackTrigger?: string; // Name of the activity that triggers this habit (e.g. "Caffè")
  stackedAfterId?: string; // ID of the activity that triggers this habit
}

export interface LogEntry {
  id: string;
  habitId: string;
  date: string;
  value: number; 
}

export interface MediaItem {
  id: string;
  type: 'book' | 'movie' | 'game' | 'drawing';
  title: string;
  seriesTitle?: string; 
  seasonNumber?: string; 
  volumeNumber?: number; 
  episodeNumber?: number; 
  image: string;
  status: 'completed' | 'ongoing' | 'paused';
  rating?: number;
  startDate?: string; 
  completedDate?: string; 
  description?: string;
  isCollection?: boolean; 
  parentId?: string; 
}

export interface DailyBlock {
  time: string; 
  activity: string;
  isFixed: boolean;
  habitId?: string; // Link to a tracked habit
  mediaId?: string; // Link to a specific media item
}

export interface AppState {
  habits: Habit[];
  logs: LogEntry[];
  media: MediaItem[];
  waterIntake: number;
  brainDump: string;
  dailyBlocks: DailyBlock[];
  dayEndTime: string; 
}
