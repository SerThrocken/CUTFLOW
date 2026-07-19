// ============================================================
//  CutFlow — External Music Search Service
//  Searches YouTube Music, Spotify, Apple Music,
//  Amazon Music, SoundCloud, and Tidal.
//
//  Note: For tracks under copyright, CutFlow provides:
//    • Preview stream (30s) for selection
//    • Deep link to open in the native app
//    • Attribution info
//  Full track use requires the user's own subscription/license.
//  For YouTube: uses yt-dlp to extract audio for personal use.
// ============================================================

import axios from 'axios';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);

export interface ExternalTrack {
  id:          string;
  title:       string;
  artist:      string;
  album?:      string;
  durationSec: number;
  thumbnailUrl?: string;
  previewUrl?:  string;    // 30-second preview
  deepLink:    string;     // Open in native app
  platform:    'youtube' | 'spotify' | 'apple-music' | 'amazon-music' | 'soundcloud' | 'tidal';
  externalUrl: string;
  explicit:    boolean;
  year?:       number;
}

export type MusicPlatform = ExternalTrack['platform'];

// ═══════════════════════════════════════════════════════════════
//  YOUTUBE / YOUTUBE MUSIC
// ═══════════════════════════════════════════════════════════════

export class YouTubeMusicSearch {
  private apiKey: string;

  constructor(apiKey: string = process.env.YOUTUBE_API_KEY || '') {
    this.apiKey = apiKey;
  }

  async search(query: string, limit = 10): Promise<ExternalTrack[]> {
    if (!this.apiKey) return this.searchFallback(query, limit);

    try {
      const res = await axios.get('https://www.googleapis.com/youtube/v3/search', {
        params: {
          key:        this.apiKey,
          q:          `${query} music`,
          type:       'video',
          videoCategoryId: '10', // Music category
          maxResults: limit,
          part:       'snippet',
        },
      });

      return (res.data.items || []).map((item: any): ExternalTrack => ({
        id:          item.id.videoId,
        title:       item.snippet.title,
        artist:      item.snippet.channelTitle,
        durationSec: 0, // Need separate details call for duration
        thumbnailUrl: item.snippet.thumbnails?.medium?.url,
        deepLink:    `https://music.youtube.com/search?q=${encodeURIComponent(item.snippet.title)}`,
        externalUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        platform:    'youtube',
        explicit:    false,
      }));
    } catch (err) {
      console.error('[YouTube] Search failed:', err);
      return this.searchFallback(query, limit);
    }
  }

  // Fallback: use YouTube search URL without API key
  private async searchFallback(query: string, limit: number): Promise<ExternalTrack[]> {
    const encodedQuery = encodeURIComponent(query + ' music');
    return [{
      id:          `yt-search-${Date.now()}`,
      title:       `Search: "${query}"`,
      artist:      'YouTube Music',
      durationSec: 0,
      deepLink:    `https://music.youtube.com/search?q=${encodedQuery}`,
      externalUrl: `https://www.youtube.com/results?search_query=${encodedQuery}&sp=EgIQAQ%3D%3D`,
      platform:    'youtube',
      explicit:    false,
    }];
  }

  /**
   * Download audio from YouTube URL using yt-dlp (for personal use).
   * yt-dlp must be installed: pip install yt-dlp
   */
  async downloadAudio(youtubeUrl: string, outputDir: string): Promise<string> {
    const outputPath = path.join(outputDir, `%(title)s.%(ext)s`);
    fs.mkdirSync(outputDir, { recursive: true });

    try {
      await execAsync(
        `yt-dlp -x --audio-format mp3 --audio-quality 192K ` +
        `-o "${outputPath}" "${youtubeUrl}"`
      );

      // Find the downloaded file
      const files = fs.readdirSync(outputDir).filter(f => f.endsWith('.mp3'));
      return files.length > 0 ? path.join(outputDir, files[files.length - 1]) : '';
    } catch (err) {
      throw new Error(`yt-dlp failed: ${(err as Error).message}. Install yt-dlp: pip install yt-dlp`);
    }
  }
}

// ═══════════════════════════════════════════════════════════════
//  SPOTIFY
// ═══════════════════════════════════════════════════════════════

export class SpotifySearch {
  private clientId:     string;
  private clientSecret: string;
  private accessToken   = '';
  private tokenExpiry   = 0;

  constructor(
    clientId:     string = process.env.SPOTIFY_CLIENT_ID     || '',
    clientSecret: string = process.env.SPOTIFY_CLIENT_SECRET || ''
  ) {
    this.clientId     = clientId;
    this.clientSecret = clientSecret;
  }

  private async getAccessToken(): Promise<string> {
    if (Date.now() < this.tokenExpiry && this.accessToken) return this.accessToken;

    const res = await axios.post(
      'https://accounts.spotify.com/api/token',
      new URLSearchParams({ grant_type: 'client_credentials' }),
      {
        headers: {
          Authorization: `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    this.accessToken = res.data.access_token;
    this.tokenExpiry = Date.now() + (res.data.expires_in - 60) * 1000;
    return this.accessToken;
  }

  async search(query: string, limit = 10): Promise<ExternalTrack[]> {
    if (!this.clientId || !this.clientSecret) {
      return this.buildDeepLinkResult(query);
    }

    try {
      const token = await this.getAccessToken();
      const res   = await axios.get('https://api.spotify.com/v1/search', {
        params: { q: query, type: 'track', limit },
        headers: { Authorization: `Bearer ${token}` },
      });

      return (res.data.tracks?.items || []).map((track: any): ExternalTrack => ({
        id:          track.id,
        title:       track.name,
        artist:      track.artists.map((a: any) => a.name).join(', '),
        album:       track.album?.name,
        durationSec: Math.floor(track.duration_ms / 1000),
        thumbnailUrl: track.album?.images?.[1]?.url,
        previewUrl:  track.preview_url, // Spotify provides 30-second previews
        deepLink:    `spotify:track:${track.id}`,
        externalUrl: track.external_urls.spotify,
        platform:    'spotify',
        explicit:    track.explicit,
        year:        parseInt(track.album?.release_date?.split('-')[0] || '0'),
      }));
    } catch (err) {
      console.error('[Spotify] Search failed:', err);
      return this.buildDeepLinkResult(query);
    }
  }

  private buildDeepLinkResult(query: string): ExternalTrack[] {
    return [{
      id:          `spotify-search-${Date.now()}`,
      title:       `Search: "${query}"`,
      artist:      'Spotify',
      durationSec: 0,
      deepLink:    `spotify:search:${encodeURIComponent(query)}`,
      externalUrl: `https://open.spotify.com/search/${encodeURIComponent(query)}`,
      platform:    'spotify',
      explicit:    false,
    }];
  }
}

// ═══════════════════════════════════════════════════════════════
//  APPLE MUSIC
// ═══════════════════════════════════════════════════════════════

export class AppleMusicSearch {
  private developerToken: string;

  constructor(developerToken: string = process.env.APPLE_MUSIC_TOKEN || '') {
    this.developerToken = developerToken;
  }

  async search(query: string, limit = 10): Promise<ExternalTrack[]> {
    if (!this.developerToken) return this.buildDeepLinkResult(query);

    try {
      const res = await axios.get('https://api.music.apple.com/v1/catalog/us/search', {
        params: { term: query, types: 'songs', limit },
        headers: { Authorization: `Bearer ${this.developerToken}` },
      });

      const songs = res.data.results?.songs?.data || [];
      return songs.map((song: any): ExternalTrack => ({
        id:          song.id,
        title:       song.attributes.name,
        artist:      song.attributes.artistName,
        album:       song.attributes.albumName,
        durationSec: Math.floor(song.attributes.durationInMillis / 1000),
        thumbnailUrl: song.attributes.artwork?.url?.replace('{w}', '200').replace('{h}', '200'),
        previewUrl:  song.attributes.previews?.[0]?.url,
        deepLink:    `music://music.apple.com/us/album/${song.attributes.albumName}?i=${song.id}`,
        externalUrl: song.attributes.url,
        platform:    'apple-music',
        explicit:    song.attributes.contentRating === 'explicit',
        year:        parseInt(song.attributes.releaseDate?.split('-')[0] || '0'),
      }));
    } catch (err) {
      console.error('[Apple Music] Search failed:', err);
      return this.buildDeepLinkResult(query);
    }
  }

  private buildDeepLinkResult(query: string): ExternalTrack[] {
    return [{
      id:          `apple-search-${Date.now()}`,
      title:       `Search: "${query}"`,
      artist:      'Apple Music',
      durationSec: 0,
      deepLink:    `music://music.apple.com/search?term=${encodeURIComponent(query)}`,
      externalUrl: `https://music.apple.com/us/search?term=${encodeURIComponent(query)}`,
      platform:    'apple-music',
      explicit:    false,
    }];
  }
}

// ═══════════════════════════════════════════════════════════════
//  AMAZON MUSIC
// ═══════════════════════════════════════════════════════════════

export class AmazonMusicSearch {
  // Amazon Music does not have a public search API.
  // We build a deep link into the Amazon Music app/web.

  async search(query: string): Promise<ExternalTrack[]> {
    return [{
      id:          `amazon-search-${Date.now()}`,
      title:       `Search: "${query}"`,
      artist:      'Amazon Music',
      durationSec: 0,
      deepLink:    `amznmp3://search/${encodeURIComponent(query)}`,
      externalUrl: `https://music.amazon.com/search/${encodeURIComponent(query)}`,
      platform:    'amazon-music',
      explicit:    false,
    }];
  }
}

// ═══════════════════════════════════════════════════════════════
//  SOUNDCLOUD
// ═══════════════════════════════════════════════════════════════

export class SoundCloudSearch {
  private clientId: string;

  constructor(clientId: string = process.env.SOUNDCLOUD_CLIENT_ID || '') {
    this.clientId = clientId;
  }

  async search(query: string, limit = 10): Promise<ExternalTrack[]> {
    if (!this.clientId) return this.buildDeepLinkResult(query);

    try {
      const res = await axios.get('https://api-v2.soundcloud.com/search/tracks', {
        params: { q: query, client_id: this.clientId, limit },
      });

      return (res.data.collection || []).map((track: any): ExternalTrack => ({
        id:          String(track.id),
        title:       track.title,
        artist:      track.user.username,
        durationSec: Math.floor(track.duration / 1000),
        thumbnailUrl: track.artwork_url,
        previewUrl:  track.preview_url,
        deepLink:    `soundcloud://sounds:${track.id}`,
        externalUrl: track.permalink_url,
        platform:    'soundcloud',
        explicit:    false,
      }));
    } catch {
      return this.buildDeepLinkResult(query);
    }
  }

  private buildDeepLinkResult(query: string): ExternalTrack[] {
    return [{
      id:          `sc-search-${Date.now()}`,
      title:       `Search: "${query}"`,
      artist:      'SoundCloud',
      durationSec: 0,
      deepLink:    `soundcloud://search/${encodeURIComponent(query)}`,
      externalUrl: `https://soundcloud.com/search?q=${encodeURIComponent(query)}`,
      platform:    'soundcloud',
      explicit:    false,
    }];
  }
}

// ═══════════════════════════════════════════════════════════════
//  TIDAL
// ═══════════════════════════════════════════════════════════════

export class TidalSearch {
  private token: string;

  constructor(token: string = process.env.TIDAL_TOKEN || '') {
    this.token = token;
  }

  async search(query: string, limit = 10): Promise<ExternalTrack[]> {
    if (!this.token) return this.buildDeepLinkResult(query);

    try {
      const res = await axios.get('https://openapi.tidal.com/v2/searchresults', {
        params:  { query, include: 'tracks', 'page[size]': limit },
        headers: { Authorization: `Bearer ${this.token}`, Accept: 'application/vnd.api+json' },
      });

      const tracks = res.data.data?.[0]?.relationships?.tracks?.data || [];
      return tracks.map((t: any): ExternalTrack => ({
        id:          t.id,
        title:       t.attributes?.title || '',
        artist:      t.attributes?.artistName || '',
        durationSec: Math.floor((t.attributes?.duration || 0) / 1000),
        deepLink:    `tidal://track/${t.id}`,
        externalUrl: `https://tidal.com/browse/track/${t.id}`,
        platform:    'tidal',
        explicit:    t.attributes?.explicit || false,
      }));
    } catch {
      return this.buildDeepLinkResult(query);
    }
  }

  private buildDeepLinkResult(query: string): ExternalTrack[] {
    return [{
      id:          `tidal-search-${Date.now()}`,
      title:       `Search: "${query}"`,
      artist:      'Tidal',
      durationSec: 0,
      deepLink:    `tidal://search/${encodeURIComponent(query)}`,
      externalUrl: `https://tidal.com/search?q=${encodeURIComponent(query)}`,
      platform:    'tidal',
      explicit:    false,
    }];
  }
}

// ═══════════════════════════════════════════════════════════════
//  UNIFIED MUSIC SEARCH SERVICE
// ═══════════════════════════════════════════════════════════════

export class MusicSearchService {
  private youtube:     YouTubeMusicSearch;
  private spotify:     SpotifySearch;
  private appleMusic:  AppleMusicSearch;
  private amazonMusic: AmazonMusicSearch;
  private soundCloud:  SoundCloudSearch;
  private tidal:       TidalSearch;

  constructor() {
    this.youtube     = new YouTubeMusicSearch();
    this.spotify     = new SpotifySearch();
    this.appleMusic  = new AppleMusicSearch();
    this.amazonMusic = new AmazonMusicSearch();
    this.soundCloud  = new SoundCloudSearch();
    this.tidal       = new TidalSearch();
  }

  /**
   * Search all platforms simultaneously.
   * Returns results grouped by platform.
   */
  async searchAll(query: string, limit = 5): Promise<Record<MusicPlatform, ExternalTrack[]>> {
    const [youtube, spotify, apple, amazon, soundcloud, tidal] = await Promise.allSettled([
      this.youtube.search(query, limit),
      this.spotify.search(query, limit),
      this.appleMusic.search(query, limit),
      this.amazonMusic.search(query),
      this.soundCloud.search(query, limit),
      this.tidal.search(query, limit),
    ]);

    return {
      'youtube':      youtube.status     === 'fulfilled' ? youtube.value     : [],
      'spotify':      spotify.status     === 'fulfilled' ? spotify.value     : [],
      'apple-music':  apple.status       === 'fulfilled' ? apple.value       : [],
      'amazon-music': amazon.status      === 'fulfilled' ? amazon.value      : [],
      'soundcloud':   soundcloud.status  === 'fulfilled' ? soundcloud.value  : [],
      'tidal':        tidal.status       === 'fulfilled' ? tidal.value       : [],
    };
  }

  /**
   * Search a single platform.
   */
  async search(platform: MusicPlatform, query: string, limit = 10): Promise<ExternalTrack[]> {
    switch (platform) {
      case 'youtube':      return this.youtube.search(query, limit);
      case 'spotify':      return this.spotify.search(query, limit);
      case 'apple-music':  return this.appleMusic.search(query, limit);
      case 'amazon-music': return this.amazonMusic.search(query);
      case 'soundcloud':   return this.soundCloud.search(query, limit);
      case 'tidal':        return this.tidal.search(query, limit);
      default:             return [];
    }
  }

  /**
   * Download audio from YouTube for use as background music.
   */
  async downloadFromYouTube(youtubeUrl: string, outputDir: string): Promise<string> {
    return this.youtube.downloadAudio(youtubeUrl, outputDir);
  }
}

export const musicSearchService = new MusicSearchService();
export default musicSearchService;
