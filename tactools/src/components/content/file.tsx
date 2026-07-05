import { Tab } from "../../main";
import Button from "../utils/button";
import {
    Folder,
    AppWindow
} from "lucide-react";
import { revealItemInDir, openPath } from "@tauri-apps/plugin-opener";
import { convertFileSrc } from "@tauri-apps/api/core";


function FileViewer({ tab }: { tab: Tab }) {
    const handleFE = async () => {
        await revealItemInDir(tab.value.path.replace("\\\\", "\\"));
    };

    const handleOpen = async () => {
        await openPath(tab.value.path.replace("\\\\", "\\"));
    };


    switch (tab.value.fileExt) {
        case 'md':
            return <></>;

        case 'png':
        case 'jpg':
        case 'jpeg':
        case 'webp':
        case 'gif':
            return (
                <div className="flex flex-row items-center justify-center w-full h-full">
                    <img src={convertFileSrc(tab.value.path.replace("\\\\", "\\"))} className="mx-4 my-2 w-204 h-auto" />
                </div>
            )
        
        default:
            return ( 
                <div className="flex flex-col items-center mt-4">
                    <p className="text-base text-gray-600 mb-1">Incompatible file type.</p>
                    <div className="flex flex-row gap-2">
                        <Button onClick={handleFE} className="flex flex-row items-center gap-1.5">
                            <Folder className="w-4 h-4 text-gray-600" />
                            <p className="text-sm text-gray-600">Reveal in Explorer</p>
                        </Button>
                        <Button onClick={handleOpen} className="flex flex-row items-center gap-1.5">
                            <AppWindow className="w-4 h-4 text-gray-600" />
                            <p className="text-sm text-gray-600">Open in App</p>
                        </Button>
                    </div>
                </div>
            );
    };
};

export default function File({ tab }: { tab: Tab }) {
    return (
        <div className="flex flex-col w-full h-full items-center">
            <FileViewer tab={tab} />
        </div>
    );
};