"use client";
import { useRef } from "react";



export default function Button({ children, className, name, onClick, onBlur, disableMovement }: { children?: React.ReactNode; className?: string; name?: string; onClick?: (e: React.MouseEvent) => void; onBlur?: () => void; disableMovement?: boolean }) {
    const foo = () => { return true; }
    const button = useRef<HTMLDivElement | null>(null);

    const handleMouseDown = () => {
        if (!button || disableMovement) return false;

        if (!button.current?.classList.contains("scale-95")) {
            button.current?.classList.remove("hover:scale-105");
            button.current?.classList.remove("scale-100");
            button.current?.classList.add("scale-95");
        }

        return true;
    }


    const handleMouseLeave = () => {
        if (!button || disableMovement) return false;

        if (button.current?.classList.contains("scale-95")) {
            button.current?.classList.remove("scale-95");
            button.current?.classList.add("scale-100");
            button.current?.classList.add("hover:scale-105");
        }

        return true;
    }

    const handleMouseUp = () => {
        if (!button || disableMovement) return false;

        if (button.current?.classList.contains("scale-95")) {
            button.current?.classList.remove("scale-95");
            button.current?.classList.add("scale-100");
            button.current?.classList.add("hover:scale-105");
        }

        return true;
    }


    return (
        <div ref={button} className={`group hover:cursor-pointer hover:bg-blue-200/30 scale-100 hover:scale-105 px-2 py-1 rounded-md shadow-sm transition-all duration-200 select-none ${className}`}  onClick={onClick ?? foo } onBlur={onBlur ?? foo} title={name ?? "Button"} onMouseDown={ handleMouseDown } onMouseUp={ handleMouseUp } onMouseLeave={handleMouseLeave}>
            { children }
        </div>
    )
}