"use client";
import Loader from "../utils/loader";
import {
    PlusCircle,
    BadgeAlert,
    Circle,
    Check,
    GripVertical,
    Trash2,
    Edit,
    Hash
} from "lucide-react";
import { Tab } from '../../main';
import { Task, List } from "./list";
import { useState, useEffect } from "react";
import { title } from "../sidebar/planning";

type OverviewTask = Task & { listId: number; listName: string; };

export default function Overview({ tabs, setTabs }: { tabs: Tab[]; setTabs: (tabs: Tab[]) => void; }) {
    const [items, setItems] = useState<OverviewTask[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const saved = localStorage.getItem("listNames");
        const customLists: { name: string; id: number }[] = saved ? JSON.parse(saved).values ?? [] : [];

        const collected: OverviewTask[] = [];

        for (const list of customLists) {
            const raw = localStorage.getItem(`list-${list.id}`);
            if (!raw) continue;

            let parsed: { values: List };
            try {
                parsed = JSON.parse(raw);
            } catch {
                continue;
            }

            const allTasks = [
                ...(parsed.values?.tasks ?? []),
                ...(parsed.values?.sections?.flatMap((s) => s.tasks) ?? [])
            ];

            for (const task of allTasks) {
                if (!task.due) continue;
                collected.push({ ...task, listId: list.id, listName: title(list.name) });
            }
        }

        collected.sort((a, b) => new Date(a.due!).getTime() - new Date(b.due!).getTime());

        setItems(collected);
        setLoading(false);
    }, []);

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();

    const overdue = items.filter((t) => new Date(t.due!).getTime() < startOfToday);
    const dueToday = items.filter((t) => {
        const ts = new Date(t.due!).getTime();
        return ts >= startOfToday && ts <= endOfToday;
    });
    const upcoming = items.filter((t) => new Date(t.due!).getTime() > endOfToday);

    const openList = (listId: number, listName: string) => {
        const previous = tabs.map((tab) => ({ ...tab, active: false }));
        setTabs([
            ...previous,
            {
                type: "planning-list",
                title: listName,
                active: true,
                id: tabs.reduce((max, tab) => Math.max(max, tab.id), 0) + 1,
                value: { icon: <Hash className="w-3 h-3 text-gray-600/80" /> },
                locatorId: listId.toString()
            } as Tab
        ]);
    };

    const Section = ({ label, tasks, accent }: { label: string; tasks: OverviewTask[]; accent: string; }) => {
        if (tasks.length === 0) return null;
        return (
            <div className="mb-6">
                <p className={`text-sm font-semibold mb-2 ${accent}`}>{label} ({tasks.length})</p>
                <div className="flex flex-col gap-1">
                    {tasks.map((task) => (
                        <div
                            key={`${task.listId}-${task.id}`}
                            onClick={() => openList(task.listId, task.listName)}
                            className="flex flex-row items-center justify-between px-2 py-1.5 rounded-md hover:bg-blue-200/20 hover:cursor-pointer group"
                        >
                            <div className="flex flex-row items-center gap-2">
                                <Circle className="w-3.5 h-3.5 text-gray-400" />
                                <p className="text-sm text-gray-600">{task.name}</p>
                            </div>
                            <div className="flex flex-row items-center gap-2">
                                <p className="text-xs text-gray-400 group-hover:text-blue-400/80 transition-all duration-200">{task.listName}</p>
                                <p className="text-xs text-gray-500/70">
                                    {new Date(task.due!).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col mx-12 my-4 min-w-96 w-full max-w-2xl">
            <p className="text-gray-600 text-2xl font-semibold mb-1">Overview</p>
            <p className="text-gray-400 text-xs mb-6">View all your due tasks.</p>

            {loading ? (
                <Loader />
            ) : items.length === 0 ? (
                <div className="flex flex-col items-center mt-12">
                    <BadgeAlert className="w-10 h-10 text-gray-500/60" />
                    <p className="text-base font-semibold text-gray-500/60 mt-2">Nothing due. Mx. Productive!</p>
                </div>
            ) : (
                <>
                    <Section label="Overdue" tasks={overdue} accent="text-red-500/70" />
                    <Section label="Today" tasks={dueToday} accent="text-blue-500/70" />
                    <Section label="Upcoming" tasks={upcoming} accent="text-gray-600" />
                </>
            )}
        </div>
    );
};