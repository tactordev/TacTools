"use client";

import { Tab } from "../../main";
import File from "./file";
import List from "./list";

export default function Content({ tabs }: { tabs: Tab[]; setTabs: (_: Tab[]) => void; }) {

    const activeTab = tabs.filter((tab) => tab.active === true)[0];

   
    return (
        <div className="flex flex-row w-full h-full">
            {
                activeTab && (
                    activeTab.type === "file" ? <File tab={activeTab} />
                    : activeTab.type === "planning-list" ? <List key={activeTab.locatorId} tab={activeTab} />
                    : <p>Unknown tab type.</p>
                )
            }
        </div>
    )
}
