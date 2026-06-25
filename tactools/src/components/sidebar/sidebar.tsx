"use client";


import { useState, useEffect } from "react";
import {
    Notebook,
    Calendar,
    MonitorCog,
    BadgeAlert
} from "lucide-react";



export default function Sidebar() {

    const [state, setState] = useState<"none" | "notes" | "planning" | "utilities">("none")

    return (
        <div className="flex flex-col items-center bg-[#EDEDF2]/40 mt-0.5 w-64 h-full transition-all duration-200 shadow-sm z-20">
            <div className="flex flex-row gap-2 mt-2">
                <div className={`${state === "notes" ? "bg-[#EDEDF2]" : "bg-[#EDEDF2]/40"} group hover:bg-[#EDEDF2]/80 transition-all duration-200 hover:cursor-pointer px-2 py-1 rounded-md shadow-xs`} title="Notes" onClick={() => setState("notes")}><Notebook className={`${state === "notes" ? "text-gray-500" : "text-gray-400/60 group-hover:text-gray-400"} w-4 h-4`}  xlinkTitle="Notes" onClick={() => setState("notes")}/></div>
                <div className={`${state === "planning" ? "bg-[#EDEDF2]" : "bg-[#EDEDF2]/40"} group hover:bg-[#EDEDF2]/80 transition-all duration-200 hover:cursor-pointer px-2 py-1 rounded-md shadow-xs`} title="Calendar" onClick={() => setState("planning")}><Calendar className={`${state === "planning" ? "text-gray-500" : "text-gray-400/60 group-hover:text-gray-400"} w-4 h-4 transition-all duration-200`} xlinkTitle="Calendar" onClick={() => setState("planning")} /></div>
                <div className={`${state === "utilities" ? "bg-[#EDEDF2]" : "bg-[#EDEDF2]/40"} group hover:bg-[#EDEDF2]/80 transition-all duration-200 hover:cursor-pointer px-2 py-1 rounded-md shadow-xs`} title="Utilities" onClick={() => setState("utilities")}><MonitorCog className={`${state === "utilities" ? "text-gray-500" : "text-gray-400/60 group-hover:text-gray-400"} w-4 h-4 transition-all duration-200`} xlinkTitle="Utilities" onClick={() => setState("utilities")} /></div>
            </div>
            {
                state === "none" ? 
                    <div className="w-full h-full flex flex-col gap-2 items-center mt-12">
                        <BadgeAlert className="w-8 h-8 text-gray-500" />
                        <p className="text-lg font-semibold text-gray-500">No option chosen.</p>
                    </div>
                : state === "notes" ? 
                    <div></div>
                : state === "planning" ? 
                    <div></div>
                :
                    <div></div>
                
            }
        </div>
    )
}