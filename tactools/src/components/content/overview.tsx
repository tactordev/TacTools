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
  Hash,
} from "lucide-react";
import { Tab } from "../../main";
import { Task, List } from "./list";
import { useState, useEffect, useReducer } from "react";
import { title } from "../sidebar/planning";
import { Day, Event } from "./calendar";
import { fetch as tFetch } from "@tauri-apps/plugin-http";
import ICAL from "ical.js";

type OverviewTask = Task & { listId: number; listName: string };

export default function Overview({
  tabs,
  setTabs,
}: {
  tabs: Tab[];
  setTabs: (tabs: Tab[]) => void;
}) {
  const [items, setItems] = useState<OverviewTask[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const saved = localStorage.getItem("listNames");
    const customLists: { name: string; id: number }[] = saved
      ? (JSON.parse(saved).values ?? [])
      : [];

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
        ...(parsed.values?.sections?.flatMap((s) => s.tasks) ?? []),
      ];

      for (const task of allTasks) {
        if (!task.due) continue;
        collected.push({
          ...task,
          listId: list.id,
          listName: title(list.name),
        });
      }
    }

    collected.sort(
      (a, b) => new Date(a.due!).getTime() - new Date(b.due!).getTime(),
    );

    setItems(collected);
    setLoading(false);
  }, []);

  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime();
  const endOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999,
  ).getTime();

  const overdue = items.filter(
    (t) => new Date(t.due!).getTime() < startOfToday,
  );
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
        locatorId: listId.toString(),
      } as Tab,
    ]);
  };

  const Section = ({
    label,
    tasks,
    accent,
  }: {
    label: string;
    tasks: OverviewTask[];
    accent: string;
  }) => {
    if (tasks.length === 0) return null;
    return (
      <div className="mb-6">
        <p className={`text-sm font-semibold mb-2 ${accent}`}>
          {label} ({tasks.length})
        </p>
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
                <p className="text-xs text-gray-400 group-hover:text-blue-400/80 transition-all duration-200">
                  {task.listName}
                </p>
                <p className="text-xs text-gray-500/70">
                  {new Date(task.due!).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  /// day
  const [events, setEvents] = useState<Event[]>(() => {
    const loadedCalendars = localStorage.getItem("loaded-calendars");
    if (!loadedCalendars) {
      localStorage.setItem("loaded-calendars", JSON.stringify([]));
      return [];
    }

    const events: Event[] = [];
    const calendarIds = JSON.parse(loadedCalendars);
    calendarIds.map((id: string) => {
      const calendarEvents = localStorage.getItem(`calendar-${id}`);
      if (!calendarEvents) return;

      const cEvents = JSON.parse(calendarEvents).events;
      const calObj = JSON.parse(calendarEvents);
      events.push(
        ...cEvents.map((e: Event) => ({
          ...e,
          visible: e.visible && (calObj.visible ?? true),
        })),
      );
    });
    return events.filter((event) => calendarIds.includes(event.calendarId));
  });

  const [icalUrls, setIcalUrls] = useState<string[]>(() => {
    const icalUrls = localStorage.getItem("ical-urls");
    if (!icalUrls) {
      localStorage.setItem("ical-urls", JSON.stringify([]));
      return [];
    }

    return JSON.parse(icalUrls);
  });

  const getCurMonDate = () => {
    const today = new Date();
    const currentDayIndex = today.getDay();
    const distanceToMonday = currentDayIndex === 0 ? 6 : currentDayIndex - 1;

    const startOfWeek = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - distanceToMonday,
    );
    startOfWeek.setHours(0, 0, 0, 0);

    return startOfWeek;
  };

  const monDate = getCurMonDate();

  const [cals, setCals] = useState<
    {
      events: Event[];
      importUrl: string;
      title: string;
      id: number;
      visible: boolean;
    }[]
  >(() => {
    const calendars = localStorage.getItem("loaded-calendars");
    if (!calendars) return [];
    const calendarIds = JSON.parse(calendars);
    return calendarIds
      .map((calendarId: string) => {
        const item = localStorage.getItem(`calendar-${calendarId}`);
        return item ? JSON.parse(item) : null;
      })
      .filter(Boolean);
  });

  useEffect(() => {
    const uniqueIds = [...new Set(cals.map((cal) => cal.id))];
    localStorage.setItem("loaded-calendars", JSON.stringify(uniqueIds));
    cals.forEach((cal) =>
      localStorage.setItem(`calendar-${cal.id}`, JSON.stringify(cal)),
    );
  }, [cals]);

  useEffect(() => {
    const eventCheckInt = setInterval(() => {
      const loadedCalendars = localStorage.getItem("loaded-calendars");
      if (!loadedCalendars) {
        localStorage.setItem("loaded-calendars", JSON.stringify([]));
        return [];
      }

      const events: Event[] = [];
      const calendarIds = JSON.parse(loadedCalendars);
      calendarIds.map((id: string) => {
        const calendarEvents = localStorage.getItem(`calendar-${id}`);
        if (!calendarEvents) return;

        const cEvents = JSON.parse(calendarEvents).events;
        const calObj = JSON.parse(calendarEvents);
        events.push(
          ...cEvents.map((e: Event) => ({
            ...e,
            visible: e.visible && (calObj.visible ?? true),
          })),
        );
      });
      return setEvents(
        events.filter((event) => calendarIds.includes(event.calendarId)),
      );
    }, 1000);

    return () => {
      clearInterval(eventCheckInt);
    };
  }, []);

  useEffect(() => {
    let m = true;

    const fetchAllCalendars = async () => {
      const icalEvents: Event[] = [];
      const importedCalendars: {
        events: Event[];
        importUrl: string;
        importLink: string;
        title: string;
        id: number;
        visible: boolean;
      }[] = [];
      const rawCurCals = localStorage.getItem("loaded-calendars");
      const cals = [];
      if (rawCurCals) {
        for (const calId of JSON.parse(rawCurCals)) {
          const rawCal = localStorage.getItem(`calendar-${calId}`);
          if (!rawCal) continue;
          const cal = JSON.parse(rawCal);
          if (cal.importUrl.trim() !== "") {
            cals.push(cal);
          }
        }
      }

      for (const url of icalUrls) {
        const response = await tFetch(url);
        if (!response.ok) {
          console.warn(
            `[iCal Loader]: Invalid network response (${response.status}) on ${url}.`,
          );
          continue;
        }

        const raw = await response.text();
        const jcal = ICAL.parse(raw);
        const comp = new ICAL.Component(jcal);
        const vevents = comp.getAllSubcomponents("vevent");

        const calName =
          comp.getFirstPropertyValue("x-wr-calname") || "Imported";
        const generatedId = Math.abs(
          url
            .split("")
            .reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0),
        );

        const now = new Date();
        const rangeStart = new Date(now);
        rangeStart.setDate(now.getDate() - 60);
        const rangeEnd = new Date(now);
        rangeEnd.setDate(now.getDate() + 60);

        const pEvents: Event[] = [];

        for (const vevent of vevents) {
          const event = new ICAL.Event(vevent);

          if (event.isRecurring()) {
            const iterator = event.iterator();
            let next;
            while ((next = iterator.next())) {
              const occurrence = next.toJSDate();
              if (occurrence > rangeEnd) break;
              if (occurrence < rangeStart) continue;

              const details = event.getOccurrenceDetails(next);
              pEvents.push({
                uid: `${event.uid}-${next.toString()}`,
                name: event.summary || "Untitled",
                description: event.description || "",
                date: details.startDate.toJSDate().getTime(),
                start:
                  details.startDate.toJSDate().getHours() * 60 +
                  details.startDate.toJSDate().getMinutes(),
                end:
                  details.endDate.toJSDate().getHours() * 60 +
                  details.endDate.toJSDate().getMinutes(),
                calendar: calName as string,
                calendarId: generatedId,
                visible: true,
              });
            }
          } else {
            pEvents.push({
              uid: event.uid,
              name: event.summary || "Untitled",
              description: event.description || "",
              date: event.startDate.toJSDate().getTime(),
              start:
                event.startDate.toJSDate().getHours() * 60 +
                event.startDate.toJSDate().getMinutes(),
              end:
                event.endDate.toJSDate().getHours() * 60 +
                event.endDate.toJSDate().getMinutes(),
              calendar: calName as string,
              calendarId: generatedId,
              visible: true,
            });
          }
        }

        icalEvents.push(...pEvents);

        const curCalInfo = cals.filter((cal) => cal.importUrl.trim() === url);
        const calendarObj = {
          id: generatedId,
          importLink: url,
          importUrl: url,
          events: pEvents,
          visible: curCalInfo[0]?.visible ?? true,
          title: calName as string,
        };
        localStorage.setItem(
          `calendar-${generatedId}`,
          JSON.stringify(calendarObj),
        );
        importedCalendars.push(calendarObj);
      }

      if (m) {
        setCals((prevCals) => {
          const map = new Map(prevCals.map((c) => [c.id, c]));
          importedCalendars.forEach((c) => map.set(c.id, c));
          return Array.from(map.values());
        });

        setEvents((prevEvents) => {
          const importedIds = new Set(importedCalendars.map((c) => c.id));
          const kept = prevEvents.filter((e) => !importedIds.has(e.calendarId));
          return [...kept, ...icalEvents];
        });
      }
    };

    fetchAllCalendars();
    const interval = setInterval(fetchAllCalendars, 5 * 60 * 1000);

    return () => {
      m = false;
      clearInterval(interval);
    };
  }, [icalUrls]);

  useEffect(() => {
    localStorage.setItem("ical-urls", JSON.stringify(icalUrls));
  }, [icalUrls]);

  const showEventCtxMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    return;
  };

  const day = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ][new Date().getDay()];

  return (
    <div className="flex flex-row mx-12 my-4 w-full">
      <div className="flex flex-col mx-12 my-4 min-w-96 w-full max-w-2xl">
        <p className="text-gray-600 text-2xl font-semibold mb-1">Overview</p>
        <p className="text-gray-400 text-xs mb-6">View all your due tasks.</p>

        {loading ? (
          <Loader />
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center mt-12">
            <BadgeAlert className="w-10 h-10 text-gray-500/60" />
            <p className="text-base font-semibold text-gray-500/60 mt-2">
              No tasks due.
            </p>
          </div>
        ) : (
          <>
            <Section label="Overdue" tasks={overdue} accent="text-red-500/70" />
            <Section label="Today" tasks={dueToday} accent="text-blue-500/70" />
            <Section label="Upcoming" tasks={upcoming} accent="text-gray-600" />
          </>
        )}
      </div>
      <div className="flex flex-row w-full">
        <Day
          type={day}
          events={events}
          setEvents={setEvents}
          showEventCtxMenu={showEventCtxMenu}
          offsetDate={monDate}
        />
      </div>
    </div>
  );
}
