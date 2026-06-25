"use client";

import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect, useState } from "react";
import {
    Square,
    Copy,
    Minus,
    X
} from "lucide-react";

export default function TitleBar() {
    const [maximised, setMaximised] = useState<boolean>(false);
    const appWindow = getCurrentWindow();

    useEffect(() => {
        let unlisten: (() => void) | undefined;

        const initial = async () => {
            const max = await appWindow.isMaximized();
            setMaximised(max);
        };
        initial();

        const setup = async () => {
            unlisten = await appWindow.onResized( async () => {
                const max = await appWindow.isMaximized();
                setMaximised(max);
            });
        };
        setup();

        return () => {
            if (unlisten) unlisten();
        }
    }, [appWindow]);

    
    const handleMinimise = () => appWindow.minimize();
    const toggleMaximise = () => appWindow.toggleMaximize();
    const handleClose = () => appWindow.close();

    return (
        <div className="relative w-full h-8 flex flex-row items-center justify-between bg-[#EDEDF2]/40 z-0 -mb-[2px]">
            <div className="ml-64 shadow-sm h-[1px] absolute bottom-[1px] left-0"></div>
            <div data-tauri-drag-region className="flex absolute top-0 left-0 w-full h-full z-10"></div>
            <div className="group ml-1 hover:bg-[#EDEDF2] transition-all duration-200 py-0.5 hover:cursor-pointer select-none px-2 z-10 rounded-md">
                <p className="text-sm text-gray-600 hover:text-black transition-all duration-200">Default Workspace</p>
            </div>
            <div className="flex w-fit h-full z-10">
                <button id="titlebar-minimize" title="Minimise" onClick={handleMinimise} className="hover:bg-gray-300 h-full px-2 transition-all duration-200">
                    <Minus className="w-4 h-4 text-gray-600" />
                </button>
                <button id="titlebar-maximize" title={maximised ? "Restore" : "Maximise"} onClick={toggleMaximise} className="hover:bg-gray-300 h-full px-2 transition-all duration-200">
                    {
                        maximised ? <Copy className="w-3 h-3 rotate-90 text-gray-600" /> : <Square className="w-4 h-4 text-gray-600" />
                    }
                </button>
                <button id="titlebar-close" title="Close" onClick={handleClose} className="hover:bg-gray-300 h-full px-2 transition-all duration-200">
                    <X className="w-5 h-5 text-gray-600" />
                </button>
            </div>
    </div>
    )
}