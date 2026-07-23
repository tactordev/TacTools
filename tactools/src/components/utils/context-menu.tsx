"use client";
import { createPortal } from "react-dom";
import { useRef, useEffect } from "react";
import { motion } from "motion/react";

export default function ContextMenu({
  x,
  y,
  onBlur,
  children,
}: {
  x: number;
  y: number;
  onBlur: (e: React.FocusEvent) => void;
  children: React.ReactNode;
}) {
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    menuRef.current?.focus();
  }, []);

  const handleBlur = (e: React.FocusEvent) => {
    const nextFocused = e.relatedTarget as Node | null;

    if (nextFocused && menuRef.current?.contains(nextFocused)) {
      return;
    }

    onBlur(e);
  };

  const menu = (
    <motion.div
      ref={menuRef}
      tabIndex={0}
      onClick={(e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onBlur={handleBlur}
      onContextMenu={(e: React.MouseEvent) => {
        e.preventDefault();
        return;
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "tween", duration: 0.125 }}
      exit={{ opacity: 0, scale: 0 }}
      style={{ top: y, left: x }}
      className={`absolute flex flex-col gap-1 px-2 py-2 z-100 focus:outline-none hover:outline-none backdrop-blur-lg bg-[#EDEDF2]/20 z-50 rounded-md shadow-sm`}
    >
      {children}
    </motion.div>
  );

  return createPortal(menu, document.body);
}
