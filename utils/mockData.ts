
import { AppState } from '../types';

// Helper to get today's date key for mock data so it appears immediately
const getTodayKey = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper to get dates relative to today
const getDateRelative = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const initialData: AppState = {
  habits: [
    {
      id: 'h1',
      name: 'Skincare',
      timeOfDay: 'morning',
      color: 'orange',
      goal: 1,
      unit: 'times',
      streak: 5,
      history: {
        [getDateRelative(-4)]: 1,
        [getDateRelative(-3)]: 1,
        [getDateRelative(-2)]: 1,
        [getDateRelative(-1)]: 0,
        [getTodayKey()]: 1
      }
    },
    {
      id: 'h2',
      name: 'Esercizi',
      timeOfDay: 'any',
      color: 'blue',
      goal: 1,
      unit: 'times',
      streak: 12,
      history: {
        [getDateRelative(-2)]: 1,
        [getDateRelative(-1)]: 1,
        [getTodayKey()]: 1
      }
    },
    {
      id: 'h3',
      name: 'Lettura',
      timeOfDay: 'evening',
      color: 'purple',
      goal: 30,
      unit: 'minutes',
      streak: 3,
      history: {
        [getTodayKey()]: 15
      }
    },
    {
      id: 'h5',
      name: 'Peso Corporeo',
      timeOfDay: 'morning',
      color: 'indigo',
      goal: 75,
      unit: 'kg',
      streak: 0,
      history: {
        [getDateRelative(-6)]: 83.2,
        [getDateRelative(-5)]: 82.8,
        [getDateRelative(-4)]: 82.5,
        [getDateRelative(-3)]: 82.1,
        [getDateRelative(-2)]: 81.8,
        [getDateRelative(-1)]: 81.5,
        [getTodayKey()]: 81.0
      }
    }
  ],
  logs: [],
  media: [
    // --- BOOKS ---
    {
      id: 'b1',
      type: 'book',
      title: 'Project Hail Mary',
      seriesTitle: 'Andy Weir',
      image: 'https://images.unsplash.com/photo-1614728263952-84ea256f9679?auto=format&fit=crop&q=80&w=400',
      status: 'ongoing',
      startDate: '2024-05-10',
      description: 'Un astronauta si sveglia su una nave spaziale senza memoria e deve salvare l\'umanità.'
    },
    {
      id: 'bc1',
      type: 'book',
      title: 'Dune Saga',
      image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&q=80&w=400',
      status: 'ongoing',
      isCollection: true,
      description: 'L\'epica saga fantascientifica di Frank Herbert.'
    },
    {
      id: 'b2',
      type: 'book',
      title: 'Dune',
      parentId: 'bc1',
      volumeNumber: 1,
      image: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=400',
      status: 'completed',
      completedDate: '2024-04-15',
      description: 'Il primo leggendario capitolo su Arrakis.'
    },

    // --- MOVIES / SERIES ---
    {
      id: 'm1',
      type: 'movie',
      title: 'Oppenheimer',
      image: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&q=80&w=400',
      status: 'completed',
      completedDate: '2024-05-20',
      description: 'Il film di Nolan sulla creazione della bomba atomica.'
    },
    {
      id: 'sc1',
      type: 'movie',
      title: 'Succession',
      image: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=400',
      status: 'ongoing',
      isCollection: true,
      description: 'La lotta per il potere all\'interno della famiglia Roy.'
    },
    {
      id: 's1e1',
      type: 'movie',
      title: 'Stagione 1',
      parentId: 'sc1',
      image: 'https://images.unsplash.com/photo-1524712245354-2c4e5e7121c0?auto=format&fit=crop&q=80&w=400',
      status: 'completed',
      completedDate: '2024-05-01'
    },

    // --- GAMES ---
    {
      id: 'g1',
      type: 'game',
      title: 'Elden Ring',
      seriesTitle: 'FromSoftware',
      image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=400',
      status: 'ongoing',
      startDate: '2024-02-25',
      description: 'Esplorazione dell\'Interregno alla ricerca delle rune.'
    },
    {
      id: 'g2',
      type: 'game',
      title: 'Hades',
      seriesTitle: 'Supergiant',
      image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=400',
      status: 'paused',
      description: 'Fuga dall\'Oltretomba nei panni di Zagreus.'
    },

    // --- DRAWINGS ---
    {
      id: 'd1',
      type: 'drawing',
      title: 'Studio di Anatomia',
      image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=400',
      status: 'completed',
      completedDate: '2024-05-22',
      description: 'Bozzetto a carboncino su carta ruvida.'
    },
    {
      id: 'd2',
      type: 'drawing',
      title: 'Paesaggio Cyberpunk',
      image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=400',
      status: 'ongoing',
      startDate: '2024-05-23',
      description: 'Arte digitale usando Procreate.'
    }
  ],
  waterIntake: 3,
  brainDump: 'Ricordarsi di prenotare il ristorante per sabato. Finire il modulo React entro sera. Fare la spesa (latte, pane, uova).',
  dailyBlocks: {
    [getTodayKey()]: [
      { time: '08:30', activity: 'Morning Skincare & Coffee', isFixed: true, habitId: 'h1' },
      { time: '09:00', activity: 'Deep Work: Project React', isFixed: false },
      { time: '11:00', activity: 'Meeting Team', isFixed: true },
      { time: '13:00', activity: 'Pranzo e Lettura Dune', isFixed: false, mediaId: 'b2' }
    ]
  },
  dayEndTime: '00:00'
};
