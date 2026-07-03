"use client";
import { useEffect, useState, useRef, Suspense } from "react";
import Button from "../utils/button";
import {
    Folder,
    Settings2,
    Ellipsis,
    FileText,
    FileXCorner,
    FileSpreadsheet,
    FileChartColumn,
    ChevronUp
} from "lucide-react";
import { open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import { readDir } from "@tauri-apps/plugin-fs";
import { motion, AnimatePresence } from "motion/react";



function Loading() {
    return (
        <div>
            <p>
                Loading..
            </p>
        </div>
    )
}

function getFileIcon(ending: string): React.ReactElement {
    if (Object.keys(endToIcon).includes(ending)) {
        return endToIcon[ending];
    }

    if (Object.keys(endingAliases).includes(ending)) {
        return endToIcon[endingAliases[ending]];
    }

    return endToIcon["unknown"];
}
const endingAliases: Record<string, string> = {
    "docx": "txt",
    "gdoc": "txt",
    "gsheet": "xlsx",
    "gform": "form"
}

const iconClasses = "w-4 h-4 text-gray-600 shrink-0"
const endToIcon: Record<string, React.ReactElement> = {
    "txt": <FileText className={iconClasses} />,
    "xlsx": <FileSpreadsheet className={iconClasses} />,
    "form": <FileChartColumn className={iconClasses} />,
    "unknown": <FileXCorner className={iconClasses} />
}

export default function Notes() {
    const [path, setPath] = useState<string | null>(null);
    const [extraDropdown, setExtraDropdown] = useState<boolean>(false);
    const [contents, setContents] = useState<Record<"folders" | "files", string[]> | "loading" | null>(null);

    useEffect(() => {
        const dropdownHandler = () => {
            setExtraDropdown(false);
        };
        window.addEventListener("mouseup", dropdownHandler);

        return (() => {
            window.removeEventListener("mouseup", dropdownHandler)
        });


    }, []);

    useEffect(() => {
        if (!path) { setContents(null); return; };

        let isMounted = true;
        setContents("loading");


        readDir(path)
            .then((entries) => {
                if (!isMounted) return;

                const dirs: string[] = [];
                const files: string[] = [];

                for (const entry of entries) {
                    if (entry.isDirectory) {
                        if (entry.name.startsWith(".") || entry.name.startsWith("$")) continue;
                        dirs.push(entry.name);
                    } else if (entry.isFile) {
                        if (entry.name.endsWith(".ini") || entry.name.startsWith(".") || entry.name.startsWith("$")) continue;
                        files.push(entry.name);
                    };

                };
                
                setContents({ folders: dirs, files: files });
            });

        return () => {
            isMounted = false;
        }
    }, [path])

    const openFolderSelection = async () => {

        setContents("loading");

        const selectedPath = await open({
            directory: true,
            multiple: false,
            title: "Select a project folder",
            recursive: true
        });

        if (selectedPath) {
            await invoke<string>('scope_drive', { path: selectedPath });
            setPath(selectedPath);
            return true;
        }
        
        return false;
    };

    const togglExtraDropdown = () => {
        setExtraDropdown(!extraDropdown);
    }

    const moveBackFolder = async (e: React.MouseEvent) => {
        if (!path) return;
        if (path.endsWith(e.currentTarget.textContent)) { setPath(path); return; }
        setContents("loading");
        setPath(path.split(e.currentTarget.textContent)[0] + e.currentTarget.textContent);
        return;
    } 

    const moveForwardFolder = async (e: React.MouseEvent, dirName: string) => {
        if (!path) return;
        setContents("loading");
        setPath(path + "\\" + dirName);
        return;
    }

    return (
        <div className="flex flex-col w-full h-full mt-4 px-2 items-center">
            {
                !path ? (
                    <Button name="Select Folder" onClick={ openFolderSelection }>
                        <div className="flex flex-row gap-2 items-center justify-center"><Folder className="w-4 h-4 text-gray-600" /> <p className="text-xs text-gray-600 select-none">Select Folder</p></div>
                    </Button>
                )
                : (
                    <div className="flex flex-row ml-2 w-full justify-between relative">
                        <div className="relative flex flex-row-reverse overflow-x-hidden overflow-y-hidden justify-end items-end">
                            {
                                path.split("\\").reverse().splice(0, path.split("\\").length > 3 ? 2 : path.split("\\").length - 1).map((value, index) => <motion.div initial={{ opacity: 0, translateY: 5 }} animate={{ opacity: 1, translateY: 0 }} transition={{type: "tween", duration: 0.25, delay: (path.split("\\").reverse().splice(0, path.split("\\").length > 4 ? 3 : path.length - 1).length - index)*0.125}} key={index} className="flex flex-row gap-0.25"><Button name={`Folder: ${value}`} onClick={ moveBackFolder } className="!shadow-none !px-1"><p className="text-xs text-gray-600 select-none max-w-10 overflow-hidden whitespace-nowrap text-ellipsis">{value}</p></Button><p className="text-gray-600 select-none">/</p></motion.div>)
                            }
                            {
                                path.split("\\").length > 3 ? <motion.div initial={{ opacity: 0, translateY: 5 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: "tween", duration: 0.25, delay: 0 }} className="flex flex-row gap-0.25 select-none"><Button className="!shadow-none !h-fit" name="Show more" onClick={ togglExtraDropdown }><Ellipsis className="w-3.5 h-4 text-gray-600" /></Button><p className="text-gray-600">/</p></motion.div> : <></>
                            }
                            <Button name="Move Up" onClick = {() => { if (path.split("\\").length <= 1) { return; } setPath(path.split("\\").slice(0, -1).join("\\")) }} className={`transition-all duration-200 !px-1 !py-1 !shadow-none ${path.split("\\").length > 1 ? "" : "hover:!cursor-default hover:!bg-transparent"}`}><ChevronUp className={`w-4 h-4 ${path.split("\\").length > 1 ? "text-gray-600" : "text-gray-400"}`} /></Button>
                        </div>
                        
                        <AnimatePresence>
                            {
                                extraDropdown && (
                                    <motion.div key={"extras-dropdown"} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "tween", duration: 0.125 }} exit={{ opacity: 0, scale: 0 }} className="absolute flex flex-col gap-1 pl-2 pr-4 py-2 mt-0.5 min-w-8 min-h-4 top-full backdrop-blur-lg bg-[#EDEDF2]/20 z-50 rounded-md shadow-sm">
                                        {
                                            path.split("\\").splice(0, path.split("\\").length - 2).map((value, index) => <motion.div initial={{ opacity: 0, translateX: -5 }} animate={{ opacity: 1, translateX: 0 }} transition={{ type: "tween", delay: ((index + 1)*0.075), duration: 0.25 }} key={index}><Button name={`Folder: ${value}`} onClick={ moveBackFolder } className="!shadow-none select-none"><p className="text-xs text-gray-600">{value}</p></Button></motion.div>)
                                        }
                                    </motion.div>
                                )
                            }
                        </AnimatePresence>
                        <Button name="Switch Folder" onClick={ openFolderSelection } className="transition-all duration-200"><Settings2 className="w-4 h-4 text-gray-600" /></Button>
                    </div>
                )
            }
            <div className="flex flex-col w-full mt-4">
                <AnimatePresence mode="wait">
                    { contents === "loading" && (
                        <Loading />
                    ) }

                    {
                        contents && contents !== "loading" && (
                            <div>
                                { contents.folders.map((dirName, index) => <motion.div key={index} initial={{ opacity: 0, translateX: -5 }} animate={{ opacity: 1, translateX: 0 }} transition={{ type: "tween", delay: (index + 1)*0.075, duration: 0.25 }} className="select-none">
                                                                        <Button name={`${dirName}`} className="!shadow-none" onClick={ (e: React.MouseEvent) => {moveForwardFolder(e, dirName)} }>
                                                                            <div className="flex flex-row items-center gap-2">
                                                                                <Folder className="w-4 h-4 text-gray-600 shrink-0" />
                                                                                <p className="text-gray-600 text-xs overflow-hidden whitespace-nowrap text-ellipsis">{ dirName }</p>
                                                                            </div>
                                                                        </Button>
                                                                    </motion.div>
                                ) }
                                { contents.folders.length > 0 && ( <div className="py-2.5" /> ) }
                                {
                                    contents.files.map(( fileName, index ) =>   <motion.div key={index} initial={{ opacity: 0, translateX: -5 }} animate={{ opacity: 1, translateX: 0 }} transition={{ type: "tween", delay: (contents.folders.length + index + 1)*0.075, duration: 0.25 }} className="select-none">
                                                                                    <Button name={`${fileName}`} className="!shadow-none">
                                                                                        <div className="flex flex-row items-center gap-2">
                                                                                            { getFileIcon(fileName.split(".").pop()!) }
                                                                                            <p className="text-gray-600 text-xs overflow-hidden whitespace-nowrap text-ellipsis">{ fileName }</p>
                                                                                        </div>
                                                                                    </Button>
                                                                                </motion.div>)
                                }
                            </div>
                        )
                    }
                </AnimatePresence>
            </div>
        </div>
    )
}