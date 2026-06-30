"use client";
import { useEffect, useState, useRef } from "react";
import Button from "../utils/button";
import {
    Folder,
    Settings2,
    Ellipsis
} from "lucide-react";
import { open } from "@tauri-apps/plugin-dialog";
import { motion, AnimatePresence } from "motion/react";



export default function Notes() {
    const [path, setPath] = useState<string | null>(null);
    const [extraDropdown, setExtraDropdown] = useState<boolean>(false);
    const [contents, setContents] = useState<string[] | null>(null);

    useEffect(() => {
        const dropdownHandler = () => {
            setExtraDropdown(false);
        };
        window.addEventListener("mousedown", dropdownHandler);

        return (() => {
            window.removeEventListener("mousedown", dropdownHandler)
        });


    }, []);

    const openFolderSelection = async () => {
        const path = await open({
            directory: true,
            multiple: false,
            title: "Select a project folder"
        });

        if (path) {
            setPath(path);
            return true;
        }

        return false;
    };

    const togglExtraDropdown = () => {
        setExtraDropdown(!extraDropdown);
    }

    return (
        <div className="flex flex-col w-full h-full mt-4 items-center">
            {
                !path ? (
                    <Button name="Select Folder" onClick={ openFolderSelection }>
                        <div className="flex flex-row gap-2 items-center justify-center"><Folder className="w-4 h-4 text-gray-600" /> <p className="text-xs text-gray-600 select-none">Select Folder</p></div>
                    </Button>
                )
                : (
                    <div className="flex flex-row w-full px-2 justify-between relative">
                        <div className="relative flex flex-row-reverse overflow-x-hidden overflow-y-hidden justify-end items-end">
                            {
                                path.split("\\").reverse().splice(0, path.length > 4 ? 3 : path.length - 1).map((value, index) => <div key={index} className="flex flex-row gap-0.25"><Button name={`Folder: ${value}`} className="!shadow-none !px-1"><p className="text-xs text-gray-600 select-none max-w-10 overflow-hidden whitespace-nowrap text-ellipsis">{value}</p></Button><p className="text-gray-600 select-none">/</p></div>)
                            }
                            {
                                path.length > 4 ? <div className="flex flex-row gap-0.25 select-none"><Button className="!shadow-none !h-fit" name="Show more" onClick={ togglExtraDropdown }><Ellipsis className="w-3.5 h-4 text-gray-600" /></Button><p className="text-gray-600">/</p></div> : <></>
                            }
                        </div>
                        
                        <AnimatePresence>
                            {
                                extraDropdown && (
                                    <motion.div key={"extras-dropdown"} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", duration: 0.25 }} exit={{ opacity: 0, scale: 0 }} className="absolute flex flex-col gap-1 pl-2 pr-4 py-2 mt-0.5 min-w-8 min-h-4 top-full backdrop-blur-md bg-[#EDEDF2]/60 rounded-md shadow-sm">
                                        {
                                            path.split("\\").splice(3, path.length).map((value, index) => <div key={index}><Button name={`Folder: ${value}`} className="!shadow-none select-none"><p className="text-xs text-gray-600">{value}</p></Button></div>)
                                        }
                                    </motion.div>
                                )
                            }
                        </AnimatePresence>
                        <Button name="Switch Folder" onClick={ openFolderSelection }><Settings2 className="w-4 h-4 text-gray-600" /></Button>
                    </div>
                )
            }
        </div>
    )
}