"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Button from "../utils/button";
import { Hash, Plus, Inbox } from "lucide-react";
import { Tab } from "../../main";

function title(value: string) {
    return [value.slice(0, 1).toUpperCase(), value.slice(1, value.length).toLowerCase()].join("");
}



export default function Calendar({ tabs, setTabs }: { tabs: Tab[]; setTabs: (tabs: Tab[]) => void; }) {
    const [lists, setLists] = useState<string[]>(["overview"]);
    const [editing, setEditing] = useState<number | false>(false);

    const listRender = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        
        const handleClick = (e: Event) => {
            const form = document.getElementById(`editname-${editing}`) as HTMLFormElement;
            if (!form || !editing) return;
            const l = lists.splice(editing, 1, new FormData(form).get("newName") as string)
            setLists(l);
        }
        window.addEventListener("click", handleClick);



        if (lists && localStorage.getItem("listNames")) {
            const saved = localStorage.getItem("listNames");
            setLists([...lists, ...saved!.split(", ")]);
        }


        return () => {
            window.removeEventListener("click", handleClick);
        };

    }, []);

    useEffect(() => {
        const stored = localStorage.getItem("listNames");
        const parsed = lists.filter((value) => value !== "overview").join(", ");

        if (stored === parsed) return;


        return localStorage.setItem("listNames", parsed);

    }, [lists]);

    const addNewList = (e: React.MouseEvent) => {
        e.preventDefault();
        if (!listRender) return;
        setLists([...lists, "untitled"]);
        setEditing(lists.length);

        setTimeout(() => {
            const index = lists.length;
            const form = document.getElementById(`editname-${index}`) as HTMLFormElement;
            (form.children[0] as HTMLInputElement).focus();
            (form.children[0] as HTMLInputElement).select();
        }, 100);

    };


    const editName = (e: React.MouseEvent) => {
        const id = e.currentTarget.id;
        const index = id.split("-")[1];
        if (!index) return;
        setEditing(parseInt(index));
        setTimeout(() => {
            const form = document.getElementById(`editname-${index}`) as HTMLFormElement;
            (form.children[0] as HTMLInputElement).focus();
            (form.children[0] as HTMLInputElement).select();
        }, 50);
    };


    const changeName = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const index = e.currentTarget.id.split("-")[1];
        setEditing(false);
        const l = [...lists];
        const data = new FormData(e.currentTarget).get("newName") as string
        l.splice(parseInt(index), 1, data === "" ? "Untitled" : data)
        setLists(l);
        return;
    };

    const rightClick = () => {
        console.log("Right click");
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
                        lists.map((value: string, index: number) => {
                            return (
                                <motion.div onAuxClick={ rightClick }  className="flex flex-col" key={index} id={`motiondiv-${index}`} onDoubleClick={ editName } initial={{ opacity: 0, translateX: -5 }} animate={{ opacity: 1, translateX: 0 }} transition={{ type: "tween", delay: Math.min((index + 1)*0.015, 0.2), duration: 0.15 }} >
                                    <Button className="flex flex-row items-center gap-2 mt-1 !shadow-none !py-0 has-[:focus]:bg-blue-200/30" name={title(lists[index])} onClick={() => {
                                        const previous = tabs.map(tab => ({ ...tab, active: false }));
                                        setTabs([
                                            ...previous, 
                                            { 
                                                type: "planning-list", 
                                                title: title(value), 
                                                active: true,
                                                id: tabs.reduce((max, tab) => {return Math.max(max, tab.id)}, 0) + 1,
                                                value: { 
                                                    icon: <Hash className="w-3 h-3 text-gray-600/80" />   
                                                }
                                            } as Tab
                                        ])}}>
                                        { value === "overview" ? <Inbox className="w-4 h-4 text-gray-600/80"/> : <Hash className="w-4 h-4 text-gray-600/80" />  }
                                        {
                                            editing === index ? (
                                                <form className="flex flex-row items-center" id={`editname-${index}`} onSubmit={ changeName } onBlur={ changeName } >
                                                    <input className="focus:outline-none text-sm text-gray-600 placeholder-text-gray-500/60 my-0.5" placeholder={`List name [${value}]...`} spellCheck={false} defaultValue={value} name="newName" type="text" autoComplete="off" />
                                                </form>
                                            ) : (
                                                <p className="text-sm text-gray-600 select-none my-0.5">
                                                    { title(value) }
                                                </p>
                                            )
                                        }
                                    </Button>
                                </motion.div>
                            );
                        })
                    }
                </AnimatePresence>
            </div>
        </div>
    );
}