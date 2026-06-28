"use client";
import { useRef } from "react";



export default function Button({ children, className, name, onClick }: { children?: React.ReactNode; className?: string; name?: string; onClick?: () => void; }) {
    const foo = () => { return true; }
    const button = useRef<HTMLDivElement | null>(null);

    const handleMouseDown = () => {
        console.log("mouse down");

        if (!button) return false;

        console.log(button.current);

        if (!button.current?.classList.contains("scale-95")) {
            button.current?.classList.remove("hover:scale-110");
            button.current?.classList.remove("scale-100");
            button.current?.classList.add("scale-95");
        }

        return true;
    }


    const handleMouseLeave = () => {
        console.log("mouse leave");
        
        if (!button) return false;

        if (button.current?.classList.contains("scale-95")) {
            button.current?.classList.remove("scale-95");
            button.current?.classList.add("scale-100");
            button.current?.classList.add("hover:scale-110");
        }

        return true;
    }

    const handleMouseUp = () => {
        console.log("mouse up");

        if (!button) return false;

        if (button.current?.classList.contains("scale-95")) {
            button.current?.classList.remove("scale-95");
            button.current?.classList.add("scale-100");
            button.current?.classList.add("hover:scale-110");
        }

        return true;
    }


    return (
        <div ref={button} className={`group hover:cursor-pointer hover:bg-blue-200/30 scale-100 hover:scale-110 px-2 py-1 rounded-md shadow-sm transition-all duration-200 ${className}`}  onClick={onClick ?? foo } title={name ?? "Button"} onMouseDown={ handleMouseDown } onMouseUp={ handleMouseUp } onMouseLeave={handleMouseLeave}>
            { children }
        </div>
    )
}