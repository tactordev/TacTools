"use client";
import { useEffect, useState } from "react";
import Button from "../utils/button";
import { Tab } from "../../main";
import {
  Folder,
  Settings2,
  Ellipsis,
  FileText,
  FileXCorner,
  FileSpreadsheet,
  FileImage,
  FileTerminal,
  ChevronUp,
  BadgeAlert,
  Package,
  Rocket,
  Disc,
  FileInput,
  FileVideoCamera,
  FileMusic,
  FileArchive,
} from "lucide-react";
import { open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import { readDir } from "@tauri-apps/plugin-fs";
import { motion, AnimatePresence } from "motion/react";
import Loader from "../utils/loader";

function getFileIcon(ending: string): React.ReactElement {
  if (Object.keys(endToIcon).includes(ending)) {
    return endToIcon[ending];
  }

  if (Object.keys(endingAliases).includes(ending)) {
    return endToIcon[endingAliases[ending]];
  }

  return endToIcon["unknown"];
}
const endingAliases: Record<string, string> = {
  docx: "txt",
  gdoc: "txt",
  odt: "txt",
  rdp: "txt",
  cfg: "txt",
  ods: "txt",
  md: "txt",
  gsheet: "xlsx",
  gform: "xlsx",
  pptx: "xlsx",
  pdf: "txt",
  py: "code",
  js: "code",
  jsx: "code",
  tsx: "code",
  ts: "code",
  rs: "code",
  html: "code",
  css: "code",
  json: "code",
  csv: "code",
  sii: "code",
  log: "code",
  lnk: "shortcut",
  png: "img",
  jpg: "img",
  jpeg: "img",
  ytd: "img",
  yft: "img",
  dds: "img",
  psd: "img",
  svg: "img",
  mp4: "video",
  mp3: "audio",
  zip: "compressed",
  gltf: "obj",
};
// exe,  mp4, mp3

const iconClasses = "w-4 h-4 text-gray-600 shrink-0";
const endToIcon: Record<string, React.ReactElement> = {
  txt: <FileText className={iconClasses} />,
  xlsx: <FileSpreadsheet className={iconClasses} />,
  code: <FileTerminal className={iconClasses} />,
  img: <FileImage className={iconClasses} />,
  obj: <Package className={iconClasses} />,
  ork: <Rocket className={iconClasses} />,
  iso: <Disc className={iconClasses} />,
  shortcut: <FileInput className={iconClasses} />,
  compressed: <FileArchive className={iconClasses} />,
  video: <FileVideoCamera className={iconClasses} />,
  audio: <FileMusic className={iconClasses} />,
  unknown: <FileXCorner className={iconClasses} />,
};

export default function Notes({
  tabs,
  setTabs,
}: {
  tabs: Tab[];
  setTabs: (_: Tab[]) => void;
}) {
  const [path, setPath] = useState<string | null>(null);
  const [extraDropdown, setExtraDropdown] = useState<boolean>(false);
  const [contents, setContents] = useState<
    Record<"folders" | "files", string[]> | "loading" | null
  >(null);
  const [fetchErr, setFetchErr] = useState<string | null>(null);
  const normalisedPath = path?.replace(/^([A-Za-z]):$/, "$1:\\") ?? null;
  const pathParts = normalisedPath
    ? normalisedPath.split("\\").filter(Boolean)
    : [];
  const reversedPathParts = [...pathParts].reverse();
  const visiblePathParts = reversedPathParts.slice(
    0,
    pathParts.length > 3 ? 2 : pathParts.length,
  );
  const extraPathParts = pathParts.slice(0, Math.max(pathParts.length - 2, 0));
  const parentPath =
    normalisedPath && pathParts.length > 1
      ? `${pathParts.slice(0, -1).join("\\")}\\`
      : normalisedPath;

  useEffect(() => {
    const dropdownHandler = () => {
      setExtraDropdown(false);
    };
    window.addEventListener("mouseup", dropdownHandler);

    setPath(localStorage.getItem("path")!);

    return () => {
      window.removeEventListener("mouseup", dropdownHandler);
    };
  }, []);

  useEffect(() => {
    if (!path) {
      setContents(null);
      return;
    }
    setFetchErr(null);
    let isMounted = true;
    setContents("loading");

    readDir(path)
      .then((entries) => {
        if (!isMounted) return;

        const dirs: string[] = [];
        const files: string[] = [];

        for (const entry of entries) {
          if (entry.isDirectory) {
            if (
              entry.name.startsWith(".") ||
              entry.name.startsWith("$") ||
              entry.name.startsWith("~")
            )
              continue;
            dirs.push(entry.name);
          } else if (entry.isFile) {
            if (
              entry.name.endsWith(".ini") ||
              entry.name.startsWith(".") ||
              entry.name.startsWith("$") ||
              entry.name.startsWith("~")
            )
              continue;
            files.push(entry.name);
          }
        }

        setContents({ folders: dirs, files: files });
      })
      .catch((err) => {
        setContents(null);
        setFetchErr(err);
        return;
      });

    localStorage.setItem("path", path);
    return () => {
      isMounted = false;
    };
  }, [path]);

  const openFolderSelection = async () => {
    setContents("loading");

    const selectedPath = await open({
      directory: true,
      multiple: false,
      title: "Select a project folder",
      recursive: true,
    });

    if (selectedPath) {
      await invoke<string>("scope_drive", { path: selectedPath });
      setPath(selectedPath.replace(/^([A-Za-z]):$/, "$1:\\"));
      return true;
    }

    return false;
  };

  const togglExtraDropdown = () => {
    setExtraDropdown(!extraDropdown);
  };

  const moveBackFolder = async (e: React.MouseEvent) => {
    if (!path || !normalisedPath) return;
    const folderName = e.currentTarget.textContent?.replace(/^Folder:\s*/, "");

    if (!folderName) return;

    if (path.endsWith(folderName) || path.endsWith(`${folderName}\\`)) {
      return;
    }

    setContents("loading");
    const folderIndex = pathParts.lastIndexOf(folderName);

    if (folderIndex < 0) {
      setPath(normalisedPath);
      return;
    }

    setPath(`${pathParts.slice(0, folderIndex + 1).join("\\")}\\`);
    return;
  };

  const moveForwardFolder = async (dirName: string) => {
    if (!normalisedPath) return;
    setContents("loading");
    setPath(`${normalisedPath}\\${dirName}`);
    return;
  };

  return (
    <div className="flex flex-col w-full mt-4 px-2 items-center">
      {!path ? (
        <Button name="Select Folder" onClick={openFolderSelection}>
          <div className="flex flex-row gap-2 items-center justify-center">
            <Folder className="w-4 h-4 text-gray-600" />{" "}
            <p className="text-xs text-gray-600 select-none">Select Folder</p>
          </div>
        </Button>
      ) : (
        <div className="flex flex-row ml-2 w-full justify-between relative">
          <div className="flex flex-row-reverse overflow-x-hidden overflow-y-hidden justify-end items-end sticky top-12">
            {visiblePathParts.map((value, index) => (
              <motion.div
                initial={{ opacity: 0, translateY: 5 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{
                  type: "tween",
                  duration: 0.25,
                  delay: (visiblePathParts.length - index) * 0.125,
                }}
                key={index}
                className="flex flex-row gap-0.25"
              >
                <Button
                  name={`Folder: ${value}`}
                  onClick={moveBackFolder}
                  className="!shadow-none !px-1"
                >
                  <p className="text-xs text-gray-600 select-none max-w-10 overflow-hidden whitespace-nowrap text-ellipsis">
                    {value}
                  </p>
                </Button>
                <p className="text-gray-600 select-none">/</p>
              </motion.div>
            ))}
            {pathParts.length > 3 ? (
              <motion.div
                initial={{ opacity: 0, translateY: 5 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: "tween", duration: 0.25, delay: 0 }}
                className="flex flex-row gap-0.25 select-none"
              >
                <Button
                  className="!shadow-none !h-fit"
                  name="Show more"
                  onClick={togglExtraDropdown}
                >
                  <Ellipsis className="w-3.5 h-4 text-gray-600" />
                </Button>
                <p className="text-gray-600">/</p>
              </motion.div>
            ) : (
              <></>
            )}
            <Button
              name="Move Up"
              onClick={() => {
                if (!parentPath || pathParts.length <= 1) {
                  return;
                }
                setPath(parentPath);
              }}
              className={`transition-all duration-200 !px-1 !py-1 !shadow-none ${pathParts.length > 1 ? "" : "hover:!cursor-default hover:!bg-transparent"}`}
            >
              <ChevronUp
                className={`w-4 h-4 ${pathParts.length > 1 ? "text-gray-600" : "text-gray-400"}`}
              />
            </Button>
          </div>

          <AnimatePresence>
            {extraDropdown && (
              <motion.div
                key={"extras-dropdown"}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "tween", duration: 0.125 }}
                exit={{ opacity: 0, scale: 0 }}
                className="absolute flex flex-col gap-1 pl-2 pr-4 py-2 mt-0.5 min-w-8 min-h-4 top-full backdrop-blur-lg bg-[#EDEDF2]/20 z-50 rounded-md shadow-sm"
              >
                {extraPathParts.map((value, index) => (
                  <motion.div
                    initial={{ opacity: 0, translateX: -5 }}
                    animate={{ opacity: 1, translateX: 0 }}
                    transition={{
                      type: "tween",
                      delay: (index + 1) * 0.075,
                      duration: 0.25,
                    }}
                    key={index}
                  >
                    <Button
                      name={`Folder: ${value}`}
                      onClick={moveBackFolder}
                      className="!shadow-none select-none"
                    >
                      <p className="text-xs text-gray-600">{value}</p>
                    </Button>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
          <Button
            name="Switch Folder"
            onClick={openFolderSelection}
            className="transition-all duration-200 !shadow-none flex flex-row items-center h-full"
          >
            <Settings2 className="w-4 h-4 text-gray-600" />
          </Button>
        </div>
      )}
      <div className="flex flex-col w-full mt-4">
        <AnimatePresence mode="wait">
          {contents === "loading" && <Loader />}

          {contents && contents !== "loading" && (
            <div>
              {contents.folders.map((dirName, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, translateX: -5 }}
                  animate={{ opacity: 1, translateX: 0 }}
                  transition={{
                    type: "tween",
                    delay: Math.min((index + 1) * 0.015, 0.2),
                    duration: 0.15,
                  }}
                  className="select-none"
                >
                  <Button
                    name={`${dirName}`}
                    className="!shadow-none"
                    onClick={() => {
                      moveForwardFolder(dirName);
                    }}
                  >
                    <div className="flex flex-row items-center gap-2">
                      <Folder className="w-4 h-4 text-gray-600 shrink-0" />
                      <p className="text-gray-600 text-xs overflow-hidden whitespace-nowrap text-ellipsis">
                        {dirName}
                      </p>
                    </div>
                  </Button>
                </motion.div>
              ))}
              {contents.folders.length > 0 && <div className="py-2.5" />}
              {contents.files.map((fileName, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, translateX: -5 }}
                  animate={{ opacity: 1, translateX: 0 }}
                  transition={{
                    type: "tween",
                    delay: Math.min(
                      (contents.folders.length + index + 1) * 0.015,
                      0.35,
                    ),
                    duration: 0.15,
                  }}
                  className="select-none"
                >
                  <Button
                    onClick={() => {
                      const previous = tabs.map((tab) => ({
                        ...tab,
                        active: false,
                      }));
                      setTabs([
                        ...previous,
                        {
                          type: "file",
                          title: fileName,
                          active: true,
                          id:
                            tabs.reduce((max, tab) => {
                              return Math.max(max, tab.id);
                            }, 0) + 1,
                          value: {
                            fileExt: fileName.split(".").pop()!,
                            icon: getFileIcon(fileName.split(".").pop()!),
                            path: `${path}\\${fileName}`,
                          },
                        },
                      ]);
                    }}
                    name={`${fileName}`}
                    className="!shadow-none"
                  >
                    <div className="flex flex-row items-center gap-2">
                      {getFileIcon(fileName.split(".").pop()!)}
                      <p className="text-gray-600 text-xs overflow-hidden whitespace-nowrap text-ellipsis">
                        {fileName}
                      </p>
                    </div>
                  </Button>
                </motion.div>
              ))}
              {contents.files.length === 0 && contents.folders.length === 0 ? (
                <div className="flex flex-col mt-4 gap-1 items-center">
                  <BadgeAlert className="w-6 h-6 text-gray-500/60" />{" "}
                  <p className="text-base text-gray-500/60 font-semibold">
                    No files found.
                  </p>
                </div>
              ) : (
                <></>
              )}
            </div>
          )}
        </AnimatePresence>
        {fetchErr && (
          <div className="flex flex-col items-center mt-4">
            <BadgeAlert className="w-6 h-6 text-gray-500/60" />
            <p className="text-gray-500/60 text-base text-center mx-2 mt-1 font-semibold">
              {fetchErr.startsWith("forbidden path")
                ? "Insufficient permission."
                : fetchErr.startsWith("failed to read directory at path")
                  ? "Invalid path."
                  : fetchErr}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
