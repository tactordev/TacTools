// TimerContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { Event } from "./calendar";

interface SessionType {
  name: string;
  id: number;
}

interface TimerContextType {
  sessionRunning: boolean;
  sessionTime: string;
  start: number;
  curSessionType: SessionType | null;
  setCurSessionType: React.Dispatch<React.SetStateAction<SessionType | null>>;
  toggleSession: () => void;
  stopAndSaveSession: () => void;
}

export const TimerContext = createContext<TimerContextType | undefined>(undefined);

    function formatSessionTime(ms: number): string {
        const totalSeconds = Math.floor(ms / 1000);
        const hrs = Math.floor(totalSeconds / 3600);
        const mins = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;

        const formHrs = String(hrs).padStart(2, "0");
        const formMins = String(mins).padStart(2, "0");
        const formSecs = String(secs).padStart(2, "0");

        return `${formHrs}:${formMins}.${formSecs}`;
}

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [sessionRunning, setSessionRunning] = useState<boolean>(() => {
        return localStorage.getItem("timer_running") === "true";
    });

    const [start, setStart] = useState<number>(() => {
        const saved = localStorage.getItem("timer_start");
        return saved ? Number(saved) : 0;
    });

    const [curSessionType, setCurSessionType] = useState<SessionType | null>(() => {
        const saved = localStorage.getItem("timer_cur_type");
        return saved ? JSON.parse(saved) : null;
    });

    const [sessionTime, setSessionTime] = useState<string>("00:00.00");

    useEffect(() => {
        if (curSessionType) {
            localStorage.setItem("timer_cur_type", JSON.stringify(curSessionType));
        }
    }, [curSessionType]);

    useEffect(() => {
        let interval: any;

        if (sessionRunning && start > 0) {
            const update = () => {
                const diff = Date.now() - start;
                setSessionTime(formatSessionTime(diff));
            };

            update();
            interval = setInterval(update, 1000);
        } else {
            setSessionTime("00:00.00");
        }

        return () => clearInterval(interval);
    }, [sessionRunning, start]);

    const saveToEvent = (startTime: number, curType: SessionType) => {
        const rawCals = localStorage.getItem("loaded-calendars");
        if (!rawCals) return;

        let calNeeded = null;
        let id = null;

        for (const idx of JSON.parse(rawCals)) {
            const rawCalInfo = localStorage.getItem(`calendar-${idx}`);
            if (!rawCalInfo) continue;
            if (JSON.parse(rawCalInfo).title !== `${curType.name.toLowerCase()}-${curType.id}`) continue;
            calNeeded = rawCalInfo;
            id = idx;
            break;
        }

        if (!calNeeded) {
            const max = JSON.parse(rawCals).reduce((m: number, i: string) => Math.max(m, Number(i)), 0) + 1;
            localStorage.setItem("loaded-calendars", JSON.stringify([...JSON.parse(rawCals), max]));
            id = max;
            calNeeded = JSON.stringify({
                importUrl: "",
                events: [] as Event[],
                title: `${curType.name.toLowerCase()}-${curType.id}`,
                visible: true,
            });
        }

        const curEvs = JSON.parse(calNeeded).events;
        const startObj = new Date(startTime);
        const endObj = new Date();

        const startMin = startObj.getHours() * 60 + startObj.getMinutes();
        const endMin = endObj.getHours() * 60 + endObj.getMinutes();

        const newEv = {
            uid: `${curType.id}-${startTime}`,
            name: `${curType.name} Session`,
            date: startObj.getTime(),
            start: startMin,
            end: Math.max(endMin, startMin + 1),
            calendar: JSON.parse(calNeeded).title,
            calendarId: JSON.parse(calNeeded).id,
            visible: JSON.parse(calNeeded).visible,
        } as Event;

        const newEvs = [...curEvs.filter((event: Event) => event.uid !== `${curType.id}-${startTime}`), newEv];
        localStorage.setItem(
            `calendar-${id}`,
            JSON.stringify({
                importUrl: JSON.parse(calNeeded).importUrl,
                events: newEvs,
                title: JSON.parse(calNeeded).title,
                visible: JSON.parse(calNeeded).visible,
            })
        );
    };

    const toggleSession = () => {
        if (!sessionRunning) {
            const now = Date.now();
            setStart(now);
            setSessionRunning(true);
            localStorage.setItem("timer_start", now.toString());
            localStorage.setItem("timer_running", "true");

            if (curSessionType) {
                saveToEvent(now, curSessionType);
            }
        } else {
            setSessionRunning(false);
            localStorage.setItem("timer_running", "false");
        }
    };

    const stopAndSaveSession = () => {
        if (!sessionRunning || !curSessionType) return;

        const [hrsStr, rest] = sessionTime.split(":");
        const [minsStr, secsStr] = rest.split(".");

        const today = new Date();
        const date = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;

        const hrs = parseInt(hrsStr, 10);
        const mins = parseInt(minsStr, 10);
        const secs = parseInt(secsStr, 10);

        const prevSessionsRaw = localStorage.getItem("prev-sessions");
        const prevSessions = prevSessionsRaw ? JSON.parse(prevSessionsRaw) : {};

        const session = {
            seshId: curSessionType.id,
            date: date,
            start: start,
            end: today.getTime(),
            length: hrs * 3600 + mins * 60 + secs,
        };

        const updatedSessions = {
            ...prevSessions,
            [`${date}//--//${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}.${today.getMilliseconds()}`]: session,
        };

        localStorage.setItem("prev-sessions", JSON.stringify(updatedSessions));
        saveToEvent(start, curSessionType);

        setSessionRunning(false);
        setStart(0);
        setSessionTime("00:00.00");
        localStorage.setItem("timer_running", "false");
        localStorage.removeItem("timer_start");
    };

    return (
        <TimerContext.Provider
        value={{
            sessionRunning,
            sessionTime,
            start,
            curSessionType,
            setCurSessionType,
            toggleSession,
            stopAndSaveSession,
        }}
        >
        {children}
        </TimerContext.Provider>
    );
};

export const useTimer = () => {
    const context = useContext(TimerContext);
    if (!context) {
        throw new Error("useTimer must be used within a TimerProvider");
    }
    return context;
};