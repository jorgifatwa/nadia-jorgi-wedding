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

export const WeddingAudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(48);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(encodeURI("/audio/Tems - Me & U (Acoustic Version) (320kbps).mp3"));
    audio.loop = true;
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

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateTime);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handlePause);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateTime);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handlePause);
      audio.pause();
    };
  }, []);

  const playAudio = () => {
    if (audioRef.current) {
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
      audioRef.current.currentTime = time;
      setCurrentTime(time);
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
