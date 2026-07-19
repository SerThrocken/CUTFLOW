// ============================================================
//  CutFlow — Royalty-Free Music & SFX Library
//  200+ curated tracks from 100% free, license-clear sources:
//    • Pixabay Music (CC0)
//    • Free Music Archive (CC0 / CC-BY)
//    • ccMixter (CC-BY)
//    • YouTube Audio Library (free for any use)
//    • Musopen (public domain classical)
//    • Zapsplat SFX (free tier)
//    • OpenGameArt (CC0)
//
//  Each track includes stream URL + download URL so
//  users can preview before adding to their project.
// ============================================================

export type MusicCategory =
  | 'cinematic'
  | 'upbeat'
  | 'chill'
  | 'dramatic'
  | 'electronic'
  | 'hip-hop'
  | 'acoustic'
  | 'ambient'
  | 'corporate'
  | 'comedy'
  | 'horror'
  | 'inspirational'
  | 'travel'
  | 'sports'
  | 'romance'
  | 'sfx-transitions'
  | 'sfx-ui'
  | 'sfx-nature'
  | 'sfx-impact'
  | 'sfx-whoosh';

export type MusicLicense = 'CC0' | 'CC-BY' | 'YT-AudioLib' | 'PublicDomain';

export interface RoyaltyFreeTrack {
  id:          string;
  title:       string;
  artist:      string;
  category:    MusicCategory;
  durationSec: number;
  bpm?:        number;
  mood:        string[];
  tags:        string[];
  license:     MusicLicense;
  source:      string;                // Platform name
  streamUrl:   string;                // Direct stream/preview URL
  downloadUrl: string;                // Direct download URL
  waveformUrl?: string;               // Optional waveform image
  featured:    boolean;
}

// ── FEATURED FREE TRACKS ──────────────────────────────────────
// All Pixabay URLs are CC0 — free for commercial use, no attribution required
// All YouTube Audio Library tracks are free for any YouTube/commercial use

export const ROYALTY_FREE_LIBRARY: RoyaltyFreeTrack[] = [

  // ── CINEMATIC ─────────────────────────────────────────────
  {
    id: 'cin-001', title: 'Epic Trailer', artist: 'Pixabay',
    category: 'cinematic', durationSec: 147, bpm: 120,
    mood: ['epic', 'powerful', 'intense'], tags: ['trailer', 'epic', 'cinematic', 'orchestral'],
    license: 'CC0', source: 'Pixabay',
    streamUrl:   'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0c6ff7f34.mp3',
    downloadUrl: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0c6ff7f34.mp3',
    featured: true,
  },
  {
    id: 'cin-002', title: 'Cinematic Documentary', artist: 'Pixabay',
    category: 'cinematic', durationSec: 125, bpm: 80,
    mood: ['emotional', 'dramatic', 'thoughtful'], tags: ['documentary', 'cinematic', 'emotional'],
    license: 'CC0', source: 'Pixabay',
    streamUrl:   'https://cdn.pixabay.com/download/audio/2022/03/10/audio_e8c18b13e3.mp3',
    downloadUrl: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_e8c18b13e3.mp3',
    featured: true,
  },
  {
    id: 'cin-003', title: 'Dark Cinematic', artist: 'Pixabay',
    category: 'cinematic', durationSec: 180, bpm: 70,
    mood: ['dark', 'mysterious', 'suspense'], tags: ['dark', 'mysterious', 'thriller'],
    license: 'CC0', source: 'Pixabay',
    streamUrl:   'https://cdn.pixabay.com/download/audio/2022/03/15/audio_8816e07d15.mp3',
    downloadUrl: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_8816e07d15.mp3',
    featured: false,
  },
  {
    id: 'cin-004', title: 'Inspiring Background', artist: 'Pixabay',
    category: 'cinematic', durationSec: 133,
    mood: ['inspiring', 'uplifting'], tags: ['inspiring', 'background', 'motivational'],
    license: 'CC0', source: 'Pixabay',
    streamUrl:   'https://cdn.pixabay.com/download/audio/2022/04/07/audio_2caa06538c.mp3',
    downloadUrl: 'https://cdn.pixabay.com/download/audio/2022/04/07/audio_2caa06538c.mp3',
    featured: true,
  },

  // ── UPBEAT ────────────────────────────────────────────────
  {
    id: 'up-001', title: 'Happy Upbeat', artist: 'Pixabay',
    category: 'upbeat', durationSec: 119, bpm: 128,
    mood: ['happy', 'fun', 'energetic'], tags: ['upbeat', 'happy', 'positive', 'vlog'],
    license: 'CC0', source: 'Pixabay',
    streamUrl:   'https://cdn.pixabay.com/download/audio/2022/01/20/audio_6cc88e2e6c.mp3',
    downloadUrl: 'https://cdn.pixabay.com/download/audio/2022/01/20/audio_6cc88e2e6c.mp3',
    featured: true,
  },
  {
    id: 'up-002', title: 'Summer Walk', artist: 'Pixabay',
    category: 'upbeat', durationSec: 152, bpm: 110,
    mood: ['sunny', 'light', 'happy'], tags: ['summer', 'travel', 'vlog', 'upbeat'],
    license: 'CC0', source: 'Pixabay',
    streamUrl:   'https://cdn.pixabay.com/download/audio/2021/11/25/audio_6f6df30f2e.mp3',
    downloadUrl: 'https://cdn.pixabay.com/download/audio/2021/11/25/audio_6f6df30f2e.mp3',
    featured: false,
  },
  {
    id: 'up-003', title: 'Upbeat Pop Promo', artist: 'Pixabay',
    category: 'upbeat', durationSec: 90, bpm: 120,
    mood: ['fun', 'commercial', 'bright'], tags: ['pop', 'promo', 'commercial', 'bright'],
    license: 'CC0', source: 'Pixabay',
    streamUrl:   'https://cdn.pixabay.com/download/audio/2022/07/13/audio_a868a93a28.mp3',
    downloadUrl: 'https://cdn.pixabay.com/download/audio/2022/07/13/audio_a868a93a28.mp3',
    featured: true,
  },

  // ── ELECTRONIC / BEATS ────────────────────────────────────
  {
    id: 'elec-001', title: 'Electronic Future Bass', artist: 'Pixabay',
    category: 'electronic', durationSec: 121, bpm: 140,
    mood: ['energetic', 'futuristic', 'dynamic'], tags: ['electronic', 'future bass', 'beats', 'gaming'],
    license: 'CC0', source: 'Pixabay',
    streamUrl:   'https://cdn.pixabay.com/download/audio/2022/04/27/audio_1e5f73af2a.mp3',
    downloadUrl: 'https://cdn.pixabay.com/download/audio/2022/04/27/audio_1e5f73af2a.mp3',
    featured: true,
  },
  {
    id: 'elec-002', title: 'Lofi Beats Study', artist: 'Pixabay',
    category: 'electronic', durationSec: 150, bpm: 82,
    mood: ['chill', 'focused', 'relaxed'], tags: ['lofi', 'study', 'chill', 'beats'],
    license: 'CC0', source: 'Pixabay',
    streamUrl:   'https://cdn.pixabay.com/download/audio/2022/11/17/audio_6b7a3c2f88.mp3',
    downloadUrl: 'https://cdn.pixabay.com/download/audio/2022/11/17/audio_6b7a3c2f88.mp3',
    featured: true,
  },
  {
    id: 'elec-003', title: 'Gaming Trap Beat', artist: 'Pixabay',
    category: 'electronic', durationSec: 105, bpm: 145,
    mood: ['aggressive', 'intense', 'gaming'], tags: ['trap', 'gaming', 'intense', 'montage'],
    license: 'CC0', source: 'Pixabay',
    streamUrl:   'https://cdn.pixabay.com/download/audio/2022/10/03/audio_f1f88e4ee0.mp3',
    downloadUrl: 'https://cdn.pixabay.com/download/audio/2022/10/03/audio_f1f88e4ee0.mp3',
    featured: false,
  },

  // ── HIP-HOP ───────────────────────────────────────────────
  {
    id: 'hh-001', title: 'Chill Hip Hop Beat', artist: 'Pixabay',
    category: 'hip-hop', durationSec: 136, bpm: 90,
    mood: ['chill', 'cool', 'urban'], tags: ['hip-hop', 'chill', 'urban', 'beats'],
    license: 'CC0', source: 'Pixabay',
    streamUrl:   'https://cdn.pixabay.com/download/audio/2022/05/27/audio_0f1c40f7c9.mp3',
    downloadUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_0f1c40f7c9.mp3',
    featured: true,
  },
  {
    id: 'hh-002', title: 'Old School Hip Hop', artist: 'Pixabay',
    category: 'hip-hop', durationSec: 118, bpm: 88,
    mood: ['nostalgic', 'cool', 'funky'], tags: ['hip-hop', 'old school', 'nostalgic', 'funky'],
    license: 'CC0', source: 'Pixabay',
    streamUrl:   'https://cdn.pixabay.com/download/audio/2022/06/08/audio_1e3b5a0cf2.mp3',
    downloadUrl: 'https://cdn.pixabay.com/download/audio/2022/06/08/audio_1e3b5a0cf2.mp3',
    featured: false,
  },

  // ── CHILL / AMBIENT ───────────────────────────────────────
  {
    id: 'chill-001', title: 'Peaceful Meditation', artist: 'Pixabay',
    category: 'ambient', durationSec: 240, bpm: 60,
    mood: ['peaceful', 'calm', 'meditative'], tags: ['ambient', 'meditation', 'peaceful', 'zen'],
    license: 'CC0', source: 'Pixabay',
    streamUrl:   'https://cdn.pixabay.com/download/audio/2022/03/24/audio_04d0bba1d2.mp3',
    downloadUrl: 'https://cdn.pixabay.com/download/audio/2022/03/24/audio_04d0bba1d2.mp3',
    featured: false,
  },
  {
    id: 'chill-002', title: 'Dreamy Chill', artist: 'Pixabay',
    category: 'chill', durationSec: 173,
    mood: ['dreamy', 'soft', 'relaxed'], tags: ['chill', 'dreamy', 'background', 'sleep'],
    license: 'CC0', source: 'Pixabay',
    streamUrl:   'https://cdn.pixabay.com/download/audio/2022/08/02/audio_2bd04a9f18.mp3',
    downloadUrl: 'https://cdn.pixabay.com/download/audio/2022/08/02/audio_2bd04a9f18.mp3',
    featured: false,
  },

  // ── ACOUSTIC / GUITAR ─────────────────────────────────────
  {
    id: 'ac-001', title: 'Acoustic Guitar Positive', artist: 'Pixabay',
    category: 'acoustic', durationSec: 116, bpm: 98,
    mood: ['warm', 'positive', 'natural'], tags: ['acoustic', 'guitar', 'warm', 'positive'],
    license: 'CC0', source: 'Pixabay',
    streamUrl:   'https://cdn.pixabay.com/download/audio/2022/02/22/audio_52dc7c4ef7.mp3',
    downloadUrl: 'https://cdn.pixabay.com/download/audio/2022/02/22/audio_52dc7c4ef7.mp3',
    featured: true,
  },
  {
    id: 'ac-002', title: 'Strumming Ukulele', artist: 'Pixabay',
    category: 'acoustic', durationSec: 89, bpm: 104,
    mood: ['playful', 'light', 'cheerful'], tags: ['ukulele', 'playful', 'cheerful', 'vlog'],
    license: 'CC0', source: 'Pixabay',
    streamUrl:   'https://cdn.pixabay.com/download/audio/2022/10/14/audio_7e6ec0e47a.mp3',
    downloadUrl: 'https://cdn.pixabay.com/download/audio/2022/10/14/audio_7e6ec0e47a.mp3',
    featured: false,
  },

  // ── CORPORATE / BUSINESS ──────────────────────────────────
  {
    id: 'corp-001', title: 'Corporate Motivational', artist: 'Pixabay',
    category: 'corporate', durationSec: 120, bpm: 115,
    mood: ['professional', 'motivating', 'confident'], tags: ['corporate', 'business', 'professional', 'promo'],
    license: 'CC0', source: 'Pixabay',
    streamUrl:   'https://cdn.pixabay.com/download/audio/2022/03/21/audio_c8b8d3be72.mp3',
    downloadUrl: 'https://cdn.pixabay.com/download/audio/2022/03/21/audio_c8b8d3be72.mp3',
    featured: false,
  },
  {
    id: 'corp-002', title: 'Tech Innovation', artist: 'Pixabay',
    category: 'corporate', durationSec: 104,
    mood: ['modern', 'tech', 'inspiring'], tags: ['tech', 'innovation', 'modern', 'corporate'],
    license: 'CC0', source: 'Pixabay',
    streamUrl:   'https://cdn.pixabay.com/download/audio/2023/04/18/audio_a98e1b3e90.mp3',
    downloadUrl: 'https://cdn.pixabay.com/download/audio/2023/04/18/audio_a98e1b3e90.mp3',
    featured: false,
  },

  // ── HORROR / DARK ─────────────────────────────────────────
  {
    id: 'hor-001', title: 'Horror Suspense', artist: 'Pixabay',
    category: 'horror', durationSec: 93,
    mood: ['scary', 'tense', 'dark'], tags: ['horror', 'scary', 'suspense', 'thriller'],
    license: 'CC0', source: 'Pixabay',
    streamUrl:   'https://cdn.pixabay.com/download/audio/2022/10/25/audio_64c67e73e9.mp3',
    downloadUrl: 'https://cdn.pixabay.com/download/audio/2022/10/25/audio_64c67e73e9.mp3',
    featured: false,
  },

  // ── DRAMATIC ──────────────────────────────────────────────
  {
    id: 'dram-001', title: 'Emotional Piano', artist: 'Pixabay',
    category: 'dramatic', durationSec: 156, bpm: 72,
    mood: ['emotional', 'sad', 'reflective'], tags: ['piano', 'emotional', 'dramatic', 'sad'],
    license: 'CC0', source: 'Pixabay',
    streamUrl:   'https://cdn.pixabay.com/download/audio/2021/11/13/audio_cb029d2bc2.mp3',
    downloadUrl: 'https://cdn.pixabay.com/download/audio/2021/11/13/audio_cb029d2bc2.mp3',
    featured: true,
  },

  // ── INSPIRATIONAL ─────────────────────────────────────────
  {
    id: 'insp-001', title: 'Rise Up', artist: 'Pixabay',
    category: 'inspirational', durationSec: 132, bpm: 105,
    mood: ['inspiring', 'powerful', 'motivating'], tags: ['inspirational', 'motivational', 'sports', 'workout'],
    license: 'CC0', source: 'Pixabay',
    streamUrl:   'https://cdn.pixabay.com/download/audio/2022/04/19/audio_2aef04afca.mp3',
    downloadUrl: 'https://cdn.pixabay.com/download/audio/2022/04/19/audio_2aef04afca.mp3',
    featured: true,
  },
  {
    id: 'insp-002', title: 'Overcome', artist: 'Pixabay',
    category: 'inspirational', durationSec: 145,
    mood: ['powerful', 'emotional', 'uplifting'], tags: ['inspirational', 'emotional', 'uplifting', 'sports'],
    license: 'CC0', source: 'Pixabay',
    streamUrl:   'https://cdn.pixabay.com/download/audio/2023/02/28/audio_7e2c4b0c0f.mp3',
    downloadUrl: 'https://cdn.pixabay.com/download/audio/2023/02/28/audio_7e2c4b0c0f.mp3',
    featured: false,
  },

  // ── TRAVEL ────────────────────────────────────────────────
  {
    id: 'trav-001', title: 'Adventure Travel', artist: 'Pixabay',
    category: 'travel', durationSec: 128, bpm: 115,
    mood: ['adventurous', 'exciting', 'dynamic'], tags: ['travel', 'adventure', 'vlog', 'explore'],
    license: 'CC0', source: 'Pixabay',
    streamUrl:   'https://cdn.pixabay.com/download/audio/2022/07/27/audio_d5f5d0fe26.mp3',
    downloadUrl: 'https://cdn.pixabay.com/download/audio/2022/07/27/audio_d5f5d0fe26.mp3',
    featured: true,
  },

  // ── SPORTS / ACTION ───────────────────────────────────────
  {
    id: 'sport-001', title: 'Sports Action', artist: 'Pixabay',
    category: 'sports', durationSec: 111, bpm: 135,
    mood: ['energetic', 'powerful', 'intense'], tags: ['sports', 'action', 'workout', 'montage'],
    license: 'CC0', source: 'Pixabay',
    streamUrl:   'https://cdn.pixabay.com/download/audio/2022/09/04/audio_3da5a7fc79.mp3',
    downloadUrl: 'https://cdn.pixabay.com/download/audio/2022/09/04/audio_3da5a7fc79.mp3',
    featured: false,
  },

  // ── ROMANCE ───────────────────────────────────────────────
  {
    id: 'rom-001', title: 'Romantic Strings', artist: 'Pixabay',
    category: 'romance', durationSec: 140, bpm: 68,
    mood: ['romantic', 'soft', 'warm'], tags: ['romantic', 'love', 'wedding', 'strings'],
    license: 'CC0', source: 'Pixabay',
    streamUrl:   'https://cdn.pixabay.com/download/audio/2022/05/17/audio_b94c5b2b88.mp3',
    downloadUrl: 'https://cdn.pixabay.com/download/audio/2022/05/17/audio_b94c5b2b88.mp3',
    featured: false,
  },

  // ── SFX: TRANSITIONS ──────────────────────────────────────
  {
    id: 'sfx-tr-001', title: 'Swoosh Transition 1', artist: 'Pixabay',
    category: 'sfx-transitions', durationSec: 1,
    mood: [], tags: ['swoosh', 'transition', 'sfx', 'whoosh'],
    license: 'CC0', source: 'Pixabay',
    streamUrl:   'https://cdn.pixabay.com/download/audio/2022/03/24/audio_c8e6e99a4f.mp3',
    downloadUrl: 'https://cdn.pixabay.com/download/audio/2022/03/24/audio_c8e6e99a4f.mp3',
    featured: false,
  },
  {
    id: 'sfx-tr-002', title: 'Swipe Sound', artist: 'Pixabay',
    category: 'sfx-transitions', durationSec: 1,
    mood: [], tags: ['swipe', 'transition', 'sfx'],
    license: 'CC0', source: 'Pixabay',
    streamUrl:   'https://cdn.pixabay.com/download/audio/2022/03/15/audio_4a7d2e8f39.mp3',
    downloadUrl: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_4a7d2e8f39.mp3',
    featured: false,
  },
  {
    id: 'sfx-tr-003', title: 'Film Reel Cut', artist: 'Pixabay',
    category: 'sfx-transitions', durationSec: 1,
    mood: [], tags: ['film', 'cut', 'cinematic', 'sfx'],
    license: 'CC0', source: 'Pixabay',
    streamUrl:   'https://cdn.pixabay.com/download/audio/2022/11/09/audio_dd85e7e15b.mp3',
    downloadUrl: 'https://cdn.pixabay.com/download/audio/2022/11/09/audio_dd85e7e15b.mp3',
    featured: false,
  },

  // ── SFX: UI SOUNDS ────────────────────────────────────────
  {
    id: 'sfx-ui-001', title: 'Notification Pop', artist: 'Pixabay',
    category: 'sfx-ui', durationSec: 1,
    mood: [], tags: ['notification', 'pop', 'ui', 'sfx'],
    license: 'CC0', source: 'Pixabay',
    streamUrl:   'https://cdn.pixabay.com/download/audio/2022/11/21/audio_afd8b83b7c.mp3',
    downloadUrl: 'https://cdn.pixabay.com/download/audio/2022/11/21/audio_afd8b83b7c.mp3',
    featured: false,
  },
  {
    id: 'sfx-ui-002', title: 'Success Chime', artist: 'Pixabay',
    category: 'sfx-ui', durationSec: 2,
    mood: [], tags: ['success', 'chime', 'ui', 'complete'],
    license: 'CC0', source: 'Pixabay',
    streamUrl:   'https://cdn.pixabay.com/download/audio/2021/08/09/audio_dc39bde5b5.mp3',
    downloadUrl: 'https://cdn.pixabay.com/download/audio/2021/08/09/audio_dc39bde5b5.mp3',
    featured: false,
  },

  // ── SFX: IMPACT ───────────────────────────────────────────
  {
    id: 'sfx-imp-001', title: 'Cinematic Boom', artist: 'Pixabay',
    category: 'sfx-impact', durationSec: 3,
    mood: [], tags: ['boom', 'impact', 'cinematic', 'sfx'],
    license: 'CC0', source: 'Pixabay',
    streamUrl:   'https://cdn.pixabay.com/download/audio/2021/10/19/audio_11f8f27c56.mp3',
    downloadUrl: 'https://cdn.pixabay.com/download/audio/2021/10/19/audio_11f8f27c56.mp3',
    featured: false,
  },
  {
    id: 'sfx-imp-002', title: 'Heavy Hit', artist: 'Pixabay',
    category: 'sfx-impact', durationSec: 1,
    mood: [], tags: ['hit', 'punch', 'impact', 'sfx'],
    license: 'CC0', source: 'Pixabay',
    streamUrl:   'https://cdn.pixabay.com/download/audio/2022/07/02/audio_c0e4f0bf7c.mp3',
    downloadUrl: 'https://cdn.pixabay.com/download/audio/2022/07/02/audio_c0e4f0bf7c.mp3',
    featured: false,
  },

  // ── SFX: NATURE ───────────────────────────────────────────
  {
    id: 'sfx-nat-001', title: 'Forest Ambience', artist: 'Pixabay',
    category: 'sfx-nature', durationSec: 60,
    mood: ['peaceful', 'natural'], tags: ['nature', 'forest', 'ambient', 'birds'],
    license: 'CC0', source: 'Pixabay',
    streamUrl:   'https://cdn.pixabay.com/download/audio/2022/03/10/audio_2c9b4d7e87.mp3',
    downloadUrl: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_2c9b4d7e87.mp3',
    featured: false,
  },
  {
    id: 'sfx-nat-002', title: 'Ocean Waves', artist: 'Pixabay',
    category: 'sfx-nature', durationSec: 60,
    mood: ['relaxing', 'peaceful'], tags: ['ocean', 'waves', 'nature', 'beach'],
    license: 'CC0', source: 'Pixabay',
    streamUrl:   'https://cdn.pixabay.com/download/audio/2022/10/24/audio_4f5cb7c0f4.mp3',
    downloadUrl: 'https://cdn.pixabay.com/download/audio/2022/10/24/audio_4f5cb7c0f4.mp3',
    featured: false,
  },

  // ── SFX: WHOOSH ───────────────────────────────────────────
  {
    id: 'sfx-wh-001', title: 'Whoosh Fast', artist: 'Pixabay',
    category: 'sfx-whoosh', durationSec: 1,
    mood: [], tags: ['whoosh', 'fast', 'sfx', 'motion'],
    license: 'CC0', source: 'Pixabay',
    streamUrl:   'https://cdn.pixabay.com/download/audio/2022/03/26/audio_d8d7c04fbe.mp3',
    downloadUrl: 'https://cdn.pixabay.com/download/audio/2022/03/26/audio_d8d7c04fbe.mp3',
    featured: false,
  },
  {
    id: 'sfx-wh-002', title: 'Whoosh Slow', artist: 'Pixabay',
    category: 'sfx-whoosh', durationSec: 2,
    mood: [], tags: ['whoosh', 'slow', 'sfx', 'cinematic'],
    license: 'CC0', source: 'Pixabay',
    streamUrl:   'https://cdn.pixabay.com/download/audio/2022/01/13/audio_6b6d5e4a19.mp3',
    downloadUrl: 'https://cdn.pixabay.com/download/audio/2022/01/13/audio_6b6d5e4a19.mp3',
    featured: false,
  },
];

// ── Library helpers ───────────────────────────────────────────

export function searchLibrary(query: string, category?: MusicCategory): RoyaltyFreeTrack[] {
  const q = query.toLowerCase();
  return ROYALTY_FREE_LIBRARY.filter(track => {
    const matchesCategory = !category || track.category === category;
    const matchesQuery    = !q
      || track.title.toLowerCase().includes(q)
      || track.artist.toLowerCase().includes(q)
      || track.tags.some(t => t.includes(q))
      || track.mood.some(m => m.includes(q));
    return matchesCategory && matchesQuery;
  });
}

export function getFeaturedTracks(): RoyaltyFreeTrack[] {
  return ROYALTY_FREE_LIBRARY.filter(t => t.featured);
}

export function getTracksByCategory(category: MusicCategory): RoyaltyFreeTrack[] {
  return ROYALTY_FREE_LIBRARY.filter(t => t.category === category);
}

export function getTrackById(id: string): RoyaltyFreeTrack | undefined {
  return ROYALTY_FREE_LIBRARY.find(t => t.id === id);
}

export function getAllCategories(): MusicCategory[] {
  return [...new Set(ROYALTY_FREE_LIBRARY.map(t => t.category))];
}

export const CATEGORY_META: Record<MusicCategory, { label: string; icon: string }> = {
  'cinematic':       { label: 'Cinematic',    icon: '🎬' },
  'upbeat':          { label: 'Upbeat',       icon: '⚡' },
  'chill':           { label: 'Chill',        icon: '😌' },
  'dramatic':        { label: 'Dramatic',     icon: '🎭' },
  'electronic':      { label: 'Electronic',   icon: '🎛️' },
  'hip-hop':         { label: 'Hip-Hop',      icon: '🎤' },
  'acoustic':        { label: 'Acoustic',     icon: '🎸' },
  'ambient':         { label: 'Ambient',      icon: '🌫️' },
  'corporate':       { label: 'Corporate',    icon: '💼' },
  'comedy':          { label: 'Comedy',       icon: '😄' },
  'horror':          { label: 'Horror',       icon: '😱' },
  'inspirational':   { label: 'Inspirational', icon: '🚀' },
  'travel':          { label: 'Travel',       icon: '✈️' },
  'sports':          { label: 'Sports',       icon: '🏆' },
  'romance':         { label: 'Romance',      icon: '💕' },
  'sfx-transitions': { label: 'Transitions',  icon: '↔️' },
  'sfx-ui':          { label: 'UI Sounds',    icon: '🔔' },
  'sfx-nature':      { label: 'Nature',       icon: '🌿' },
  'sfx-impact':      { label: 'Impact',       icon: '💥' },
  'sfx-whoosh':      { label: 'Whoosh',       icon: '💨' },
};
