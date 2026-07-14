"use client";


import { AnimatePresence } from "framer-motion";
import Button from "../utils/button";
import ContextMenu from "../utils/context-menu";
import {
    ImportIcon
} from "lucide-react";
import { useState } from "react";

type Event = {
    id: number;
    name: string;
    date: number;
    start: number;
    end: number;
    calendar: string;
    calendarId: number;
    description?: string;
}

function Day(
    {
        type,
        events,
        setEvents
    }: {
        type: string;
        events: Event[];
        setEvents: (events: Event[]) => void;
    }
) {
    return (
        <div className="flex flex-col w-full items-center first:border-l-2 border-r-2 border-gray-100 h-full">
            <p className="w-full text-center font-semibold text-gray-600 h-6">
                {type}
            </p>
            <hr className="bg-gray-100 text-gray-100 w-full h-0.5 mt-0.5" />
            
            <div className="relative w-full h-[calc(100%-4rem)] mt-9">
                {
                    events.map((event: Event, index: number) => {
                        const dIndex = new Date(event.date).getDay();
                        const daysMap = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
                        const dayname = daysMap[dIndex];

                        const totalMinutes = 24 * 60;
                        const topPercent = (event.start / totalMinutes) * 100;
                        const heightPercent = ((event.end - event.start) / totalMinutes) * 100;

                        if (type.toLowerCase() === dayname) {
                            return (
                                <div 
                                    key={`event-${index}`} 
                                    className="absolute left-1 right-1 rounded-md p-1.5 text-xs font-medium bg-gray-100 overflow-hidden" 
                                    style={{top: `${topPercent}%`, height: `${heightPercent}%`}}
                                >
                                    <p className="font-bold truncate leading-none">{event.name}</p>
                                    <p className="text-[10px] text-blue-800 mt-0.5">
                                        {Math.floor(event.start / 60)}:{(event.start % 60).toString().padStart(2, '0')}
                                    </p>
                                </div>
                            )
                        }
                        return null;
                    })
                }
            </div>
        </div>
    );
}

function TimeLine() {
    const times = [...Array(25).keys()];
    return (
        <div className="flex flex-col h-[calc(100%-4rem)] w-fit mt-9 justify-between">
            {
                times.map((time, index) => {
                    const formattedTime = `${time.toString().padStart(2, '0')}:00`;
                    return (
                        <p key={`time-${index}`} className="text-gray-600/40 flex justify-center text-[11px] font-mono tabular-nums leading-none">
                            {formattedTime}
                        </p>
                    )
                })
            }
        </div>
    )
}


export default function Calendar() {
    const [events, setEvents] = useState<Event[]>([
        { id: 1, name: "School", date: Date.now(), start: 510, end: 930, calendar: "School", calendarId: 1 }, 
        { id: 2, name: "Games", date: Date.now(), start: 975, end: 1125, calendar: "Home", calendarId: 2 }
    ]);
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

    const Import = () => {
        const [importMenu, setImportMenu] = useState<{ x: number; y: number; } | false>(false);
        
        return (
            <Button onClick={(e) => { setImportMenu({ x: e.clientX + (e.currentTarget.getBoundingClientRect().x - e.clientX), y: e.clientY - (e.clientY - e.currentTarget.getBoundingClientRect().bottom) + 5 }); }} onBlur={() => { setImportMenu(false); }} className="relative">
                <ImportIcon className="w-4 h-4 text-gray-600" />
                <AnimatePresence>
                    {
                        importMenu && (
                            <ContextMenu x={importMenu.x} y={importMenu.y} onBlur={() => { setImportMenu(false); }}>
                                <p>
                                    Import calendars
                                </p>
                            </ContextMenu>
                        )
                    }
                </AnimatePresence>
            </Button>
        );
    };

    return (
        <div className="flex flex-row w-full h-full gap-0.5 px-4 my-4">
            <div className="flex flex-col h-full pr-2 items-center">
                <Import />
                <TimeLine />
            </div>
            <div className="flex flex-row w-full justify-between">
                {
                    days.map((day, index) => 
                        <Day key={index} type={day} events={events} setEvents={setEvents} />
                    )
                }
            </div>
        </div>
    )
}