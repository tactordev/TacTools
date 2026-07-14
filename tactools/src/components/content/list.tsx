"use client";
import { Tab } from "../../main";
import { useEffect, useState, useRef } from "react";
import {
    PlusCircle,
    BadgeAlert,
    Circle,
    Check,
    GripVertical,
    Pointer
} from "lucide-react";
import Button from "../utils/button";
import { AnimatePresence, motion } from "framer-motion";
import { title } from "../sidebar/calendar";
import { nlu } from "../utils/nlu";

type Task = {
    id: number;
    name: string;
    sectionId: number | null;
    description?: string;
    links?: string[];
    recurring?: Date;
    due?: Date;
    subTasks?: Task[]
    parentTask?: Task;
}

type Section = {
    id: number;
    name: string;
    tasks: Task[];
    description?: string;
}


type List = {
    tasks: Task[];
    sections: Section[];
}



function max(one: any, two: any) {
    if (one.filter((n: any) => n).length > 0) return one;
    return two;
};


function Task(
    {
        task,
        index,
        editing,
        removeTask,
        changeName,
        initLoad,
        setListInfo,
        listInfo
    }: {
        task: Task;
        index: number;
        editing: { type: string; id: number; } | false;
        removeTask: (id: number ) => void;
        changeName: (e: React.SubmitEvent<HTMLFormElement> | any) => void;
        initLoad: boolean;
        setListInfo: (listInfo: List) => void;
        listInfo: List;
    }
) {
    const [dragging, setDragging] = useState<boolean>(false);
    const [pos, setPos] = useState<{ x: number; y: number; }>({ x: 0, y: 0 });
    const [offset, setOffset] = useState<{ x: number; y: number; }>({ x: 0, y: 0 });
    
    const closest = useRef<HTMLElement | null>(null);
    const drag = useRef<HTMLDivElement | null>(null);

    const pointerDown = (e: React.PointerEvent) => {
        setDragging(true);
        const rect = drag.current!.getBoundingClientRect();
        setOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });


        window.addEventListener('pointermove', pointerMove);
        window.addEventListener('pointerup', pointerUp);
    };

    const getAllDivs = () => {
        // const sectionIds = listInfo.sections.map((section) => { return section.id });
        const taskIds = listInfo.tasks.map((task) => { return task.id });
        taskIds.push(0);
        const sectTaskIds = listInfo.sections.flatMap((section) => { return [...section.tasks.map((task) => `${section.id}-${task.id}` ), `${section.id}-0`] });
        
        // const sectionDivs = sectionIds.map((id) => { const el = document.getElementById(`sectiondiv-${id}`); el?.classList.remove("!bg-blue-100/40", "closest"); return el; });
        const taskDivs = taskIds.map((id) => { const el = document.getElementById(`taskdiv-${id}`); el?.classList.remove("!opacity-100", "closest"); return el; });
        const secTaskDivs = sectTaskIds.map((id) => { const el = document.getElementById(`sectiontaskdiv-${id}`); el?.classList.remove("!opacity-100", "closest"); return el; });

        console.log(closest.current);
        return [...taskDivs, ...secTaskDivs]; //...sectionDivs
    }

    const pointerMove = (e: PointerEvent) => {
        setPos({
            x: e.clientX - offset.x,
            y: e.clientY - offset.y
        });

        const allDivs = getAllDivs(); 

        const distances: { id: string; distance: number; }[] = [];
        allDivs.forEach((val) => {
            if (!val) return;
            const valRect = val.getBoundingClientRect();
            const dist = Math.sqrt(Math.pow((valRect.x - e.clientX), 2) + Math.pow((valRect.y - e.clientY), 2));
            return distances.push({ id: val.id, distance: dist });
        });

        const shortestDist = distances.reduce((min, task) => { return Math.min(min, task.distance) }, 100000);

        if (shortestDist === 0) return;

        const shortestDistVal = distances.find((value) => value.distance === shortestDist);
        if (!shortestDistVal) return;

        const el = document.getElementById(`${shortestDistVal.id}`);
        if (!el) return;
        
        if (shortestDistVal.id.includes("taskdiv")) { el?.classList.add("!opacity-100", "closest"); } else { el?.classList.add("!bg-blue-100/40", "closest"); }
        return closest.current = el;
    };

    const pointerUp = () => {
        setDragging(false);

        const divs = getAllDivs();

        // possible scenarios:
        // section
        // section task divider
        // uncategorised task divider

        const ls = { tasks: [...listInfo.tasks], sections: [...listInfo.sections]};

        let curSect: { obj: Section | undefined; index: number; } | null = null;
        if (task.sectionId) {
            curSect = { obj: ls.sections.find((section) => section.id === task.sectionId), index: ls.sections.findIndex((section) => section.id === task.sectionId) }
        }
        let curIndex: number = !curSect ? ls.tasks.findIndex((t) => t.id === task.id) : curSect.obj!.tasks.findIndex((t) => t.id === task.id);

        if (closest.current) {
            
            if (curSect) {
                ls.sections[curSect.index].tasks = ls.sections[curSect.index].tasks.filter((t) => t.id !== task.id);
                
            } else {
                ls.tasks = ls.tasks.filter((t) => t.id !== task.id);
            }

            if (closest.current.id.includes("sectiontaskdiv")) {
                
                const tlocId = closest.current.id.split("-")[2];
                const sectId = closest.current.id.split("-")[1];

                const nextSectIndex = ls.sections.findIndex((s) => s.id === parseInt(sectId));

                if (tlocId === "0") {
                    ls.sections[nextSectIndex].tasks.push({ ...task, sectionId: parseInt(sectId) });   
                } else {
                    const tind = ls.sections[nextSectIndex].tasks.findIndex((t) => t.id === parseInt(tlocId));
                    ls.sections[nextSectIndex].tasks.splice(tind + 1, 0, { ...task, sectionId: parseInt(sectId) });
                }
            } else if (closest.current.id.includes("taskdiv")) {

                const tlocId = closest.current.id.split("-")[1];
                const tind = ls.tasks.findIndex((t) => t.id === parseInt(tlocId));
                ls.tasks.splice(tind + 1, 0, { ...task, sectionId: null });
            } else if (closest.current.id.includes("section")) {

                const secId = closest.current.id.split("-")[1];
                const secInd = ls.sections.findIndex((s) => s.id === parseInt(secId));
                ls.sections[secInd].tasks.push({ ...task, sectionId: parseInt(secId) });
            } else {
                console.warn("Unknown closest element.");
            }
        }

        window.removeEventListener('pointermove', pointerMove);
        window.removeEventListener('pointerup', pointerUp);

        closest.current = null;
        setListInfo(ls);
    }



    return (
        <motion.div
            layout
            key={task.id}
            initial={{ translateX: -5, opacity: 0 }}
            animate={{ translateX: 0, opacity: 100, transition: { duration: 0.2, delay: initLoad ? (index)*0.1 : 0 } }}
            exit={{ translateX: -10, opacity: 0, transition: { delay: 0, duration: 0.2 } }}
            
            style={{
                position: dragging ? 'fixed' : 'relative',
                left: dragging ? pos.x : 'auto',
                top: dragging ? pos.y : 'auto',
                zIndex: dragging ? 1000 : 1,
                userSelect: 'none'
            }}
            className={`group flex flex-row w-96 mb-2 ${dragging ? "rotate-5 cursor-grabbing" : ""} transition-transform duration-200`}
        >
            <Button disableMovement={true} name={ task.name } className="flex flex-row w-full gap-2 items-center justify-start">
                <div
                
                    ref={drag}
                    onPointerDown={pointerDown}
                    className="absolute flex z-200 left-0 hover:cursor-move h-full items-center justify-center"
                >
                    <GripVertical className="text-gray-600/40 w-4 h-4 px-0 mx-0 select-none pointer-events-none" />
                </div>
                <div  className="ml-2 flex flex-row relative items-center justify-center w-fit h-fit">
                    <Circle className="flex flex-row items-center justify-center text-gray-600/40 w-4 h-4" />
                    <Check className="text-gray-600/40 w-3 h-3 absolute opacity-0 group-hover:opacity-100 transition-all duration-200" />
                    <div className="absolute w-full h-full p-4" onClick={ () => { removeTask(task.id); } } />
                </div>
                {
                    editing && editing.type === "task" && editing.id === task.id ? 
                    (
                        <form onClick={(e) => { e.preventDefault(); }} className="flex flex-row items-center" id={`form-${task.id}`} onSubmit={ changeName } onBlur={ changeName } >
                            <input className="focus:outline-none text-sm text-gray-600 placeholder-text-gray-500/60 my-0.5" spellCheck={false} defaultValue={task.name} name="newName" type="text" autoComplete="off" />
                        </form>
                    )
                    : <p className="text-gray-600 text-sm">{ task.name }</p>
                }
            </Button>
        </motion.div>  
    );
}

export default function List({ tab }: { tab: Tab; }) {
    if (
        tab.title === "Overview"
    ) return ( <p> Overview section not finished. </p> );


    const [listInfo, setListInfo] = useState<List>(() => {
        const data = localStorage.getItem(`list-${tab.locatorId}`);
        if (!data) { localStorage.setItem(`list-${tab.locatorId}`, JSON.stringify({ values: { tasks: [], sections: [] } })); return { tasks: [], sections: [] }; };

        return JSON.parse(data).values;
    });

    const [editing, setEditing] = useState<{ type: string; id: number } | false>(false);
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


        let diffd = false;

        try {
            let count = 0;
            for (const task of data.tasks) {
                const oTask = orig.values.tasks[count];
                for (const key of Object.keys(task)) {
                    if (task[key as keyof Task] === oTask[key as keyof Task]) {
                        continue;
                    }

                    diffd = true;
                    break;
                }

                if (diffd) break;
                
                count++;
            }

            count = 0;
            for (const section of data.sections) {
                const oSect = orig.values.sections[count];
                for (const key of Object.keys(section)) {
                    if (section[key as keyof Section] === oSect[key as keyof Section]) {
                        continue;
                    }

                    diffd = true;
                    break;
                }

                if (diffd) break;
                continue;
            }
        } catch(err) { 
            diffd = true;
        }


        if (!diffd) return;

        return localStorage.setItem(`list-${tab.locatorId}`, JSON.stringify({ values: listInfo }));
    }, [listInfo]);

    const newTask = () => {
        const l = { tasks: [...listInfo.tasks], sections: [...listInfo.sections] } as List;

        let nid = 0;
        for (const task of listInfo.tasks) {
            if (task.id > nid) nid = task.id;
        }

        for (const section of listInfo.sections) {
            for (const task of section.tasks) {
                if (task.id > nid) nid = task.id;
            }
        }
        nid++;

        l.tasks.push(
            {
                id: nid,
                name: "Untitled",
                sectionId: null
            }
        );
        setListInfo(l);
        setEditing({ type: "task", id: nid });

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
        e.preventDefault();


        if (e.currentTarget.id.includes("section")) {
            const id = parseInt(e.currentTarget.id.split("-")[2]);

            const section = listInfo.sections.filter((section) => section.id === id);

            const formData = new FormData(e.currentTarget);
            const name = formData.get("newName") as string;

            if (!name || name.trim() === "" || name.trim() === "Untitled") {
                const newl = listInfo.sections.filter((section) => section.id !== id);
                setEditing(false);
                return setListInfo({ tasks: [...listInfo.tasks], sections: [...newl] });
            }

            const nSect = { ...section[0] } as Section;
            nSect.name = name;

            const nl = [...listInfo.sections];
            nl.splice(listInfo.sections.findIndex((section) => section.id === id), 1, nSect);
            
            setListInfo({ tasks: [...listInfo.tasks], sections: nl });
            return setEditing(false);
        }
        
        const id = parseInt(e.currentTarget.id.split("-")[1]);

        const task = listInfo.tasks.filter((task) => task.id === id);
        
        const formData = new FormData(e.currentTarget);
        const newName = formData.get("newName") as string;
        
        if (!newName || newName.trim() === "" || newName.trim() === "Untitled") {
            const newl = listInfo.tasks.filter((task) => task.id !== id);
            setEditing(false);
            return setListInfo({ tasks: newl, sections: [...listInfo.sections] });
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
        

        setListInfo({ tasks: newl, sections: [...listInfo.sections] });
        return setEditing(false);
    };

    const removeTask = (id: number) => {
        const ls = listInfo.tasks.filter((t) => t.id !== id);
        const sections = listInfo.sections.flatMap((s) => { return { ...s, tasks: s.tasks.filter((t) => t.id !== id ) } });

        setListInfo({ tasks: ls, sections: [...sections] });
        return;
    }


    const addSection = (e: React.MouseEvent) => {
        const nid = listInfo.sections.reduce((max, task) => { return Math.max(max, task.id); }, 0) + 1 as number;
        const ls = { tasks: [...listInfo.tasks], sections: [...listInfo.sections] } as List;

        ls.sections.push({
            id: nid,
            name: "Untitled",
            tasks: []
        });

        setListInfo(ls);
        setEditing({ type: "section", id: nid });

        setTimeout(() => {
            const form = document.getElementById(`form-section-${nid}`);
            if (!form) return;
            const input = form.children[0] as HTMLInputElement;
            input.focus();
            input.select();
            return;
        }, 50)
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
            <div className="flex flex-col w-96 px-4">
                <p className="text-gray-600 font-semibold mb-1">Uncategorised</p>
                
                
                <div id={`taskdiv-0`} className="w-full pt-0.5 h-0 ml-4 bg-blue-200 opacity-0 transition-opacity duration-200 hover:opacity-100 mb-1" />
                <AnimatePresence>
                        {
                        listInfo.tasks && max (
                            listInfo.tasks.map((task, index) => 
                                <div key={`task-${task.id}`} className="flex flex-col items-center justify-center mx-4 w-full h-full">
                                    <Task task={task} index={index} removeTask={removeTask} editing={editing} changeName={changeName} setListInfo={setListInfo} listInfo={listInfo} initLoad={initLoad} />
                                    <div id={`taskdiv-${task.id}`} className="w-full h-0.5 bg-blue-200 opacity-0 transition-opacity duration-200 hover:opacity-100 -mt-1" />
                                </div>
                            )
                        , <div key={`uncategorised-empty`} className="flex flex-col">
                            <div className="flex flex-col w-full items-center justify-center">
                                <BadgeAlert className="w-10 h-10 text-gray-500/60" />
                                <p className="text-base font-semibold text-gray-500/60">No outstanding tasks</p>
                            </div>
                          </div>
                        )
                    }
                </AnimatePresence>
                
                {
                    listInfo.sections && listInfo.sections.map((section) =>
                        <div  className="w-96 mt-8 pb-8 px-4 -ml-4 py-2 rounded-md" key={`sectiondiv-${section.id}`} id={`sectiondiv-${section.id}`}> 
                            { editing && editing.type === "section" && editing.id === section.id ? 
                                <form className="flex flex-row items-center" id={`form-section-${section.id}`} onSubmit={ changeName } onBlur={ changeName } >
                                    <input className="focus:outline-none text-sm text-gray-600 placeholder-text-gray-500/60 my-0.5" spellCheck={false} defaultValue={section.name} name="newName" type="text" autoComplete="off" />
                                </form>
                            : <p className="text-gray-600 font-semibold mb-1">{ title(section.name) }</p> }
                            <div key={`sectiontaskdiv-0`} id={`sectiontaskdiv-${section.id}-0`} className="w-full h-0.5 bg-blue-200 opacity-0 transition-opacity duration-200 hover:opacity-100 mb-1 -mt-1" />
                            {
                                max(section.tasks.map((task, index) => 
                                        <div key={`task-${task.id}`}>
                                            <Task task={task} index={index} removeTask={removeTask} editing={editing} changeName={changeName} setListInfo={setListInfo} listInfo={listInfo} initLoad={initLoad} />
                                            <div id={`sectiontaskdiv-${section.id}-${task.id}`} className="w-full h-0.5 bg-blue-200 opacity-0 transition-opacity duration-200 hover:opacity-100 mb-1 -mt-1" />
                                        </div>
                                ),  <div key={`${section.id}-empty`} className="flex flex-col">
                                        <div className="flex flex-col w-full mt-8 items-center justify-center">
                                            
                                            <BadgeAlert className="w-10 h-10 text-gray-500/60" />
                                            <p className="text-base font-semibold text-gray-500/60">No outstanding tasks</p>
                                        </div>
                                    </div>
                                )
                            }
                        </div>
                    )
                }
            </div>

            <div className="py-2 mt-4 group hover:cursor-pointer select-none" onClick={addSection}>
                <div className="flex flex-row items-center justify-center h-0.5 w-full bg-gray-400/10 group-hover:bg-blue-400/40">
                    <div className="flex flex-row gap-1 items-center justify-center bg-white px-2">
                        <PlusCircle className="text-blue-400 w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                        <p className="text-blue-400/80 text-sm -mt-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-200">Section Divider</p>
                    </div>
                </div>
            </div>
        </div>
    );
};