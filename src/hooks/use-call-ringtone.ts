"use client";

import { useEffect, useRef } from "react";

// Creates a pleasant ringtone using the Web Audio API
// No external audio files needed — generates a tone programmatically
export const useCallRingtone = (shouldPlay: boolean, type: "incoming" | "outgoing" = "incoming") => {
    const audioContextRef = useRef<AudioContext | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!shouldPlay) {
            // Stop any existing ringtone
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            if (audioContextRef.current) {
                audioContextRef.current.close();
                audioContextRef.current = null;
            }
            return;
        }

        const playRingTone = () => {
            try {
                const ctx = new AudioContext();
                audioContextRef.current = ctx;

                const playBeep = (freq: number, startTime: number, duration: number, volume: number = 0.15) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();

                    osc.type = "sine";
                    osc.frequency.value = freq;

                    gain.gain.setValueAtTime(0, ctx.currentTime + startTime);
                    gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + startTime + 0.02);
                    gain.gain.setValueAtTime(volume, ctx.currentTime + startTime + duration - 0.05);
                    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + startTime + duration);

                    osc.connect(gain);
                    gain.connect(ctx.destination);

                    osc.start(ctx.currentTime + startTime);
                    osc.stop(ctx.currentTime + startTime + duration);
                };

                if (type === "incoming") {
                    // Discord-like incoming call: two-tone ring
                    playBeep(523.25, 0, 0.15, 0.12);     // C5
                    playBeep(659.25, 0.2, 0.15, 0.12);   // E5
                    playBeep(783.99, 0.4, 0.15, 0.12);   // G5
                    playBeep(659.25, 0.6, 0.15, 0.12);   // E5
                    playBeep(523.25, 0.8, 0.2, 0.12);    // C5
                } else {
                    // Outgoing call: simple repeating beep
                    playBeep(440, 0, 0.5, 0.08);          // A4 long beep
                }
            } catch (e) {
                // AudioContext not available
            }
        };

        // Play immediately
        playRingTone();

        // Repeat every 2.5 seconds for incoming, 3 seconds for outgoing
        const repeatInterval = type === "incoming" ? 2500 : 3000;
        intervalRef.current = setInterval(playRingTone, repeatInterval);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            if (audioContextRef.current) {
                audioContextRef.current.close();
                audioContextRef.current = null;
            }
        };
    }, [shouldPlay, type]);
};
