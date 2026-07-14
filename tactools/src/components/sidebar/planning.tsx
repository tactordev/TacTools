"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Button from "../utils/button";
import { Hash, Plus, Inbox, Edit, Trash2 } from "lucide-react";
import { Tab } from "../../main";
import ContextMenu from "../utils/context-menu";


export function title(value: string) {
    return [value.slice(0, 1).toUpperCase(), value.slice(1, value.length)].join("");
}


function CTXMenu(
    {
        x,
        y,
        id,
        tabs,
        setTabs,
        lists,
        setLists,
        onBlur,
        edit
    }: {
        x: number;
        y: number;
        id: number;
        tabs: Tab[];
        setTabs: (tabs: Tab[]) => void;
        lists: { name: string; id: number; }[];
        setLists: (lists: { name: string; id: number; }[]) => void;
        onBlur: () => void;
        edit: (e: React.MouseEvent, id?: number) => void;
    }
) {
    const [confirmDelete, setConfirmDelete] = useState<boolean>(false);


    return (
        <ContextMenu x={x} y={y} onBlur={onBlur}>
            <Button onClick={(e: React.MouseEvent) => { edit(e, id); }} name="Rename"  className="flex flex-row items-center justify-start gap-3 !shadow-none select-none">
                <Edit className="w-4 h-4 text-gray-600" />
                <p className="text-gray-600 text-sm">Rename</p>
            </Button>
            { lists.find((list) => list.id === id)!.name !== "overview" ? (
                <Button onClick={() => {
                    if (!confirmDelete) return setConfirmDelete(true);

                    const ts = tabs.filter((tab) => tab.locatorId !== id.toString());
                    setTabs(ts);

                    const l = lists.filter((list) => list.id !== id);
                    return setLists(l);
                }} name="Delete"  className={`flex flex-row items-center justify-start gap-3 !shadow-none select-none bg-red-300/30 hover:!bg-red-300/20 ${confirmDelete ? "flash-red" : ""}`}>
                    <Trash2 className="w-4 h-4 text-red-500/60" />
                    <p className={`text-red-500/60 text-sm min-w-20`}>{ confirmDelete ? "Confirm?" : "Delete" }</p>
                </Button>
            ) : <></> }
        </ContextMenu>
    );
}


export default function Calendar({ tabs, setTabs }: { tabs: Tab[]; setTabs: (tabs: Tab[]) => void; }) {
    const clickTimeoutRef = useRef<number | null>(null);
    const listRender = useRef<HTMLDivElement | null>(null);

    const [lists, setLists] = useState<{ name: string; id: number; }[]>(() => {
        if (typeof window === "undefined") return [{ name: "overview", index: 0 }];

        const saved = localStorage.getItem("listNames");
        if (saved) return [ { name: "overview", id: 0}, ...JSON.parse(saved).values ];

        return [{ name: "overview", id: 0 }];
    });

    const [lastId, setLastId] = useState<number>(() => {
        if (typeof window === "undefined") return 0;
        
        const data = localStorage.getItem("lastListId");
        return data ? parseInt(data) : 0;
    });

    const [editing, setEditing] = useState<number | false>(false);
    const [ctxMenu, setCtxMenu] = useState<{ id: number, x: number, y: number } | false>(false);

    useEffect(() => {
        localStorage.setItem('lastListId', lastId.toString());
    }, [lastId]);

    useEffect(() => {
        const parsed = {
            values: lists.filter((value) => value.name !== "overview")
        };
        localStorage.setItem("listNames", JSON.stringify(parsed));
    }, [lists]);

    const addNewList = (e: React.MouseEvent) => {
        e.preventDefault();
        if (!listRender || lastId === null) return;
        const id = lastId + 1
        setLists([...lists, { name: "untitled", id: id }]);
        setLastId(id);
        setEditing(lists.length);
        
        setTimeout(() => {
            const form = document.getElementById(`${id}`) as HTMLFormElement;
            (form.children[0] as HTMLInputElement).focus();
            (form.children[0] as HTMLInputElement).select();
        }, 100);

    };


    const editName = (e: React.MouseEvent, id?: number) => {
        let index;

        e.preventDefault(); 

        if (clickTimeoutRef.current) { clearTimeout(clickTimeoutRef.current); clickTimeoutRef.current = null; }

        if (id) {
            index = lists.findIndex((list) => list.id === id);
        } else {
            index = parseInt(e.currentTarget.id.split("-")[1]);
        }
        
        if (!index) return;

        setEditing(index);
        setTimeout(() => {
            const form = document.getElementById(`${lists[index].id}`) as HTMLFormElement;
            (form.children[0] as HTMLInputElement).focus();
            (form.children[0] as HTMLInputElement).select();
        }, 50);
    };


    const changeName = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const targetId = parseInt(e.currentTarget.id);
        const data = new FormData(e.currentTarget).get("newName") as string;

        const index = lists.findIndex((list) => list.id === targetId);
        if (index === -1) return;

        const updLists = [...lists];
        updLists[index] = {
            name: data.trim() === "" ? "Untitled" : data,
            id: targetId
        };

        setEditing(false);
        setLists(updLists);
        return;
    };

    const rightClick = (e: React.MouseEvent, index: number) => {
        e.preventDefault();
        e.stopPropagation();
        return setCtxMenu({ id: lists[index].id, x: e.clientX, y: e.clientY });
    }

    return (
        <div className="px-2 flex flex-col w-full h-full">
            <div className="w-full mb-2 mt-4 flex flex-row justify-end">
                <Button name="New List" onClick={addNewList}>
                    <Plus className="text-gray-600 w-4 h-4" />
                </Button>
            </div>
            <div ref={listRender}>
                <AnimatePresence>
                    {
                        lists.map((value: {name: string; id: number;}, index: number) => {
                            return (
                                <div key={`list-${value.id}`}>
                                    <motion.div  className="flex flex-col relative" id={`motiondiv-${index}`} onContextMenu={ (e: React.MouseEvent) => { rightClick(e, index); } } onDoubleClick={ editName } initial={{ opacity: 0, translateX: -5 }} animate={{ opacity: 1, translateX: 0 }} transition={{ type: "tween", delay: Math.min((index + 1)*0.015, 0.2), duration: 0.15 }} >
                                        <Button  className="flex flex-row items-center gap-2 mt-1 !shadow-none !py-0 has-[:focus]:bg-blue-200/30" name={title(lists[index].name)} onClick={(e) => {
                                            if (editing === index || e.detail > 1) return;

                                            if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);

                                            clickTimeoutRef.current = setTimeout(() => {
                                                const previous = tabs.map(tab => ({ ...tab, active: false }));
                                                setTabs([
                                                    ...previous, 
                                                    { 
                                                        type: "planning-list", 
                                                        title: title(value.name), 
                                                        active: true,
                                                        id: tabs.reduce((max, tab) => {return Math.max(max, tab.id)}, 0) + 1,
                                                        value: { 
                                                            icon: value.name === "overview" ? <Inbox className="w-4 h-4 text-gray-600/80" /> : <Hash className="w-3 h-3 text-gray-600/80" />   
                                                        },
                                                        locatorId: value.id.toString()
                                                    } as Tab
                                                ]);
                                                clickTimeoutRef.current = null;
                                            }, 200);
                                            }}>
                                            { value.name === "overview" ? <Inbox className="w-4 h-4 text-gray-600/80"/> : <Hash className="w-4 h-4 text-gray-600/80" />  }
                                            {
                                                editing === index ? (
                                                    <form onClick={(e) => { e.preventDefault(); }} className="flex flex-row items-center" id={`${value.id}`} onSubmit={ changeName } onBlur={ changeName } >
                                                        <input className="focus:outline-none text-sm text-gray-600 placeholder-text-gray-500/60 my-0.5" placeholder={`List name...`} spellCheck={false} defaultValue={value.name} name="newName" type="text" autoComplete="off" />
                                                    </form>
                                                ) : (
                                                    <p className="text-sm text-gray-600 select-none my-0.5">
                                                        { title(value.name) }
                                                    </p>
                                                )
                                            }
                                        </Button>
                                    </motion.div>
                                    <AnimatePresence>
                                        {
                                            ctxMenu && ctxMenu.id === value.id && (
                                                <CTXMenu tabs={tabs} setTabs={setTabs} lists={lists} setLists={setLists} onBlur={ () => setCtxMenu(false) } x={ctxMenu.x} y={ctxMenu.y} id={value.id} edit={ editName } />
                                            )
                                        }
                                    </AnimatePresence>
                                </div>
                            );
                        })
                    }
                </AnimatePresence>
            </div>
        </div>
    );
}