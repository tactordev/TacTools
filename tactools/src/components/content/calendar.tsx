"use client";


import { AnimatePresence } from "framer-motion";
import Button from "../utils/button";
import ContextMenu from "../utils/context-menu";
import {
    CalendarArrowDown,
    ImportIcon
} from "lucide-react";
import { useReducer, useRef, useState, useEffect } from "react";
import { fetch as tFetch } from "@tauri-apps/plugin-http";
import ICAL from "ical.js";

type Event = {
    uid: string;
    name: string;
    date: number;
    start: number;
    end: number;
    calendar: string;
    calendarId: number;
    description?: string;
    visible: boolean;
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
    const daysMap = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

    const today = new Date();

    const currentDayIndex = today.getDay(); 
    const distanceToMonday = currentDayIndex === 0 ? 6 : currentDayIndex - 1;

    const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - distanceToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const startOfWeekTimestamp = startOfWeek.getTime();
    const endOfWeekTimestamp = endOfWeek.getTime();


    return (
        <div className="flex flex-col w-full items-center first:border-l-2 border-r-2 border-gray-100 h-full">
            <p className="w-full text-center font-semibold text-gray-600 h-6">
                {type}
            </p>
            <hr className="bg-gray-100 text-gray-100 w-full h-0.5 mt-0.5" />
            
            <div className="relative w-full h-[calc(100%-4rem)] mt-9">
                {
                    events.map((event: Event, index: number) => {
                        const eventDay = new Date(event.date);
                        const eventTimestamp = eventDay.getTime();

                        const isInCurrentWeek = eventTimestamp >= startOfWeekTimestamp && eventTimestamp <= endOfWeekTimestamp;

                        const dIndex = eventDay.getDay();
                        const dayname = daysMap[dIndex];

                        const isCurrentDayColumn = type.toLowerCase() === dayname;

                        if (!isInCurrentWeek || !isCurrentDayColumn) return <div key={`unrendered-${event.uid}-${index}`}></div>;

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
    const [events, setEvents] = useState<Event[]>(() => {
        const loadedCalendars = localStorage.getItem("loaded-calendars");
        if (!loadedCalendars) {
            localStorage.setItem("loaded-calendars", JSON.stringify([]));
            return [];
        }

        const events: Event[] = [];
        const calendarIds = JSON.parse(loadedCalendars);
        calendarIds.map((id: string) => { const calendarEvents = localStorage.getItem(`calendar-${id}`); if (!calendarEvents) return; const cEvents = JSON.parse(calendarEvents).events; events.push(...(cEvents.map((e) => { return { ...e, visible: JSON.parse(calendarEvents).visible as boolean } }))); })
        
        return events;
    });

    const [icalUrls, setIcalUrls] = useState<string[]>(() => {
        const icalUrls = localStorage.getItem("ical-urls");
        if (!icalUrls) {
            localStorage.setItem("ical-urls", JSON.stringify([]));
            return [];
        }

        return JSON.parse(icalUrls);
    });
    
    const [fr, forceRefresh] = useReducer(i => i + 1, 0);



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

    useEffect(() => {
        let m = true;
        
        const fetchAllCalendars = async () => {
            // console.log(`[iCal Loader]: Begun fetchAllCalendars`);

            const events: Event[] = [];
            const cals: string[] = JSON.parse(localStorage.getItem("loaded-calendars") || "[]");

            for (const url of icalUrls) {
                // console.log(`[iCal Loader]: Loading url ${url}`);
                const response = await tFetch(url);
                if (!response.ok) {console.warn(`[iCal Loader]: Invalid network response (${response.status}) on ${url}.`); continue; };

                const raw = await response.text();

                const jcal = ICAL.parse(raw);
                const comp = new ICAL.Component(jcal);
                const vevents = comp.getAllSubcomponents('vevent');

                // console.log(`[iCal Loader]: Loaded events using parser.`);


                const calName = comp.getFirstPropertyValue("x-wr-calname") || "Imported";
                const generatedId = Math.abs(url.split("").reduce((a, b) => (((a << 5) - a) + b.charCodeAt(0)) | 0, 0));

                // console.log(`[iCal Loader]: Calendar properties loaded`);

                const now = new Date();
                const rangeStart = new Date(now); rangeStart.setDate(now.getDate() - 60);
                const rangeEnd = new Date(now); rangeEnd.setDate(now.getDate() + 60);

                const pEvents: Event[] = [];

                for (const vevent of vevents) {
                    const event = new ICAL.Event(vevent);

                    if (event.isRecurring()) {
                        const iterator = event.iterator();
                        let next;
                        while ((next = iterator.next())) {
                            const occurrence = next.toJSDate();
                            if (occurrence > rangeEnd) break;
                            if (occurrence < rangeStart) continue;

                            const details = event.getOccurrenceDetails(next);
                            pEvents.push({
                                uid: `${event.uid}-${next.toString()}`,
                                name: event.summary || "Untitled",
                                description: event.description || "",
                                date: details.startDate.toJSDate().getTime(),
                                start: details.startDate.toJSDate().getHours() * 60 + details.startDate.toJSDate().getMinutes(),
                                end: details.endDate.toJSDate().getHours() * 60 + details.endDate.toJSDate().getMinutes(),
                                calendar: calName as string,
                                calendarId: generatedId,
                                visible: true
                            });
                        }
                    } else {
                        pEvents.push({
                            uid: event.uid,
                            name: event.summary || "Untitled",
                            description: event.description || "",
                            date: event.startDate.toJSDate().getTime(),
                            start: event.startDate.toJSDate().getHours() * 60 + event.startDate.toJSDate().getMinutes(),
                            end: event.endDate.toJSDate().getHours() * 60 + event.endDate.toJSDate().getMinutes(),
                            calendar: calName as string,
                            calendarId: generatedId,
                            visible: true
                        });
                    }
                }
                events.push(...pEvents);
                localStorage.setItem(`calendar-${generatedId}`, JSON.stringify({ importLink: url, events: [...pEvents], visible: true }));

                // console.log(`[iCal Loader]: Pushed calendar properties to local storage.`);

                if (!cals.includes(String(generatedId))) {
                    cals.push(String(generatedId));
                };
            };

            if (m) {
                // console.log(`[iCal Loader]: Component mounted. Saving calendars to local storage.`);
                localStorage.setItem("loaded-calendars", JSON.stringify(cals));
                setEvents(events);
            }
        };

        fetchAllCalendars();

        const interval = setInterval(fetchAllCalendars, 5 * 60 * 1000);

        return () => {
            m = false;
            clearInterval(interval);
        };
    }, [icalUrls]);


    useEffect(() => {
        localStorage.setItem("ical-urls", JSON.stringify((icalUrls)));
    }, [icalUrls]);

    const loadiCal = (iCal: string) => {
        console.log(`[iCal Loader]: Submitted the form.`);
        console.log(`[iCal Loader]: Setting iCal URLs. `, iCal);
        return setIcalUrls([...icalUrls, iCal]);
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