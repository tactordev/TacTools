"use client";
import { Tab } from "../../main";
import { useEffect, useState } from "react";


type Task = {
    id: number;
    name: string;
    description?: string;
    links?: string[];
    recurring?: Date;
    due?: Date;
    subTasks?: Task[]
    parentTask?: Task;
}

type ListInfo = {
    tasks: Task[];
}

type List = {
    title: string;
    storName: string;
    info: ListInfo;
}

export default function List({ tab }: { tab: Tab; }) {
    if (
        tab.title === "Overview"
    ) return ( <p> Overview section not finished. </p> );


    const [listInfo, setListInfo] = useState<List | null>(null);


    return (
        <div className="mx-12 my-4 ">
            <p className="text-gray-600 text-2xl font-semibold">Tasks</p>
            {

            }
        </div>
    );
};