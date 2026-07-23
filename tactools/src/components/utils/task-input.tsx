"use client";
import { useMemo, useState } from "react";
import { nlu } from "./nlu";

export default function TaskInput({
  name,
  defaultValue,
  autoFocus,
  placeholder,
}: {
  name: string;
  defaultValue?: string;
  autoFocus?: boolean;
  placeholder?: string;
}) {
  const [value, setValue] = useState(defaultValue ?? "");

  const highlighted = useMemo(() => {
    const { indexes } = nlu(value);

    const tokens = value.split(/(\s+)/);
    let wordIdx = 0;

    return tokens.map((token, index) => {
      if (token === "" || /^\s+$/.test(token))
        return <span key={index}>{token}</span>;

      const isMatch = indexes.includes(wordIdx);
      wordIdx++;
      return (
        <span
          key={index}
          className={
            isMatch ? "bg-blue-200 px-0.5 text-blue-500 rounded-md" : ""
          }
        >
          {token}
        </span>
      );
    });
  }, [value]);

  return (
    <div className="relative w-full">
      <div
        aria-hidden
        className="absolute inset-0 whitespace-pre text-sm my-0.5 pointer-events-none overflow-hidden"
      >
        {value.length === 0 ? (
          <span className="text-gray-600/60">{placeholder}</span>
        ) : (
          highlighted
        )}
      </div>

      <input
        className="relative w-full bg-transparent focus:outline-none text-sm my-0.5"
        style={{ color: "transparent", caretColor: "#4b5563" }}
        name={name}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        spellCheck={false}
        autoComplete="off"
        autoFocus={autoFocus}
      />
    </div>
  );
}
