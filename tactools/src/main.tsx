import ReactDOM from "react-dom/client";
import React from "react";
import { useState } from "react";
import Sidebar from "./components/sidebar/sidebar";
import TitleBar from "./components/title-bar";
import Content from "./components/content/content";
import "./globals.css";


type FileTabVal = {
  fileExt: string;
  fileIcon: React.ReactNode;
  path: string;
}

export type Tab = {
  type: "file";
  title: string;
  active: boolean;
  id: number;
  value: FileTabVal;
}

function App() {
  const [tabs, setTabs] = useState<Tab[]>([]);
  
  return (
    <React.StrictMode>
      <main className="flex flex-col w-full h-[100vh] z-0 overflow-y-hidden">
        <TitleBar tabs={tabs} setTabs={setTabs} />
        <div className="flex flex-row h-full">
          <Sidebar tabs={tabs} setTabs={setTabs} />
          <Content tabs={tabs} setTabs={setTabs} />
        </div>
      </main>
    </React.StrictMode>
  );
}



ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <App />
);