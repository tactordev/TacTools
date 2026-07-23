import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Clock, Inbox, Pause, Play, Plus, Square } from "lucide-react";
import Button from "../utils/button";
import { useTimer } from "./timer-context";

function getDates() {
  const today = new Date();
  const yr = today.getFullYear();
  const mo = today.getMonth();

  const dayNum = new Date(yr, mo + 1, 0).getDate();

  return Array.from({ length: dayNum }, (_, index) => {
    const date = new Date(yr, mo, index + 1);
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  });
}

function curDate() {
  const today = new Date();
  return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
}

export default function StudyTracker() {
  const {
    sessionRunning,
    sessionTime,
    curSessionType,
    setCurSessionType,
    toggleSession,
    stopAndSaveSession,
  } = useTimer();

  const [page, setPage] = useState<"overview" | "session">(
    sessionRunning ? "session" : "overview"
  );
  const [sessions, setSessions] = useState(() => {
    const sess = localStorage.getItem("prev-sessions");
    if (!sess) {
      localStorage.setItem("prev-sessions", JSON.stringify([]));
      return {};
    }
    return JSON.parse(sess);
  });

  const [sessionTypes, setSessionTypes] = useState(() => {
    const sessTypes = localStorage.getItem("session-types");
    if (!sessTypes) {
      localStorage.setItem("session-types", JSON.stringify([]));
      return [];
    }
    const parsed = JSON.parse(sessTypes);
    if (parsed.length > 0 && !curSessionType) {
      setCurSessionType(parsed[0]);
    }
    return parsed;
  });

  const [editing, setEditing] = useState<{ type: string; id: number } | false>(false);
  const [time, setTime] = useState(`${new Date().getHours()}`.padStart(2, "0") + `:${new Date().getMinutes()}`.padStart(2, "0") + `.${new Date().getSeconds()}`.padStart(2, "0"));
  const [sessionTypeDropdown, setSessionTypeDropdown] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem("session-types", JSON.stringify(sessionTypes));
  }, [sessionTypes]);

  useEffect(() => {
    const timeInt = setInterval(() => {
      const now = new Date();
      setTime(
        `${now.getHours() < 10 ? `0${now.getHours()}` : now.getHours()}:${
          now.getMinutes() < 10 ? `0${now.getMinutes()}` : now.getMinutes()
        }.${now.getSeconds() < 10 ? `0${now.getSeconds()}` : now.getSeconds()}`
      );
    }, 1000);

    return () => clearInterval(timeInt);
  }, []);

  useEffect(() => {
    if (!sessionTypeDropdown) return;

    const handleClick = () => {
      setSessionTypeDropdown(false);
    };

    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [sessionTypeDropdown]);

  useEffect(() => {
    const sess = localStorage.getItem("prev-sessions");
    if (sess) setSessions(JSON.parse(sess));
  }, [sessionRunning]);

  function changeName(e: React.SubmitEvent<HTMLFormElement> | React.FocusEvent<HTMLFormElement>) {
    const id = e.currentTarget.id.split("-")[2];
    const formData = new FormData(e.currentTarget);
    const newName = formData.get("newName");
    if (!newName) return;
    const name = newName.toString();
    setSessionTypes([
      ...sessionTypes.filter((type: { name: string; id: number }) => type.id !== Number(id)),
      { name: name, id: Number(id) },
    ]);
    return setEditing(false);
  }

  return (
    <div className="flex relative w-full h-full">
      <div className="flex flex-row absolute top-0 left-2 h-fit gap-1 justify-around mx-1 px-1 py-1 mt-1 bg-gray-100 rounded-md backdrop-blur-md">
        <div
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setPage("overview");
          }}
          className={`px-8 py-0.5 rounded-md ${
            page === "overview"
              ? "bg-white/60"
              : "opacity-20 hover:cursor-pointer hover:bg-white hover:opacity-40 transition-all duration-200"
          }`}
        >
          <Inbox className="text-gray-500 w-4 h-4" />
        </div>
        <div
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setPage("session");
          }}
          className={`px-8 py-0.5 rounded-md ${
            page === "session"
              ? "bg-white/60"
              : "opacity-20 hover:cursor-pointer hover:bg-white hover:opacity-40 transition-all duration-200"
          }`}
        >
          <Clock className="text-gray-500 w-4 h-4" />
        </div>
      </div>

      {page === "overview" ? (
        <div className="flex flex-col w-full h-full mx-4 my-10 gap-0.5">
          <p className="text-lg font-semibold text-gray-600">Overview</p>
          <div className="flex flex-row flex-wrap gap-0.5 max-w-64">
            {getDates().map((date) => {
              const len = Object.keys(sessions).filter((value) => value.split("//--//")[0] === date).length;
              return (
                <div
                  key={date}
                  className={`p-3 w-4 h-4 rounded-md ${
                    len === 0 ? `bg-blue-100/40` : len < 3 ? `bg-blue-100` : `bg-blue-200`
                  } ${date === curDate() ? "!bg-orange-100" : ""}`}
                  title={`${date}: ${len} session(s).`}
                />
              );
            })}
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex flex-row gap-2 h-fit w-fit items-end">
              <p className="mt-4 text-base font-semibold text-gray-600">Session Types</p>
              <Button
                onClick={() => {
                  const max =
                    sessionTypes.reduce(
                      (m: number, type: { name: string; id: number }) => Math.max(m, type.id),
                      0
                    ) + 1;
                  setSessionTypes([...sessionTypes, { name: "Untitled", id: max }]);
                  setEditing({ id: max, type: "session-type" });
                  setTimeout(() => {
                    const form = document.getElementById(`form-sessiontype-${max}`);
                    if (!form) return;
                    const inp = form.children[0] as HTMLInputElement;
                    inp.focus();
                    inp.select();
                  }, 100);
                }}
                className="flex flex-row items-center justify-center w-fit h-fit mb-0.5"
              >
                <Plus className="w-3 h-3 text-gray-600" />
              </Button>
            </div>
            {sessionTypes.length > 0 ? (
              sessionTypes.map((sessionType: { name: string; id: number }) => (
                <Button key={`session-type-list-${sessionType.id}`} className="w-64">
                  {!editing ? (
                    <p className="text-xs text-gray-600">{sessionType.name}</p>
                  ) : (
                    <form
                      className="flex flex-row items-center"
                      id={`form-sessiontype-${sessionType.id}`}
                      onSubmit={changeName}
                      onBlur={changeName}
                    >
                      <input
                        className="focus:outline-none text-xs text-gray-600 placeholder-text-gray-500/60 my-0.5"
                        spellCheck={false}
                        defaultValue={sessionType.name}
                        name="newName"
                        type="text"
                        autoComplete="off"
                      />
                    </form>
                  )}
                </Button>
              ))
            ) : (
              <p className="text-sm text-gray-600">No session types found.</p>
            )}
          </div>
          <Button
            onClick={() => setPage("session")}
            name="Begin Session"
            className="flex flex-row gap-1 items-center w-64 mt-8 text-sm text-gray-600 font-semibold"
          >
            <Play className="w-4 h-4 text-gray-600" />
            <p>Begin Session</p>
          </Button>
        </div>
      ) : (
        <div className="flex flex-col w-full h-full p-6 gap-6">
          <div className="flex flex-row relative w-full justify-center -mb-8 mt-8">
            <Button
              className="w-fit !bg-orange-100/40"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setSessionTypeDropdown(!sessionTypeDropdown);
              }}
            >
              {sessionTypes.length > 0 ? (
                <p className="text-sm text-gray-600 font-semibold">
                  {curSessionType?.name ?? sessionTypes[0].name}
                </p>
              ) : (
                <p className="text-sm text-gray-600 font-semibold">No sessions created.</p>
              )}
            </Button>
            <AnimatePresence>
              {sessionTypeDropdown && (
                <motion.div
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  initial={{ opacity: 0, translateY: -5 }}
                  exit={{ opacity: 0, translateY: -5 }}
                  transition={{ duration: 0.2 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  className="absolute top-full mt-1 bg-gray-100/40 backdrop-blur-md shadow-sm rounded-md py-2 gap-1"
                >
                  {sessionTypes.map((sessionType: { name: string; id: number }) => (
                    <Button
                      key={`session-selection-${sessionType.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setCurSessionType(sessionType);
                        setSessionTypeDropdown(false);
                      }}
                      className="px-4 mx-2 !shadow-none"
                    >
                      <p className="text-xs">{sessionType.name}</p>
                    </Button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="flex flex-col items-center justify-center gap-1">
            <div className="flex flex-row items-center justify-center h-24">
              {Array.from(time).map((char, index) => (
                <AnimatePresence key={index} mode="wait">
                  <motion.p
                    key={`${char}-${index}`}
                    initial={{ opacity: 0, translateY: -10 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    exit={{ opacity: 0, translateY: 10 }}
                    transition={{ duration: 0.15 }}
                    className="font-mono text-7xl font-bold text-gray-800 tracking-tight"
                  >
                    {char === " " ? "\u00A0" : char}
                  </motion.p>
                </AnimatePresence>
              ))}
            </div>

            <div className="flex flex-row items-center justify-center h-10 -mt-6">
              {Array.from(sessionTime).map((char, index) => (
                <AnimatePresence key={index} mode="wait">
                  <motion.p
                    key={`${char}-${index}`}
                    initial={{ opacity: 0, translateY: -10 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    exit={{ opacity: 0, translateY: 10 }}
                    transition={{ duration: 0.15 }}
                    className={`font-mono text-2xl font-semibold transition-colors ${
                      !sessionRunning ? "text-blue-300" : "text-blue-400"
                    }`}
                  >
                    {char === " " ? "\u00A0" : char}
                  </motion.p>
                </AnimatePresence>
              ))}
            </div>
          </div>

          <div className="flex flex-row justify-center gap-3 -mt-4">
            <Button
              onClick={toggleSession}
              name={sessionRunning ? "Pause" : "Play"}
              className="flex flex-row items-center justify-center p-3 bg-blue-100/40 hover:bg-blue-200/40 text-white rounded-full shadow-md"
            >
              {sessionRunning ? (
                <Pause className="w-5 h-5 text-gray-600/60" />
              ) : (
                <Play className="w-5 h-5 text-gray-600/60" />
              )}
            </Button>
            <Button
              onClick={stopAndSaveSession}
              name={"End"}
              className={`flex flex-row items-center justify-center p-3 bg-blue-100/40 hover:bg-blue-200/40 text-white rounded-full shadow-md ${
                !sessionRunning ? "hover:!cursor-not-allowed opacity-40" : ""
              }`}
            >
              <Square className="w-5 h-5 text-gray-600/60" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}