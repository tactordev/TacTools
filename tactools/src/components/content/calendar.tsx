"use client";


import { AnimatePresence } from "framer-motion";
import Button from "../utils/button";
import ContextMenu from "../utils/context-menu";
import {
    ImportIcon
} from "lucide-react";
import { useState } from "react";

function Day(
    {
        type
    }: {
        type: string;
    }
) {
    return (
        <div className="flex flex-col w-full items-center first:border-l-2 border-r-2 border-gray-100 h-full overflow-hidden">
            <p className="w-full text-center font-semibold text-gray-600 h-6">
                {
                    type
                }
            </p>
            <hr className="bg-gray-100 text-gray-100 w-full h-0.5 mt-0.5" />
        </div>
    );
};

function TimeLine() {
    const times = [...Array(25).keys()];
    return (
        <div className="flex flex-col h-[calc(100%-4rem)] w-fit mt-3 justify-between">
            {
                times.map((time, index) => <p key={index} className="text-gray-600/40 flex justify-center text-xs font-mono tabular-nums">{ time }</p>)
            }
        </div>
    )
}


export default function Calendar() {

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
                        <Day key={index} type={day} />
                    )
                }
            </div>
        </div>
    )
}