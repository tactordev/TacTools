import ReactDOM from "react-dom/client";
import React from "react";
import { useState } from "react";
import Sidebar from "./components/sidebar/sidebar";
import TitleBar from "./components/title-bar";
import Content from "./components/content/content";
import { useHotkey } from "@tanstack/react-hotkeys";
import "./globals.css";

export type FileTabVal = {
  fileExt: string;
  icon: React.ReactNode;
  path: string;
};

type PlanningTabVal = {
  icon: React.ReactNode;
};

export type Tab = {
  type: "file" | "planning-list";
  title: string;
  active: boolean;
  id: number;
  locatorId?: string;
  value: FileTabVal | PlanningTabVal;
};

function App() {
  const [tabs, setTabs] = useState<Tab[]>([]);

  const removeActiveTab = () => {
    console.log(tabs);
    let newTabs = tabs.filter((tab) => !tab.active);
    console.log(newTabs);
    const newActive = { ...newTabs[0], active: true } as Tab;
    if (newTabs.length > 0) newTabs.splice(0, 1, newActive);
    console.log(newTabs);
    return setTabs(newTabs);
  };

  const cycleForward = () => {
    if (tabs.length <= 1) return;

    const index = tabs.findIndex((tab) => tab.active);
    let incrementedIndex = index + 1;
    if (index === tabs.length - 1) incrementedIndex = 0;
    const newTabs = [...tabs];
    newTabs.splice(index, 1, { ...tabs[index], active: false });
    newTabs.splice(incrementedIndex, 1, {
      ...tabs[incrementedIndex],
      active: true,
    });

    setTabs(newTabs);
    return;
  };

  const cycleBackward = () => {
    if (tabs.length <= 1) return;

    const index = tabs.findIndex((tab) => tab.active);
    let decrementedIndex = index - 1;
    if (index === 0) decrementedIndex = tabs.length - 1;
    const newTabs = [...tabs];
    newTabs.splice(index, 1, { ...tabs[index], active: false });
    newTabs.splice(decrementedIndex, 1, {
      ...tabs[decrementedIndex],
      active: true,
    });

    setTabs(newTabs);
    return;
  };

  useHotkey("Mod+W", removeActiveTab);
  useHotkey("Mod+Tab", cycleForward);
  useHotkey("Mod+Shift+Tab", cycleBackward);

  return (
    <React.StrictMode>
      <main className="flex flex-col w-full h-[100vh] z-0 overflow-y-hidden">
        <TitleBar tabs={tabs} setTabs={setTabs} />
        <div className="flex flex-row overflow-y-hidden h-full">
          <Sidebar tabs={tabs} setTabs={setTabs} />
          <Content tabs={tabs} setTabs={setTabs} />
        </div>
      </main>
    </React.StrictMode>
  );
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <App />,
);
