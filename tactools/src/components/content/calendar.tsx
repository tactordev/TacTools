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
    TextAlignStart,
    Eye,
    SquarePen,
    SquareCheck,
    Square,
    Edit,
    Trash2
} from "lucide-react";
import { useReducer, useRef, useState, useEffect } from "react";
import { fetch as tFetch } from "@tauri-apps/plugin-http";
import ICAL from "ical.js";

type RecurrenceRules = "none" | "daily" | "weekly" | "monthly" | "yearly";

export type Event = {
    uid: string;
    name: string;
    date: number;
    start: number;
    end: number;
    calendar: string;
    calendarId: number;
    description?: string;
    visible: boolean;
    recurrence?: RecurrenceRules;
    recurrenceUntil?: number;
}

const MAX_RECURRING_OCCURRENCES = 365;

function generateRecurringEvents(
    baseUid: string,
    name: string,
    description: string,
    startD: Date,
    endD: Date,
    calendar: string,
    calendarId: number,
    recurrence: RecurrenceRules,
    recurrenceUntil?: Date
): Event[] {
    const startM = startD.getHours() * 60 + startD.getMinutes();
    const endM = endD.getHours() * 60 + endD.getMinutes();

    if (recurrence === "none") {
        return [{
            uid: baseUid,
            name,
            description,
            date: startD.getTime(),
            start: startM,
            end: endM,
            calendar,
            calendarId,
            visible: true,
            recurrence: "none"
        }];
    }

    const defaultUntil = new Date(startD);
    defaultUntil.setFullYear(defaultUntil.getFullYear() + 1);
    const until = recurrenceUntil && recurrenceUntil.getTime() > startD.getTime() ? recurrenceUntil : defaultUntil;

    const occurrences: Event[] = [];
    const cursor = new Date(startD);
    let count = 0;

    while (cursor.getTime() <= until.getTime() && count < MAX_RECURRING_OCCURRENCES) {
        occurrences.push({
            uid: `${baseUid}-${cursor.toISOString()}`,
            name,
            description,
            date: cursor.getTime(),
            start: startM,
            end: endM,
            calendar,
            calendarId,
            visible: true,
            recurrence,
            recurrenceUntil: until.getTime()
        });

        count++;
        switch (recurrence) {
            case "daily": cursor.setDate(cursor.getDate() + 1); break;
            case "weekly": cursor.setDate(cursor.getDate() + 7); break;
            case "monthly": cursor.setMonth(cursor.getMonth() + 1); break;
            case "yearly": cursor.setFullYear(cursor.getFullYear() + 1); break;
        }
    }

    return occurrences;
}

function toDatetimeLocalValue(d: Date): string {
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function Day(
    {
        type,
        events,
        showEventCtxMenu,
        offsetDate
    }: {
        type: string;
        events: Event[];
        showEventCtxMenu: (e: React.MouseEvent) => void;
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
                                    id={`${event.uid}`}
                                    onContextMenu={(e: React.MouseEvent) => { showEventCtxMenu(e); }}
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

const NewEvent = (
    {
        events,
        setEvents,
        cals,
        setCals,
        forceRefresh
    }: {
        events: Event[];
        setEvents: (events: Event[]) => void;
        cals: any[];
        setCals: (cal: any) => void;
        forceRefresh: () => void;
    }
) => {
    const [repeat, setRepeat] = useState<RecurrenceRules>("none");
    const [repeatUntil, setRepeatUntil] = useState<string>("");


    const [dropdown, setDropdown] = useState<boolean>(false);
    const [dropdownChoice, setDropdownChoice] = useState<"calendar" | "event">("event");
    const [searchDropdown, setSearchDropdown] = useState<boolean>(false);
    const [input, setInput] = useState<string>("");

    const calSearchRef = useRef<HTMLInputElement | null>(null);
    const form = useRef<HTMLFormElement | null>(null);

    const filCals = cals.filter((cal: any) => cal?.title?.toLowerCase().includes(input.toLowerCase()));

    useEffect(() => { 
        const closeSearchDropdown = () => {
            console.log("closing dropdown...");
            return setDropdown(false);
        }

        window.addEventListener("click", closeSearchDropdown);
        
        return () => {
            window.removeEventListener("click", closeSearchDropdown);
        }
    }, []);


    const createNewEvent = (e: React.MouseEvent) => {
        e.preventDefault();

        const formEl = form.current;
        if (!formEl || !calSearchRef.current) return;

        const formData = new FormData(formEl);
        if (!formData) return;

        const [title, start, end, description, calendar] = [
            formData.get("title")?.toString(),
            formData.get("start")?.toString(),
            formData.get("end")?.toString(),
            formData.get("description")?.toString(),
            formData.get("calendar")?.toString()
        ];
        if (!title || !start || !end || !description || !calendar) return setDropdown(false);

        const startD = new Date(start);
        const endD = new Date(end);
        const calId = Number(calSearchRef.current.id);

        const baseUid = String(
            events.reduce((max, cur) => Math.max(max, Number(cur.uid.split("-")[0]) || 0), 0) + 1
        );

        const untilDate = repeat !== "none" && repeatUntil ? new Date(repeatUntil) : undefined;
        const newEvents = generateRecurringEvents(baseUid, title, description, startD, endD, calendar, calId, repeat, untilDate);

        setEvents([...events, ...newEvents]);

        setCals((prevCals: any) => prevCals.map((cal: any) => {
            if (cal.id === calId) {
                return { ...cal, events: [...cal.events, ...newEvents] };
            }
            return cal;
        }));

        formEl.reset();
        setRepeat("none");
        setRepeatUntil("");
        return setDropdown(false);
    }

    const createNewCalendar = (e: React.MouseEvent) => {
        if (!form.current) return;
        const formEl = form.current;
        const formData = new FormData(formEl);
        if (!formData) return;

        const title = formData.get("calendarname")?.toString();
        if (!title) return;

        const calendar = {
            importUrl: "",
            events: [] as Event[],
            id: cals.reduce((max, cur) => Math.max(max, Number((cur as any).id || 0)), 0) + 1,
            title: title,
            visible: true
        }

        setCals([...cals, calendar]);
        return setDropdown(false);
    }

    return (
        <div className="flex flex-row items-center justify-center relative">
            <Button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDropdown(!dropdown); }} className="mt-1">
                <Plus className="text-gray-600 w-4 h-4" />
            </Button>
            <AnimatePresence>
                { dropdown && ( <motion.div initial={{ opacity: 0, translateX: -5 }} animate={{ opacity: 100, translateX: 0 }} transition={{ duration: 0.125 }} exit={{ opacity: 0, translateX: -5 }} className="absolute flex flex-col top-full left-0 z-100 bg-gray-100/40 shadow-sm backdrop-blur-md mt-1 rounded-md transition-height duration-200">
                    <div className="flex flex-row gap-1 justify-around mx-1 px-1 py-1 mt-1 bg-gray-200 rounded-md backdrop-blur-md"> 
                        <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDropdownChoice("calendar"); }} className={`px-8 py-0.5 rounded-md ${dropdownChoice === "calendar" ? "bg-white/60" : "opacity-20 hover:cursor-pointer hover:bg-white hover:opacity-40 transition-all duration-200"}`} ><LCalendar className="text-gray-500 w-4 h-4" /></div>
                        <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDropdownChoice("event"); }} className={`px-8 py-0.5 rounded-md ${dropdownChoice === "event" ? "bg-white/60" : "opacity-20 hover:cursor-pointer hover:bg-white hover:opacity-40 transition-all duration-200"}`} ><Pin className="text-gray-500 w-4 h-4" /></div>
                    </div>
                    <AnimatePresence>
                        {
                            dropdownChoice === "event" ? 
                                <motion.div onClick={(e) => { e.stopPropagation(); e.preventDefault(); }} className="mt-2 mx-2 mb-4">
                                    <form ref={form} className="w-full h-full flex flex-col gap-3">
                                        <div className="flex flex-row mt-1 relative items-center justify-center group">
                                            <input 
                                                type="text" 
                                                name="title" 
                                                placeholder=" " 
                                                className="peer w-full h-fit px-2 py-1 border border-gray-200 rounded-md text-xs focus:outline-none outline-none focus:bg-gray-100 focus:border-gray-300 transition-all duration-200" 
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
                                                type="datetime-local" 
                                                placeholder=" "
                                                name="start"
                                                className="peer w-full h-fit px-2 py-1 text-gray-600 border border-gray-200 rounded-md text-xs focus:outline-none outline-none focus:bg-gray-100 focus:border-gray-300 transition-all duration-200" 
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
                                                type="datetime-local" 
                                                placeholder=" "
                                                name="end"
                                                className="peer w-full h-fit px-2 py-1 border border-gray-200 rounded-md text-xs text-gray-600 focus:outline-none outline-none focus:bg-gray-100 focus:border-gray-300 transition-all duration-200" 
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
                                                name="description"
                                                className="peer w-full h-fit px-2 py-1 border border-gray-200 rounded-md text-xs focus:outline-none outline-none focus:bg-gray-100 focus:border-gray-300 transition-all duration-200" 
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
                                                name="calendar"
                                                id=""
                                                className="peer w-full h-fit px-2 py-1 border border-gray-200 rounded-md text-xs focus:outline-none outline-none focus:bg-gray-100 focus:border-gray-300 transition-all duration-200" 
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
                                                                        <Button onClick={() => {if (calSearchRef.current) { calSearchRef.current.focus(); calSearchRef.current.value = cal.title; calSearchRef.current.id = `${cal.id}` } }} name={`${cal.title}`} className="!shadow-none">{ cal.title }</Button>
                                                                    </motion.div>
                                                                ))
                                                            )}
                                                        </AnimatePresence>
                                                    </motion.div>
                                                }
                                            </AnimatePresence>
                                        </div>

                                        
                                        <div className="flex flex-col gap-1 mt-2.5">
                                            <label className="text-xs text-gray-600 flex items-center gap-1">
                                                <CalendarRange className="w-3.5 h-3.5" /> Repeat
                                            </label>
                                            <select
                                                value={repeat}
                                                onChange={(e) => setRepeat(e.target.value as RecurrenceRules)}
                                                className="w-full px-2 py-1 border border-gray-200 rounded-md text-xs text-gray-600 outline-none focus:outline-none focus:bg-gray-100 focus:border-gray-300 hover:cursor-pointer"
                                            >
                                                <option value="none">Does not repeat</option>
                                                <option value="daily">Daily</option>
                                                <option value="weekly">Weekly</option>
                                                <option value="monthly">Monthly</option>
                                                <option value="yearly">Yearly</option>
                                            </select>
                                            {
                                                repeat !== "none" && (
                                                    <div className="flex flex-row items-center gap-1 mt-1">
                                                        <p className="text-xs text-gray-600 whitespace-nowrap">Until</p>
                                                        <input
                                                            type="date"
                                                            value={repeatUntil}
                                                            onChange={(e) => setRepeatUntil(e.target.value)}
                                                            className="w-full px-2 py-1 border border-gray-200 rounded-md text-xs text-gray-600 outline-none focus:outline-none focus:bg-gray-100 focus:border-gray-300"
                                                        />
                                                    </div>
                                                )
                                            }
                                        </div>

                                        <Button className="text-xs text-gray-600 -mb-2" name="submit" onClick={createNewEvent}>Submit</Button>
                                        
                                    </form>
                                </motion.div>
                            :  
                                <div onClick={(e) => {e.preventDefault(); e.stopPropagation(); }} className="mt-2 mb-4 px-2">
                                    <form ref={form} className="w-full h-full flex flex-col gap-3">
                                        <div className="flex flex-row mt-2.5 relative items-center justify-center group">
                                            <input 
                                                type="text" 
                                                placeholder=" "
                                                name="calendarname"
                                                className="peer w-full h-fit px-2 py-1 border border-gray-200 rounded-md text-xs focus:outline-none outline-none focus:bg-gray-100 focus:border-gray-300 transition-all duration-200" 
                                            />
                                            <div className="w-fit h-fit absolute top-0.5 left-0 flex flex-row gap-1 items-center ml-2 pointer-events-none select-none 
                                                peer-focus:-mt-3.5 peer-focus:-ml-0 peer-focus:scale-80 
                                                peer-not-placeholder-shown:-mt-3.5 peer-not-placeholder-shown:-ml-0 peer-not-placeholder-shown:scale-80 
                                                transition-all duration-200 bg-gray-100 rounded-md px-1 py-0.5"
                                            >
                                                <TextAlignStart className="w-4 h-4 text-gray-600 mt-0.5" />
                                                <p className="text-xs text-gray-600">Calendar Name</p>
                                            </div>
                                        </div>

                                        <Button className="text-xs text-gray-600 -mb-2" name="submit" onClick={createNewCalendar}>Submit</Button>
                                    </form>
                                </div>
                        }
                    </AnimatePresence>
                </motion.div> ) }
            </AnimatePresence>
        </div>
    )
}

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


const EventContextMenu = (
    {
        events,
        setEvents,
        cals,
        setCals,
        id,
        setEventCtxMenu
    }: {
        events: Event[];
        setEvents: (events: Event[]) => void;
        cals: any[];
        setCals: (cals: any) => void;
        id: string;
        setEventCtxMenu: (val: false | { x: number; y: number; eventId: string; }) => void;
    }
) => {
    const event = events.find((ev) => ev.uid === id);
    if (!event) return <p className="text-xs text-gray-600">Unknown event.</p>
    const [repeat, setRepeat] = useState<RecurrenceRules>(event.recurrence || "none");
    const [repeatUntil, setRepeatUntil] = useState<string>(
        event.recurrenceUntil ? new Date(event.recurrenceUntil).toISOString().slice(0, 10) : ""
    );


    const [confirmDelete, setConfirmDelete] = useState<string>("");
    const [editing, setEditing] = useState<boolean>(false);
    const [searchDropdown, setSearchDropdown] = useState<boolean>(false);
    const [input, setInput] = useState<string>("");

    const form = useRef<HTMLFormElement | null>(null);
    const calSearchRef = useRef<HTMLInputElement | null>(null);
    const filCals = cals.filter((cal: any) => cal?.title?.toLowerCase().includes(input.toLowerCase()));


    const saveEvent = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const formEl = form.current;
        if (!formEl || !calSearchRef.current) return;

        const formData = new FormData(formEl);
        if (!formData) return;

        const [title, start, end, description, calendar] = [
            formData.get("title")?.toString(),
            formData.get("start")?.toString(),
            formData.get("end")?.toString(),
            formData.get("description")?.toString(),
            formData.get("calendar")?.toString()
        ];
        if (!title || !start || !end || !description || !calendar) return setEditing(false);

        const startD = new Date(start);
        const endD = new Date(end);
        const calId = Number(calSearchRef.current.id);

        const baseId = id.split("-")[0];
        const untilDate = repeat !== "none" && repeatUntil ? new Date(repeatUntil) : undefined;
        const newEvents = generateRecurringEvents(baseId, title, description, startD, endD, calendar, calId, repeat, untilDate);

        const isSameSeries = (uid: string) => uid === baseId || uid.startsWith(`${baseId}-`);

        setEvents([...events.filter((e) => !isSameSeries(e.uid)), ...newEvents]);

        setCals((prevCals: any) => prevCals.map((cal: any) => {
            const remaining = cal.events.filter((e: Event) => !isSameSeries(e.uid));
            if (cal.id === calId) {
                return { ...cal, events: [...remaining, ...newEvents] };
            }
            return { ...cal, events: remaining };
        }));

        formEl.reset();
        setEditing(false);
        setEventCtxMenu(false);
        return;
    }

    const eventCal = cals.find((c) => {
        return c.events.find((e: Event) => e.uid === id) ? c : false;
    });
    if (eventCal.importUrl !== "") {
        return <div>
            <p className="text-gray-600 text-xs">This event is in a read-only calendar.</p>
        </div>
    }
    return (
        <div>
            {
                !editing ? (
                    <div className="flex flex-col gap-1">
                        <Button onClick={(e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setEditing(true); return; }} name="Rename"  className="flex flex-row items-center justify-start gap-3 !shadow-none select-none">
                            <Edit className="w-4 h-4 text-gray-600" />
                            <p className="text-gray-600 text-xs">Edit Event</p>
                        </Button>
                        <Button onClick={() => {
                            if (confirmDelete !== "this-occurence") return setConfirmDelete("this-occurence");

                            const evs = events.filter((e) => e.uid !== id);
                            const calendars = cals.map((cal) => { return { ...cal, events: [...cal.events.filter((e: Event) => e.uid !== id)] }});
                            setEvents(evs);
                            setCals(calendars);
                            setEventCtxMenu(false);
                            return;

                        }} name="Delete"  className={`flex flex-row items-center justify-start gap-3 !shadow-none select-none bg-red-300/30 hover:!bg-red-300/20 ${confirmDelete ? "flash-red" : ""}`}>
                            <Trash2 className="w-4 h-4 text-red-500/60" />
                            <p className={`text-red-500/60 text-xs min-w-20`}>{ confirmDelete === "this-occurence" ? "Confirm?" : "Delete this occurence" }</p>
                        </Button>
                        <Button onClick={() => {
                            if (confirmDelete !== "all-occurences") return setConfirmDelete("all-occurences");

                            const evs = events.filter((e) => e.uid.split("-")[0] !== (id.split("-")[0]));
                            const calendars = cals.map((cal) => { return { ...cal, events: [...cal.events.filter((e: Event) => !e.uid.includes(id.split("-")[0]))] }});
                            setEvents(evs);
                            setCals(calendars);
                            setEventCtxMenu(false);
                            return;

                        }} name="Delete"  className={`flex flex-row items-center justify-start gap-3 !shadow-none select-none bg-red-300/30 hover:!bg-red-300/20 ${confirmDelete ? "flash-red" : ""}`}>
                            <Trash2 className="w-4 h-4 text-red-500/60" />
                            <p className={`text-red-500/60 text-xs min-w-20`}>{ confirmDelete === "all-occurences" ? "Confirm?" : "Delete all occurences" }</p>
                        </Button>
                    </div>
                ) : (
                    <div>
                        <form ref={form} className="w-full h-full flex flex-col gap-3">
                            <div className="flex flex-row mt-1 relative items-center justify-center group">
                                <input 
                                    type="text" 
                                    name="title" 
                                    placeholder=" " 
                                    defaultValue={event.name}
                                    className="peer w-full h-fit px-2 py-1 border border-gray-200 rounded-md text-xs focus:outline-none outline-none focus:bg-gray-100 focus:border-gray-300 transition-all duration-200" 
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
                                    type="datetime-local" 
                                    placeholder=" "
                                    name="start"
                                    defaultValue={toDatetimeLocalValue(new Date(event.date))}
                                    className="peer w-full h-fit px-2 py-1 text-gray-600 border border-gray-200 rounded-md text-xs focus:outline-none outline-none focus:bg-gray-100 focus:border-gray-300 transition-all duration-200" 
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
                                    type="datetime-local" 
                                    placeholder=" "
                                    name="end"
                                    defaultValue={toDatetimeLocalValue(new Date(new Date(event.date).setHours(Math.floor(event.end / 60), event.end % 60, 0, 0)))}
                                    className="peer w-full h-fit px-2 py-1 border border-gray-200 rounded-md text-xs text-gray-600 focus:outline-none outline-none focus:bg-gray-100 focus:border-gray-300 transition-all duration-200" 
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
                                    name="description"
                                    defaultValue={event.description}
                                    className="peer w-full h-fit px-2 py-1 border border-gray-200 rounded-md text-xs focus:outline-none outline-none focus:bg-gray-100 focus:border-gray-300 transition-all duration-200" 
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
                                    name="calendar"
                                    id=""
                                    className="peer w-full h-fit px-2 py-1 border border-gray-200 rounded-md text-xs focus:outline-none outline-none focus:bg-gray-100 focus:border-gray-300 transition-all duration-200" 
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
                                                            <Button onClick={() => {if (calSearchRef.current) { calSearchRef.current.focus(); calSearchRef.current.value = cal.title; calSearchRef.current.id = `${cal.id}` } }} name={`${cal.title}`} className="!shadow-none">{ cal.title }</Button>
                                                        </motion.div>
                                                    ))
                                                )}
                                            </AnimatePresence>
                                        </motion.div>
                                    }
                                </AnimatePresence>
                            </div>


                            <Button className="text-xs text-gray-600 mb-2" name="save" onClick={saveEvent}>Save</Button>
                            
                        </form>
                    </div>
                )
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
        calendarIds.map((id: string) => {
            const calendarEvents = localStorage.getItem(`calendar-${id}`);
            if (!calendarEvents) return;
            
            const cEvents = JSON.parse(calendarEvents).events;
            const calObj = JSON.parse(calendarEvents);
            events.push(...cEvents.map((e: Event) => ({
                ...e,
                visible: e.visible && (calObj.visible ?? true),
            })));
        });
        return events.filter((event) => calendarIds.includes(event.calendarId));
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

    const [cals, setCals] = useState<{events: Event[], importUrl: string, title: string, id: number, visible: boolean}[]>(() => {
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

    useEffect(() => {
        const uniqueIds = [...new Set(cals.map((cal) => cal.id))];
        localStorage.setItem("loaded-calendars", JSON.stringify(uniqueIds));
        cals.forEach((cal) => localStorage.setItem(`calendar-${cal.id}`, JSON.stringify(cal)));
    }, [cals]);

    useEffect(() => {
        const eventCheckInt = setInterval(() => {
            const loadedCalendars = localStorage.getItem("loaded-calendars");
            if (!loadedCalendars) {
                localStorage.setItem("loaded-calendars", JSON.stringify([]));
                return [];
            }

            const events: Event[] = [];
            const calendarIds = JSON.parse(loadedCalendars);
            calendarIds.map((id: string) => {
                const calendarEvents = localStorage.getItem(`calendar-${id}`);
                if (!calendarEvents) return;
                
                const cEvents = JSON.parse(calendarEvents).events;
                const calObj = JSON.parse(calendarEvents);
                events.push(...cEvents.map((e: Event) => ({
                    ...e,
                    visible: e.visible && (calObj.visible ?? true),
                })));
            });
            return setEvents(events.filter((event) => calendarIds.includes(event.calendarId)));
        }, 1000);

        return () => {
            clearInterval(eventCheckInt);
        };
    }, []);




    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

    


    

    useEffect(() => {
        let m = true;
        
        const fetchAllCalendars = async () => {
            const events: Event[] = [];
            const importedCalendars: {events: Event[], importUrl: string, importLink: string, title: string, id: number, visible: boolean}[] = [];

            for (const url of icalUrls) {
                const response = await tFetch(url);
                if (!response.ok) { console.warn(`[iCal Loader]: Invalid network response (${response.status}) on ${url}.`); continue; }

                const raw = await response.text();
                const jcal = ICAL.parse(raw);
                const comp = new ICAL.Component(jcal);
                const vevents = comp.getAllSubcomponents('vevent');

                const calName = comp.getFirstPropertyValue("x-wr-calname") || "Imported";
                const generatedId = Math.abs(url.split("").reduce((a, b) => (((a << 5) - a) + b.charCodeAt(0)) | 0, 0));

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

                const calendarObj = { id: generatedId, importLink: url, importUrl: url, events: pEvents, visible: true, title: calName as string };
                localStorage.setItem(`calendar-${generatedId}`, JSON.stringify(calendarObj));
                importedCalendars.push(calendarObj);
            }

            if (m) {
                setCals(prevCals => {
                    const map = new Map(prevCals.map(c => [c.id, c]));
                    importedCalendars.forEach(c => map.set(c.id, c));
                    return Array.from(map.values());
                });

                const allLocalEvents: Event[] = [];
                const allIds = new Set([...cals.map(c => c.id), ...importedCalendars.map(c => c.id)]);
                allIds.forEach((id) => {
                    const item = localStorage.getItem(`calendar-${id}`);
                    if (!item) return;
                    const parsed = JSON.parse(item);
                    if (!icalUrls.includes(parsed.importLink)) {
                        allLocalEvents.push(...parsed.events);
                    }
                });

                setEvents([...events, ...allLocalEvents]);
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

    const [infoCtxMenu, setInfoCtxMenu] = useState<{ x: number; y: number; } | false>(false);
    const [eventCtxMenu, setEventCtxMenu] = useState<{ x: number; y: number; eventId: string } | false>(false);

    const showEventCtxMenu = (e: React.MouseEvent) => { 
        e.preventDefault();
        e.stopPropagation();

        setEventCtxMenu({ x: e.clientX, y: e.clientY, eventId: e.currentTarget.id });
        setInfoCtxMenu(false);
        return;
    }

    return (
        <div onClick={() => { setInfoCtxMenu(false); setEventCtxMenu(false); }} onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setInfoCtxMenu({ x: e.clientX, y: e.clientY }); setEventCtxMenu(false); }} className="flex flex-row w-full h-full gap-0.5 px-4 my-4">
            <div className="flex flex-col h-full pr-2 items-center gap-1">
                <NewEvent events={events} setEvents={setEvents} cals={cals} setCals={setCals} forceRefresh={forceRefresh} />
                <Import loadiCal={loadiCal} />
                <TimeLine />
            </div>
            <div className="flex flex-row relative w-full justify-between">
                {
                    days.map((day, index) => 
                        <Day key={index} type={day} events={events} setEvents={setEvents} showEventCtxMenu={showEventCtxMenu} offsetDate={monDate} />
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
            <AnimatePresence>
                {
                    (eventCtxMenu || infoCtxMenu) && (
                        <ContextMenu x={eventCtxMenu ? eventCtxMenu.x : (infoCtxMenu as { x: number; y: number; }).x} y={eventCtxMenu ? eventCtxMenu.y : (infoCtxMenu as { x: number; y: number; }).y} onBlur={() => { setEventCtxMenu(false); setInfoCtxMenu(false); }}>
                            {
                                eventCtxMenu ? (
                                    <div>
                                        <EventContextMenu setEventCtxMenu={setEventCtxMenu} events={events} setEvents={setEvents} cals={cals} setCals={setCals} id={eventCtxMenu.eventId} />
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-1">
                                        <p className="text-sm text-gray-600 font-semibold">Calendars</p>
                                        {
                                            cals.map((cal) => {
                                                return (
                                                    <div key={cal.id} className="flex flex-row items-center justify-between gap-3">
                                                        <div className="flex flex-row items-center gap-1">
                                                            {
                                                                cal.visible ? (
                                                                    <SquareCheck onClick={(e: React.MouseEvent) => {
                                                                        const calendars = [...cals.map((c) => { c.id === cal.id ? c.visible = false : null; return c })];
                                                                        const evs = [...events.map((e) => { e.calendarId === cal.id ? e.visible = false : null; return e })];
                                                                        setEvents(evs);
                                                                        setCals(calendars);
                                                                        return;

                                                                    }} className="w-4 h-4 text-gray-600 hover:cursor-pointer hover:text-blue-400/80 transition-all duration-200" />
                                                                ) : (
                                                                    <Square onClick={(e: React.MouseEvent) => {
                                                                        const calendars = [...cals.map((c) => { c.id === cal.id ? c.visible = true : null; return c })];
                                                                        const evs = [...events.map((e) => { e.calendarId === cal.id ? e.visible = true : null; return e })];
                                                                        setEvents(evs);
                                                                        setCals(calendars);
                                                                        return;
                                                                    }} className="w-4 h-4 text-gray-600 hover:cursor-pointer hover:text-blue-600/80 transition-all duration-200" />
                                                                )
                                                            }
                                                            <p className="text-gray-600 text-sm">{ cal.title }</p>
                                                        </div>
                                                        {
                                                            cal.importUrl !== "" ? (
                                                                <Eye className="text-gray-600/20 w-4 h-4" />
                                                            ) : (
                                                                <SquarePen className="text-gray-600/20 w-4 h-4" />
                                                            )
                                                        }
                                                    </div>
                                                )
                                            })
                                        }
                                    </div>
                                )
                            }
                        </ContextMenu>
                    )
                }        
            </AnimatePresence>
        </div>
    )
}