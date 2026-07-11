"use client";
import { Tab } from "../../main";
import { useEffect, useState } from "react";
import {
    PlusCircle,
    BadgeAlert,
    Circle,
    Check
} from "lucide-react";
import Button from "../utils/button";
import { AnimatePresence, motion } from "framer-motion";


type Task = {
    id: number;
    name: string;
    description?: string;
    links?: string[];
    recurring?: Date;
    due?: Date;
    subTasks?: Task[]
    parentTask?: Task;
}

type List = {
    tasks: Task[]
}

function nlu(text: string) {

    // # ---- DUE DATES ---- # \\

    // [prefix modifiers]
    // #- due [day]/[date]/[relative]
    // #- on [day]/[date]/[relative]
    // #- in [num] [timeframe] / [relative]
    // #- within [relative]
    // #- by [day]/[relative]
    // #- for [day]/[date]
    // #- before [day]/[date]
    // #- until [day]/[date]/[relative]
    // #- at [time]
    

    // [period modifiers]
    // #- early [prefix modifier]
    // #- mid [prefix modifier]
    // #- late [prefix modifier]
    // #- (by) end of [prefix modifier]
    // #- (by) start of [prefix modifier]
    // #- (by) end of [prefix modifier]
    // #- time: hh/mm, hh:mm, hh.mm, hh/mm/ss, hh:mm:ss, hh:mm.ss, hh.mm.ss, hh, [num] pm, [num] am

    // [prefix input types]
    // #- day: Mon --> Sun, weekend, weekday
    // #- month: Jan --> Dec
    // #- date: dd/mm/yy(yy), dd-mm-yy(yy), mm/dd/yy(yy), yy(yy)/mm/dd, --, dd [month] [yy(yy)]
    // #- timeframe: year, month, fortnight, week, day, hour, minute, second
    // #- relative: last [timeframe], yesterday, today, tomorrow, next [timeframe], [num] [timeframe]s ago, day after tomorrow, day before yesterday, coming [day]
    // #- period: morning, afternoon, evening, night, tonight, noon, midnight, early, late, mid

    // # ---- ---- # \\

    const inp = text.toLowerCase().trim().replace(/[^a-z0-9\s:/@-]/g, "");

    const words = inp.split(/\s+/);
    let target = new Date();
    let matched = false;

    const indexes = new Set<number>();

    const days: Record<string, number> = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
    const months: Record<string, number> = { jan: 0 , feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
    const timeframes: Record<string, string> = {
        year: 'year', month: 'month', week: 'week', fortnight: 'fortnight', day: 'day', hour: 'hour', minute: 'minute', second: 'second'
    };

    const nextWord = (index: number) => words[index + 1] || "";

    for (let count = 0; count < words.length; count ++) {
        const word = words[count];
        const next = nextWord(count);

        switch (word) {
            case "tomorrow":
                indexes.add(count);
                target.setDate(target.getDate() + 1);
                matched = true;
                continue;

            case "yesterday":
                indexes.add(count);
                target.setDate(target.getDate() - 1);
                matched = true;
                continue;

            case "today":
                indexes.add(count);
                matched = true;
                continue;

            case "tonight":
                indexes.add(count);
                target.setHours(20, 0, 0, 0);
                matched = true;
                continue;
        }

        if (word === "day" && next === "after" && words[count + 2] === "tomorrow") {
            indexes.add(count);
            indexes.add(count + 1);
            indexes.add(count + 2);
            target.setDate(target.getDate() + 2);
            matched = true;
            count += 2;
            continue;
        }

        if (word === "day" && next === "before" && words[count + 2] === "yesterday") {
            indexes.add(count);
            indexes.add(count + 1);
            indexes.add(count + 2);
            target.setDate(target.getDate() - 2);
            matched = true;
            count += 2;
            continue;
        }


        const numVal = parseInt(word);
        if (!isNaN(numVal)) {
            const timeframe = next.endsWith("s") ? next.slice(0, -1) : next;

            if (timeframes[timeframe]) {
                matched = true;
                const ahead2 = words[count + 2] || "";
                const ago = ahead2 === "ago" || next === "ago";
                const delta = ago ? -numVal : numVal;

                    
                indexes.add(count);
                indexes.add(count + 1);
                if (ahead2 === "ago") indexes.add(count + 2);

                switch (timeframes[timeframe]) {
                    case 'year': target.setFullYear(target.getFullYear() + delta); break;
                    case 'month': target.setMonth(target.getMonth() + delta); break;
                    case 'week': target.setDate(target.getDate() + (delta * 7)); break;
                    case 'fortnight': target.setDate(target.getDate() + (delta * 14)); break;
                    case 'day': target.setDate(target.getDate() + delta); break;
                    case 'hour': target.setHours(target.getHours() + delta); break;
                    case 'minute': target.setMinutes(target.getMinutes() + delta); break;
                }
                count += ago ? 2 : 1;
                continue;
            }
        }


        const dayKey = Object.keys(days).find(d => word.startsWith(d));
        if (dayKey) {
            matched = true;
            const targetDayNum = days[dayKey];
            const currentDayNum = target.getDay();
            let diff = targetDayNum - currentDayNum;

            indexes.add(count);
            const prev = words[count - 1] || "";
            if (prev === "next") {
                diff += 7;
            } else if (prev === "last") {
                diff -= 7;
            } else if (diff <= 0) {
                diff += 7;
            }
            target.setDate(target.getDate() + diff);
            continue;
        }

        const isTimeContext = word.includes(":") || word.endsWith("pm") || word.endsWith("am") || words[count - 1] === "at" || words[count - 1] === "@";
        if (isTimeContext) {
            let hrs = parseInt(word);
            let mins = 0;

            indexes.add(count);
            if (words[count - 1] === "at" || words[count - 1] === "@") {
                indexes.add(count - 1);
            }

            if (word.includes(":")) {
                const parts = word.split(":");
                hrs = parseInt(parts[0]);
                mins = parseInt(parts[1]) || 0;
            }

            if (word.includes("pm") && hrs < 12) hrs += 12;
            if (word.includes("am") && hrs === 12) hrs = 0;
            
            if (next === "pm" && hrs < 12) { hrs += 12; indexes.add(count + 1); count++; }
            if (next === "am" && hrs === 12) { hrs = 0; indexes.add(count + 1); count++; }

            if (!isNaN(hrs)) {
                target.setHours(hrs, mins, 0, 0);
                matched = true;
            }

            if (word === "morning") target.setHours(9, 0, 0, 0);
            if (word === "afternoon") target.setHours(14, 0, 0, 0);
            if (word === "evening") target.setHours(17, 30, 0, 0);
            if (word === "night") target.setHours(21, 0, 0, 0);
            if (word === "noon") target.setHours(12, 0, 0, 0);
            if (word === "midnight") target.setHours(23, 59, 59, 999);
        }
    }

    const originalWords = text.trim().split(/\s+/);
    const filteredWords = originalWords.filter((_, idx) => !indexes.has(idx));
    const cleanedTitle = filteredWords.join(" ") || "Untitled";

    return {
        date: matched ? target : null,
        cleanedTitle: cleanedTitle
    };



};

export default function List({ tab }: { tab: Tab; }) {
    if (
        tab.title === "Overview"
    ) return ( <p> Overview section not finished. </p> );


    const [listInfo, setListInfo] = useState<List>(() => {
        const data = localStorage.getItem(`list-${tab.locatorId}`);
        if (!data) { localStorage.setItem(`list-${tab.locatorId}`, JSON.stringify({ values: { tasks: [] } })); return []; };

        return JSON.parse(data).values;
    });

    const [editing, setEditing] = useState<number | false>(false);
    const [initLoad, setInitLoad] = useState<boolean>(true);

    useEffect(() => {
        setTimeout(() => {
            setInitLoad(false);
        }, 500);
    }, [])

    useEffect(() => {
        if (!listInfo || !listInfo.tasks) return;
        
        const data = listInfo;
        const orig = JSON.parse(localStorage.getItem(`list-${tab.locatorId}`)!) as { values: List };
        if (!orig?.values?.tasks) return;


        const diff = data.tasks.filter((task: Task) => {
            const oTask = orig.values.tasks.find((o) => o.id === task.id);
            if (!oTask) return true;


            if (task.name === "Untitled") return false;

            return Object.keys(task).some(
                (key) => task[key as keyof Task] !== oTask[key as keyof Task]
            );
        });

        const del = orig.values.tasks.some(
            (oTask) => !listInfo.tasks.some((task) => task.id === oTask.id)
        );
        
        if (diff.length === 0 && !del) return;

        return localStorage.setItem(`list-${tab.locatorId}`, JSON.stringify({ values: listInfo }));
    }, [listInfo, tab.locatorId]);

    const newTask = (e: React.MouseEvent) => {
        const l = { tasks: [...listInfo.tasks] } as List;
        const nid = listInfo.tasks.reduce((max, task) => { return Math.max(max, task.id); }, 0) + 1 as number;
        l.tasks.push(
            {
                id: nid,
                name: "Untitled",
            }
        );
        setListInfo(l);
        setEditing(nid);

        setTimeout(() => {
            const form = document.getElementById(`form-${nid}`);
            if (!form) return;

            const input = form.children[0] as HTMLInputElement;
            input.select();
            input.focus();
            return;
        }, 50);


        return;
    };

    const changeName = (e: React.SubmitEvent<HTMLFormElement> | any) => {
        const id = parseInt(e.currentTarget.id.split("-")[1]);

        const task = listInfo.tasks.filter((task) => task.id === id);
        if (task.length === 0) return;
        
        const formData = new FormData(e.currentTarget);
        const newName = formData.get("newName") as string;
        
        if (!newName || newName.trim() === "" || newName.trim() === "Untitled") {
            const newl = listInfo.tasks.filter((task) => task.id !== id);
            setEditing(false);
            return setListInfo({ tasks: newl });
        };

        const nTask = { ...task[0] } as Task;
        nTask.name = newName;

        const calcd = nlu(newName);
        if (calcd) {
            nTask.due = calcd.date!;
            nTask.name = calcd.cleanedTitle;
        }

        const newl = [...listInfo.tasks]
        newl.splice(listInfo.tasks.findIndex((task) => task.id === id), 1, nTask);
        

        setListInfo({ tasks: newl });
        return setEditing(false);
    };

    const removeTask = (id: number) => {
        const ls = listInfo.tasks.filter((t) => t.id !== id);
        setListInfo({ tasks: ls });
        return;
    }

    return (
        <div className="flex flex-col mx-12 my-4 min-w-96">
            <p className="text-gray-600 text-2xl font-semibold">Tasks</p>
            <Button onClick={ newTask } name="New Task" className="flex flex-row items-center gap-2 mt-2 select-none mb-8">
                <PlusCircle className="w-4 h-4 text-gray-600" />
                <p className="text-gray-600 text-sm">
                    New Task
                </p>
            </Button>
            {
                listInfo.tasks.length > 0 ? 
                    (
                        <AnimatePresence>
                            {
                                listInfo.tasks.map((task, index) => 
                                    <motion.div key={`task-${task.id}`} initial={{ translateX: -5, opacity: 0 }} animate={{ translateX: 0, opacity: 100, transition: { duration: 0.2, delay: initLoad ? (index)*0.1 : 0 } }} exit={{ translateX: -10, opacity: 0, transition: { delay: 0, duration: 0.2 } }}  className="group mb-2 transition-x transition-translate-x transition-translate-y">
                                        <Button name={ task.name } className="flex flex-row gap-2 items-center justify-start">
                                            <div className="flex flex-row relative items-center justify-center w-fit h-fit">
                                                <Circle className="flex flex-row items-center justify-center text-gray-600/40 w-4 h-4" />
                                                <Check className="text-gray-600/40 w-3 h-3 absolute opacity-0 group-hover:opacity-100 transition-all duration-200" />
                                                <div className="absolute w-full h-full p-4" onClick={ () => { removeTask(task.id); } } />
                                            </div>
                                            {
                                                editing && editing === task.id ? 
                                                (
                                                    <form onClick={(e) => { e.preventDefault(); }} className="flex flex-row items-center" id={`form-${task.id}`} onSubmit={ changeName } onBlur={ changeName } >
                                                        <input className="focus:outline-none text-sm text-gray-600 placeholder-text-gray-500/60 my-0.5" placeholder={`List name [${tab.title}]...`} spellCheck={false} defaultValue={task.name} name="newName" type="text" autoComplete="off" />
                                                    </form>
                                                )
                                                : <p className="text-gray-600 text-sm">{ task.name }</p>
                                            }
                                        </Button>
                                    </motion.div>
                                )
                            }
                        </AnimatePresence>
                    )
                : (
                    <div className="flex flex-col w-full mt-8 items-center justify-center">
                        <BadgeAlert className="w-10 h-10 text-gray-500/60" />
                        <p className="text-base font-semibold text-gray-500/60">No outstanding tasks</p>
                    </div>
                )
            }
        </div>
    );
};