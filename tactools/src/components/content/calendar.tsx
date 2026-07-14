"use client";


import { AnimatePresence } from "framer-motion";
import Button from "../utils/button";
import ContextMenu from "../utils/context-menu";
import {
    ImportIcon
} from "lucide-react";
import { useRef, useState } from "react";

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
    // testing data
    // [
    //     { id: 1, name: "School", date: Date.now(), start: 510, end: 930, calendar: "School", calendarId: 1 }, 
    //     { id: 2, name: "Games", date: Date.now(), start: 975, end: 1125, calendar: "Home", calendarId: 2 }
    // ]
    const [events, setEvents] = useState<Event[]>(() => {
        const loadedCalendars = localStorage.getItem("loaded-calendars");
        if (!loadedCalendars) {
            localStorage.setItem("loaded-calendars", JSON.stringify([]));
            return [];
        }

        const events: Event[] = [];
        const calendarIds = JSON.parse(loadedCalendars);
        calendarIds.map((id: string) => { const calendarEvents = localStorage.getItem(`calendar-${id}`); if (!calendarEvents) return; const cEvents = JSON.parse(calendarEvents).events; events.push(...cEvents); })
        
        return events;
    });

    // loaded-calendars: [id1, id2, ....];
    // calendar-id: { importLink?: string; events: Event[] };

    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

    const Import = ({ loadiCal }: { loadiCal: (ical: string) => void; }) => {
        const [importMenu, setImportMenu] = useState<{ x: number; y: number; } | false>(false);
        const [importing, setImporting] = useState<string | false>(false);

        const importInput = useRef<HTMLInputElement | null>(null);
        
        return (
            <Button onClick={(e) => { setImportMenu({ x: e.clientX + (e.currentTarget.getBoundingClientRect().x - e.clientX), y: e.clientY - (e.clientY - e.currentTarget.getBoundingClientRect().bottom) + 5 }); }} className="relative">
                <ImportIcon className="w-4 h-4 text-gray-600" />
                <AnimatePresence>
                    {
                        importMenu && (
                            <ContextMenu x={importMenu.x} y={importMenu.y} onBlur={(e: React.FocusEvent) => { 
                                setImporting(false);
                                setImportMenu(false);
                            }}>
                                {
                                    importing === "google-calendar" ? <form onSubmit={(e: React.SubmitEvent) => { e.preventDefault(); e.stopPropagation(); const data = new FormData(e.currentTarget as HTMLFormElement).get("ical") as string; loadiCal(data); setImporting(false); return setImportMenu(false); }}><input name="ical" placeholder="Enter iCal link..." ref={importInput} className="outline-none focus:outline-none text-xs" /></form>
                                    : <Button onClick={() => {setImporting("google-calendar"); setTimeout(() => { if (!importInput.current) return; importInput.current.focus(); }, 100)}} className="!shadow-none">
                                        <p className="text-xs">Import from Google Calendar</p>
                                    </Button>
                                }
                            </ContextMenu>
                        )
                    }
                </AnimatePresence>
            </Button>
        );
    };


    const loadiCal = (iCal: string) => {

    }

    return (
        <div className="flex flex-row w-full h-full gap-0.5 px-4 my-4">
            <div className="flex flex-col h-full pr-2 items-center">
                <Import loadiCal={loadiCal} />
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