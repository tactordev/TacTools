"use client";


import { AnimatePresence, motion } from "motion/react";
import Button from "../utils/button";
import ContextMenu from "../utils/context-menu";
import {
    CalendarArrowDown,
    ChevronLeft,
    ChevronRight,
    ImportIcon,
    Pin,
    Plus,
    Calendar as LCalendar,
    ALargeSmall,
    Hash,
    CalendarRange,
    Clock,
    TextAlignStart
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
        offsetDate
    }: {
        type: string;
        events: Event[];
        setEvents: (events: Event[]) => void;
        offsetDate: Date;
    }
) {
    const daysMap = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

    const targetDayIndex = daysMap.indexOf(type.toLowerCase());
    const distanceFromMonday = targetDayIndex === 0 ? 6 : targetDayIndex - 1;

    const columnDate = new Date(offsetDate);
    columnDate.setDate(offsetDate.getDate() + distanceFromMonday);

    const startOfDayTimestamp = new Date(columnDate.getFullYear(), columnDate.getMonth(), columnDate.getDate(), 0, 0, 0, 0).getTime();
    const endOfDayTimestamp = new Date(columnDate.getFullYear(), columnDate.getMonth(), columnDate.getDate(), 23, 59, 59, 999).getTime();

    return (
        <div className="flex flex-col w-full items-center first:border-l-2 border-r-2 border-gray-100 h-full">
            <AnimatePresence>
                <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 100 }}
                transition={{ duration: 0.25 }}
                className="w-full text-center font-semibold text-gray-600 h-6">
                    {type} [{columnDate.getDate()}]
                </motion.p>
            </AnimatePresence>
            <hr className="bg-gray-100 text-gray-100 w-full h-0.5 mt-0.5" />
            
            <div className="relative w-full h-[calc(100%-4rem)] mt-9">
                <AnimatePresence>
                    {
                        events.map((event: Event, index: number) => {
                            const eventTimestamp = event.date;
                            const isInThisDay = eventTimestamp >= startOfDayTimestamp && eventTimestamp <= endOfDayTimestamp;

                            if (!isInThisDay || !event.visible) return null;

                            const totalMinutes = 24 * 60;
                            const topPercent = (event.start / totalMinutes) * 100;
                            const heightPercent = ((event.end - event.start) / totalMinutes) * 100;

                            return (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                    key={`event-${event.uid}-${index}`} 
                                    className="absolute left-1 right-1 rounded-md p-1.5 text-xs font-medium bg-gray-100 overflow-hidden" 
                                    style={{top: `${topPercent}%`, height: `${heightPercent}%`}}
                                >
                                    <p className="font-semibold text-gray-600 truncate leading-none">{event.name}</p>
                                    <p className="text-[0.625rem] text-blue-700/80 mt-1">
                                        {Math.floor(event.start / 60)}:{(event.start % 60).toString().padStart(2, '0')}
                                    </p>
                                </motion.div>
                            );
                        })
                    }
                </AnimatePresence>
            </div>
        </div>
    );
}

function TimeLine() {
    const times = [...Array(25).keys()];
    return (
        <div className="flex flex-col h-[calc(100%-4rem)] w-fit mt-1 justify-between">
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
        calendarIds.map((id: string) => { const calendarEvents = localStorage.getItem(`calendar-${id}`); if (!calendarEvents) return; const cEvents = JSON.parse(calendarEvents).events; events.push(...(cEvents.map((e: Event) => { return { ...e, visible: JSON.parse(calendarEvents).visible as boolean } }))); })
        events.filter((event) => calendarIds.includes(event.calendarId));
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

    
    const getCurMonDate = () => {
        const today = new Date();
        const currentDayIndex = today.getDay();
        const distanceToMonday = currentDayIndex === 0 ? 6 : currentDayIndex - 1;

        const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - distanceToMonday);
        startOfWeek.setHours(0, 0, 0, 0);

        return startOfWeek;
    }
    
    const [fr, forceRefresh] = useReducer(i => i + 1, 0);
    const [monDate, setMonDate] = useState<Date>(() => {
        return getCurMonDate();
    });





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


    const NewEvent = () => {
        const [dropdown, setDropdown] = useState<boolean>(false);
        const [dropdownChoice, setDropdownChoice] = useState<"calendar" | "event">("event");
        const [searchDropdown, setSearchDropdown] = useState<boolean>(false);
        const [input, setInput] = useState<string>("");

        const [cals, setCals] = useState<{events: Event[], importUrl: string, title: string}[]>(() => {
            const calendars = localStorage.getItem("loaded-calendars");
            if (!calendars) return [];

            const calendarIds = JSON.parse(calendars);
            return calendarIds
                .map((calendarId: string) => {
                    const item = localStorage.getItem(`calendar-${calendarId}`);
                    return item ? JSON.parse(item) : null;
                })
                .filter(Boolean);
        });
        const calSearchRef = useRef<HTMLInputElement | null>(null);

        const filCals = cals.filter((cal: any) => cal?.title?.toLowerCase().includes(input.toLowerCase()));

        return (
            <div className="flex flex-row items-center justify-center relative">
                <Button onClick={() => { setDropdown(!dropdown); }} className="mt-1">
                    <Plus className="text-gray-600 w-4 h-4" />
                </Button>
                <AnimatePresence>
                    { dropdown && ( <motion.div initial={{ opacity: 0, translateX: -5 }} animate={{ opacity: 100, translateX: 0 }} transition={{ duration: 0.125 }} exit={{ opacity: 0, translateX: -5 }} className="absolute flex flex-col top-full left-0 z-100 bg-gray-100/40 shadow-sm backdrop-blur-md mt-1 rounded-md transition-height duration-200">
                        <div className="flex flex-row gap-1 justify-around mx-1 px-1 py-1 mt-1 bg-gray-200 rounded-md backdrop-blur-md"> 
                            <div onClick={() => { setDropdownChoice("calendar"); }} className={`px-8 py-0.5 rounded-md ${dropdownChoice === "calendar" ? "bg-white/60" : "opacity-20 hover:cursor-pointer hover:bg-white hover:opacity-40 transition-all duration-200"}`} ><LCalendar className="text-gray-500 w-4 h-4" /></div>
                            <div onClick={() => { setDropdownChoice("event"); }} className={`px-8 py-0.5 rounded-md ${dropdownChoice === "event" ? "bg-white/60" : "opacity-20 hover:cursor-pointer hover:bg-white hover:opacity-40 transition-all duration-200"}`} ><Pin className="text-gray-500 w-4 h-4" /></div>
                        </div>
                        <AnimatePresence>
                            {
                                dropdownChoice === "event" ? 
                                    <motion.div className="mt-2 mx-2 mb-4">
                                        <form className="w-full h-full flex flex-col gap-3">
                                            <div className="flex flex-row mt-1 relative items-center justify-center group">
                                                <input 
                                                    type="text" 
                                                    name="title" 
                                                    placeholder=" " 
                                                    className="peer w-full h-fit px-2 py-1 border border-gray-200 rounded-md text-xs focus:outline-none outline-none focus:border-gray-300 transition-all duration-200" 
                                                />
                                                <div className="w-fit h-fit absolute top-0.5 left-0 flex flex-row gap-1 items-center ml-2 pointer-events-none select-none 
                                                    peer-focus:-mt-3.5 peer-focus:-ml-0 peer-focus:scale-80 
                                                    peer-not-placeholder-shown:-mt-3.5 peer-not-placeholder-shown:-ml-0 peer-not-placeholder-shown:scale-80 
                                                    transition-all duration-200 bg-gray-100 rounded-md px-1 py-0.5"
                                                >
                                                    <ALargeSmall className="w-4 h-4 text-gray-600 mt-0.5" />
                                                    <p className="text-xs text-gray-600">Event Title</p>
                                                </div>
                                            </div>

                                            <div className="flex flex-row mt-2.5 relative items-center justify-center group">
                                                <input 
                                                    type="date" 
                                                    placeholder=" "
                                                    className="peer w-full h-fit px-2 py-1 border border-gray-200 rounded-md text-xs focus:outline-none outline-none focus:border-gray-300 transition-all duration-200" 
                                                />
                                                <div className="w-fit h-fit absolute top-0.5 left-0 flex flex-row gap-1 items-center ml-2 pointer-events-none select-none 
                                                    peer-focus:-mt-3.5 peer-focus:-ml-0 peer-focus:scale-80 
                                                    peer-not-placeholder-shown:-mt-3.5 peer-not-placeholder-shown:-ml-0 peer-not-placeholder-shown:scale-80 
                                                    transition-all duration-200 bg-gray-100 rounded-md px-1 py-0.5"
                                                >
                                                    <Clock className="w-4 h-4 text-gray-600 mt-0.5" />
                                                    <p className="text-xs text-gray-600">Start Date</p>
                                                </div>
                                            </div>

                                            <div className="flex flex-row mt-2.5 relative items-center justify-center group">
                                                <input 
                                                    type="date" 
                                                    placeholder=" "
                                                    className="peer w-full h-fit px-2 py-1 border border-gray-200 rounded-md text-xs focus:outline-none outline-none focus:border-gray-300 transition-all duration-200" 
                                                />
                                                <div className="w-fit h-fit absolute top-0.5 left-0 flex flex-row gap-1 items-center ml-2 pointer-events-none select-none 
                                                    peer-focus:-mt-3.5 peer-focus:-ml-0 peer-focus:scale-80 
                                                    peer-not-placeholder-shown:-mt-3.5 peer-not-placeholder-shown:-ml-0 peer-not-placeholder-shown:scale-80 
                                                    transition-all duration-200 bg-gray-100 rounded-md px-1 py-0.5"
                                                >
                                                    <Clock className="w-4 h-4 text-gray-600 mt-0.5" />
                                                    <p className="text-xs text-gray-600">End Date</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-row mt-2.5 relative items-center justify-center group">
                                                <input 
                                                    type="text" 
                                                    placeholder=" "
                                                    className="peer w-full h-fit px-2 py-1 border border-gray-200 rounded-md text-xs focus:outline-none outline-none focus:border-gray-300 transition-all duration-200" 
                                                />
                                                <div className="w-fit h-fit absolute top-0.5 left-0 flex flex-row gap-1 items-center ml-2 pointer-events-none select-none 
                                                    peer-focus:-mt-3.5 peer-focus:-ml-0 peer-focus:scale-80 
                                                    peer-not-placeholder-shown:-mt-3.5 peer-not-placeholder-shown:-ml-0 peer-not-placeholder-shown:scale-80 
                                                    transition-all duration-200 bg-gray-100 rounded-md px-1 py-0.5"
                                                >
                                                    <TextAlignStart className="w-4 h-4 text-gray-600 mt-0.5" />
                                                    <p className="text-xs text-gray-600">Description</p>
                                                </div>
                                            </div>

                                            <div className="flex flex-row mt-2.5 relative items-center justify-center group mb-24">
                                                <input 
                                                    ref={calSearchRef} 
                                                    onChange={(e) => { setInput(e.target.value); }} 
                                                    onFocus={() => { setSearchDropdown(true); }} 
                                                    onBlur={() => { setTimeout(() => { setSearchDropdown(false); }, 200)}} 
                                                    type="search" 
                                                    placeholder=" "
                                                    className="peer w-full h-fit px-2 py-1 border border-gray-200 rounded-md text-xs focus:outline-none outline-none focus:border-gray-300 transition-all duration-200" 
                                                />
                                                <div className="w-fit h-fit absolute top-0.5 left-0 flex flex-row gap-1 items-center ml-2 pointer-events-none select-none 
                                                    peer-focus:-mt-3.5 peer-focus:-ml-0 peer-focus:scale-80 
                                                    peer-not-placeholder-shown:-mt-3.5 peer-not-placeholder-shown:-ml-0 peer-not-placeholder-shown:scale-80 
                                                    transition-all duration-200 bg-gray-100 rounded-md px-1 py-0.5"
                                                >
                                                    <LCalendar className="w-4 h-4 text-gray-600 mt-0.5" />
                                                    <p className="text-xs text-gray-600">Calendar</p>
                                                </div>
                                                <AnimatePresence>
                                                    { searchDropdown &&
                                                        <motion.div initial={{ opacity: 0, translateY: -5 }} animate={{ opacity: 1, translateY: 0 }} transition={{ duration: 0.2 }} exit={{ opacity: 0, translateY: -5, transition: { duration: 0.125 }}} className="absolute top-full mt-0.5 left-0 bg-gray-100 backdrop-blur-md rounded-md px-2 py-2 shadow-sm w-full h-[calc(100%+4rem)]">
                                                            <AnimatePresence>
                                                                {filCals.length === 0 ? (
                                                                    <motion.p 
                                                                        initial={{ opacity: 0 }} 
                                                                        animate={{ opacity: 1 }} 
                                                                        exit={{ opacity: 0 }}
                                                                        className="text-gray-400 text-xs text-center py-2"
                                                                    >
                                                                        No calendars found
                                                                    </motion.p>
                                                                ) : (
                                                                    filCals.map((cal: any) => (
                                                                        <motion.div 
                                                                            key={cal.title} 
                                                                            initial={{ opacity: 0, translateX: -5 }} 
                                                                            animate={{ opacity: 1, translateX: 0 }} 
                                                                            transition={{ duration: 0.2, delay: 0.5 }}
                                                                            className="text-gray-600 text-xs"
                                                                        >
                                                                            <Button onClick={() => {if (calSearchRef.current) { calSearchRef.current.value = cal.title; calSearchRef.current.focus(); } }} name={`${cal.title}`} className="!shadow-none">{ cal.title }</Button>
                                                                        </motion.div>
                                                                    ))
                                                                )}
                                                            </AnimatePresence>
                                                        </motion.div>
                                                    }
                                                </AnimatePresence>
                                            </div>

                                            <Button className="text-xs text-gray-600 -mb-2" name="submit">Submit</Button>
                                            
                                        </form>
                                    </motion.div>
                                :  
                                    <div>

                                    </div>
                            }
                        </AnimatePresence>
                    </motion.div> ) }
                </AnimatePresence>
            </div>
        )
    }

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
                localStorage.setItem(`calendar-${generatedId}`, JSON.stringify({ importLink: url, events: [...pEvents], visible: true, title: calName as string }));

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

    const handlePrevWeek = (e: React.MouseEvent) => {
        e.preventDefault();
        const nextDate = new Date(monDate);
        nextDate.setDate(monDate.getDate() - 7);
        setMonDate(nextDate);
        forceRefresh();
    };

    const handleNextWeek = (e: React.MouseEvent) => {
        e.preventDefault();
        const nextDate = new Date(monDate);
        nextDate.setDate(monDate.getDate() + 7);
        setMonDate(nextDate);
        forceRefresh();
    };

    return (
        <div className="flex flex-row w-full h-full gap-0.5 px-4 my-4">
            <div className="flex flex-col h-full pr-2 items-center gap-1">
                <NewEvent />
                <Import loadiCal={loadiCal} />
                <TimeLine />
            </div>
            <div className="flex flex-row relative w-full justify-between">
                {
                    days.map((day, index) => 
                        <Day key={index} type={day} events={events} setEvents={setEvents} offsetDate={monDate} />
                    )
                }
                <div className="absolute flex flex-row gap-1 -top-0.5 right-1">
                    <Button className="!px-1" onClick={handlePrevWeek}>
                        <ChevronLeft className="text-gray-600 rounded-lg w-4 h-4" />
                    </Button>
                    <Button className="!px-1" onClick={handleNextWeek}>
                        <ChevronRight className="text-gray-600 rounded-lg w-4 h-4"  />
                    </Button>
                </div>
            </div>
        </div>
    )
}