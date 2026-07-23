"use client";

import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect, useRef, useState } from "react";
import { Tab } from "../main";
import { Square, Copy, Minus, X } from "lucide-react";

export default function TitleBar({
  tabs,
  setTabs,
}: {
  tabs: Tab[];
  setTabs: (_: Tab[]) => void;
}) {
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
      unlisten = await appWindow.onResized(async () => {
        const max = await appWindow.isMaximized();
        setMaximised(max);
      });
    };
    setup();

    return () => {
      if (unlisten) unlisten();
    };
  }, [appWindow]);

  const handleMinimise = () => appWindow.minimize();
  const toggleMaximise = () => appWindow.toggleMaximize();
  const handleClose = () => appWindow.close();

  const scrollbar = useRef<HTMLDivElement>(null);
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const container = scrollbar.current;
    if (!container) return;

    if (e.deltaY !== 0) {
      e.preventDefault();

      container.scrollLeft += e.deltaY;
    }
  };

  return (
    <div className="relative w-full h-8 flex flex-row items-center justify-between bg-[#EDEDF2]/40 z-0">
      <div
        ref={scrollbar}
        onWheel={handleWheel}
        className="absolute flex flex-row top-0 h-full items-center left-64 max-w-[calc(100%-22rem)] gap-0.5 px-0.5 z-20 overflow-x-auto overflow-y-hidden hiding-scrollbar"
      >
        {tabs.map((value, index) => (
          <div
            key={index}
            className={`group flex flex-row gap-1 items-center select-none transition-all duration-200 h-full px-2 ${value.active ? "bg-white" : "hover:bg-gray-100"} hover:cursor-pointer z-10`}
            onClick={() => {
              const newTabs = tabs.map((tab) => {
                if (tab.id === value.id) {
                  return { ...tab, active: true };
                } else {
                  return { ...tab, active: false };
                }
              });
              setTabs(newTabs);
            }}
            title={value.title}
          >
            <div
              className={`${value.active ? "" : "opacity-40 group-hover:opacity-60"}`}
            >
              {value.value.icon}
            </div>
            <p
              className={`text-sm ${value.active ? "text-gray-600" : "text-gray-600/40 group-hover:text-gray-600/60"} overflow-hidden whitespace-nowrap text-ellipsis max-w-24`}
            >
              {value.title}
            </p>
            <X
              className={`flex z-30 w-4 h-4 ${value.active ? "text-gray-600" : "text-gray-600/40 group-hover:text-gray-600/60"}`}
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                let newTabs = tabs.filter((tab) => tab.id !== value.id);
                const newActive = { ...newTabs[0], active: true } as Tab;
                if (newTabs.length > 0) newTabs.splice(0, 1, newActive);
                setTabs(newTabs);
              }}
            />
          </div>
        ))}
      </div>
      <div
        data-tauri-drag-region
        className="flex absolute top-0 left-0 w-full h-full z-10"
      ></div>
      <div className="group ml-1 hover:bg-[#EDEDF2] transition-all duration-200 py-0.5 hover:cursor-pointer select-none px-2 z-10 rounded-md">
        <p className="text-sm text-gray-600 hover:text-black transition-all duration-200">
          Default Workspace
        </p>
      </div>
      <div className="flex w-fit h-full z-100 bg-[#EDEDF2]">
        <button
          id="titlebar-minimize"
          title="Minimise"
          onClick={handleMinimise}
          className="hover:bg-gray-300 h-full px-2 transition-all duration-200"
        >
          <Minus className="w-4 h-4 text-gray-600" />
        </button>
        <button
          id="titlebar-maximize"
          title={maximised ? "Restore" : "Maximise"}
          onClick={toggleMaximise}
          className="hover:bg-gray-300 h-full px-2 transition-all duration-200"
        >
          {maximised ? (
            <Copy className="w-3 h-3 rotate-90 text-gray-600" />
          ) : (
            <Square className="w-4 h-4 text-gray-600" />
          )}
        </button>
        <button
          id="titlebar-close"
          title="Close"
          onClick={handleClose}
          className="hover:bg-gray-300 h-full px-2 transition-all duration-200"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
      </div>
    </div>
  );
}
