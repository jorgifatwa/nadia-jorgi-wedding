"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";

interface AudioContextType {
  isPlaying: boolean;
  playAudio: () => void;
  pauseAudio: () => void;
  toggleAudio: () => void;
  currentTime: number;
  duration: number;
  seekAudio: (time: number) => void;
}

const AudioContext = createContext<AudioContextType>({
  isPlaying: false,
  playAudio: () => {},
  pauseAudio: () => {},
  toggleAudio: () => {},
  currentTime: 0,
  duration: 48,
  seekAudio: () => {},
});

export const useWeddingAudio = () => useContext(AudioContext);

// The song starts (and loops back) at 0:11, skipping the intro
const START_SECONDS = 11;

export const WeddingAudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(48);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(encodeURI("/audio/Tems - Me & U (Acoustic Version) (320kbps).mp3"));
    audio.preload = "auto";
    audioRef.current = audio;

    const updateTime = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
      setCurrentTime(audio.currentTime);
    };

    // Keep the play/pause icons in sync with the real playback state (including pauses not triggered by our buttons)
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleMetadata = () => {
      if (audio.currentTime < START_SECONDS) audio.currentTime = START_SECONDS;
      updateTime();
    };
    // Manual loop instead of audio.loop so every repeat also starts at 0:11
    const handleEnded = () => {
      audio.currentTime = START_SECONDS;
      audio.play().catch(() => setIsPlaying(false));
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", handleMetadata);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", handleMetadata);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      audio.pause();
    };
  }, []);

  const playAudio = () => {
    if (audioRef.current) {
      // Covers a play before the metadata arrived, when the start position couldn't be set yet
      if (audioRef.current.currentTime < START_SECONDS) audioRef.current.currentTime = START_SECONDS;
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((err) => {
          console.log("Audio play error (waiting user gesture):", err);
        });
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleAudio = () => {
    if (isPlaying) {
      pauseAudio();
    } else {
      playAudio();
    }
  };

  const seekAudio = (time: number) => {
    if (audioRef.current) {
      // Never back into the skipped intro (the previous/next buttons seek to 0)
      const target = Math.max(time, START_SECONDS);
      audioRef.current.currentTime = target;
      setCurrentTime(target);
    }
  };

  return (
    <AudioContext.Provider
      value={{
        isPlaying,
        playAudio,
        pauseAudio,
        toggleAudio,
        currentTime,
        duration,
        seekAudio,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};
