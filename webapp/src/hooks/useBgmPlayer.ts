import { useState, useEffect, useRef, useCallback } from 'react';
import { bgmTracks } from '../config/bgm-tracks';

const STORAGE_KEY = 'mathdesk-bgm';

interface BgmStorage {
  enabled: boolean;
  volume: number;
  trackIndex: number;
}

function loadStorage(): BgmStorage {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        enabled: Boolean(parsed.enabled),
        volume: typeof parsed.volume === 'number' ? parsed.volume : 0.3,
        trackIndex: typeof parsed.trackIndex === 'number' ? parsed.trackIndex : 0,
      };
    }
  } catch {
    // ignore
  }
  return { enabled: false, volume: 0.3, trackIndex: 0 };
}

function saveStorage(state: BgmStorage): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function useBgmPlayer() {
  const stored = useRef(loadStorage());
  const [isPlaying, setIsPlaying] = useState(stored.current.enabled);
  const [volume, setVolume] = useState(stored.current.volume);
  const [trackIndex, setTrackIndex] = useState(stored.current.trackIndex);
  const [expanded, setExpanded] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasInteracted = useRef(false);

  // Create audio element once
  useEffect(() => {
    const audio = new Audio();
    audio.loop = false;
    audio.preload = 'auto';
    audioRef.current = audio;

    audio.addEventListener('ended', () => {
      setTrackIndex((prev) => {
        const next = (prev + 1) % bgmTracks.length;
        return next;
      });
    });

    return () => {
      audio.pause();
      audio.src = '';
      audioRef.current = null;
    };
  }, []);

  // Update audio source when track changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const safeIndex = trackIndex % bgmTracks.length;
    const track = bgmTracks[safeIndex];
    if (!track) return;

    audio.src = track.file;
    if (isPlaying && hasInteracted.current) {
      audio.play().catch(() => {
        // autoplay blocked — user hasn't interacted yet
      });
    }
  }, [trackIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update volume
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = volume;
    }
  }, [volume]);

  // Persist state
  useEffect(() => {
    saveStorage({ enabled: isPlaying, volume, trackIndex });
  }, [isPlaying, volume, trackIndex]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    hasInteracted.current = true;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      // Ensure source is set
      const safeIndex = trackIndex % bgmTracks.length;
      const track = bgmTracks[safeIndex];
      if (track && !audio.src.endsWith(track.file)) {
        audio.src = track.file;
      }
      audio.play().catch(() => {
        // autoplay blocked
      });
      setIsPlaying(true);
    }
  }, [isPlaying, trackIndex]);

  const nextTrack = useCallback(() => {
    setTrackIndex((prev) => (prev + 1) % bgmTracks.length);
  }, []);

  const prevTrack = useCallback(() => {
    setTrackIndex((prev) => (prev - 1 + bgmTracks.length) % bgmTracks.length);
  }, []);

  const changeVolume = useCallback((v: number) => {
    setVolume(Math.max(0, Math.min(1, v)));
  }, []);

  const toggleExpanded = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  const currentTrack = bgmTracks[trackIndex % bgmTracks.length];

  return {
    isPlaying,
    volume,
    currentTrack,
    trackIndex,
    expanded,
    togglePlay,
    nextTrack,
    prevTrack,
    changeVolume,
    toggleExpanded,
  };
}
