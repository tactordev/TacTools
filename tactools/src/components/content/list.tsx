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