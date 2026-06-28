"use client";


import { useState, useEffect } from "react";
import {
    Notebook,
    Calendar,
    MonitorCog,
    BadgeAlert
} from "lucide-react";
import Notes from "./notes";
import Button from "../utils/button";


export default function Sidebar() {

    const [state, setState] = useState<"none" | "notes" | "planning" | "utilities">("none")

    return (
        <div className="flex flex-col items-center bg-[#EDEDF2]/40 mt-0.5 w-64 h-full transition-all duration-200 shadow-sm z-20">
            <div className="flex flex-row gap-2 mt-2">
                <Button className={`${state === "notes" ? "bg-blue-300/20" : "bg-[#EDEDF2] text-gray-600"}`} name="Notes" onClick={() => setState("notes")}><Notebook className={`${state === "notes" ? "text-blue-400/90" : "text-gray-400 group-hover:text-gray-400" } w-4 h-4`}  xlinkTitle="Notes" onClick={() => setState("notes")}/></Button>
                <Button className={`${state === "planning" ? "bg-blue-300/20" : "bg-[#EDEDF2] text-gray-600"}`} name="Calendar" onClick={() => setState("planning")}><Calendar className={`${state === "planning" ? "text-blue-400/90" : "text-gray-400 group-hover:text-gray-400" } w-4 h-4 transition-all duration-200`} xlinkTitle="Calendar" onClick={() => setState("planning")} /></Button>
                <Button className={`${state === "utilities" ? "bg-blue-300/20" : "bg-[#EDEDF2] text-gray-600"}`} name="Utilities" onClick={() => setState("utilities")}><MonitorCog className={`${state === "utilities" ? "text-blue-400/90" : "text-gray-400 group-hover:text-gray-400" } w-4 h-4 transition-all duration-200`} xlinkTitle="Utilities" onClick={() => setState("utilities")} /></Button>
            </div>
            {
                state === "none" ? 
                    <div className="w-full h-full flex flex-col gap-2 items-center mt-12">
                        <BadgeAlert className="w-8 h-8 text-gray-500/60" />
                        <p className="text-lg font-semibold text-gray-500/60">No option chosen.</p>
                    </div>
                : state === "notes" ? 
                    <Notes />
                : state === "planning" ? 
                    <div></div>
                :
                    <div></div>
                
            }
        </div>
    )
}