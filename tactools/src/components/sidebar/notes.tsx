"use client";
import { useEffect, useState } from "react";
import Button from "../utils/button";
import {
    Folder,
    Settings2
} from "lucide-react";
import { open } from "@tauri-apps/plugin-dialog";



export default function Notes() {
    const [path, setPath] = useState<string | null>(null);
    const [contents, setContents] = useState<string[] | null>(null);

    useEffect(() => {
        return;
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

    return (
        <div className="flex flex-col w-full h-full mt-4 items-center">
            {
                !path ? (
                    <Button name="Select Folder" onClick={ openFolderSelection }>
                        <div className="flex flex-row gap-2 items-center justify-center"><Folder className="w-4 h-4 text-gray-600" /> <p className="text-xs text-gray-600 select-none">Select Folder</p></div>
                    </Button>
                )
                : (
                    <div className="flex flex-row w-full px-2 justify-between">
                        <div className="flex flex-row overflow-x-hidden overflow-y-hidden">
                            {
                                path.split("\\").map((value, index) => <div key={index} className="flex flex-row gap-0.25 last:invisible"><Button name={`Folder: ${value}`} className="!shadow-none !px-1"><p className="text-xs text-gray-600 select-none max-w-6 overflow-hidden whitespace-nowrap text-ellipsis">{value}</p></Button><p className="text-gray-600 select-none">/</p></div>)
                            }
                        </div>
                        <Button name="Switch Folder" onClick={ openFolderSelection }><Settings2 className="w-4 h-4 text-gray-600" /></Button>
                    </div>
                )
            }
        </div>
    )
}