"use client";

import { Tab } from "../../main";
import { useEffect, useRef } from "react";
import Button from "../utils/button";
import {
    Folder,
    AppWindow
} from "lucide-react";
import { revealItemInDir, openPath } from "@tauri-apps/plugin-opener";
import { convertFileSrc } from "@tauri-apps/api/core";
import { useHotkey } from "@tanstack/react-hotkeys";

import { EditorState } from "@codemirror/state";
import { EditorView, ViewPlugin, Decoration, ViewUpdate } from "@codemirror/view";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { syntaxTree } from "@codemirror/language";
import { SyntaxNodeRef } from "@lezer/common";
import { readFile, writeFile } from "@tauri-apps/plugin-fs";


function MDEditor({ tab }: { tab: Tab }) {
    const h1 = Decoration.line({ attributes: { class: "text-xl font-extrabold block my-2" } });
    const h2 = Decoration.line({ attributes: { class: "text-lg font-bold block my-1.5" } });
    const h3 = Decoration.line({ attributes: { class: "text-base font-semibold block my-1" } });
    const h4 = Decoration.line({ attributes: { class: "text-sm font-bold block my-1 text-gray-800 dark:text-gray-200" } });
    const h5 = Decoration.line({ attributes: { class: "text-xs font-bold block my-1 text-gray-700 dark:text-gray-300" } });
    const h6 = Decoration.line({ attributes: { class: "text-xs font-semibold block my-1 text-gray-600 dark:text-gray-400 italic" } });
    
    const multilineCode = Decoration.line({ attributes: { class: "bg-gray-100 dark:bg-gray-800 font-mono text-sm block px-4 py-2 my-2 rounded-md" } });
    const bulletPoints = Decoration.line({ attributes: { class: "list-disc pl-5" } });
    const ol = Decoration.line({ attributes: { class: "list-decimal pl-5" } });
    const indentBlock = Decoration.line({ attributes: { class: "border-l-4 border-blue-300 dark:border-gray-600 pl-4 italic my-2" } });

    const italic = Decoration.mark({ attributes: { class: "italic" } });
    const bold = Decoration.mark({ attributes: { class: "font-bold" } }); 
    const strikethrough = Decoration.mark({ attributes: { class: "line-through text-gray-400 dark:text-gray-500" } });
    const inlineCode = Decoration.mark({ attributes: { class: "bg-gray-100 dark:bg-gray-800 text-red-500 dark:text-red-400 font-mono text-xs px-1 py-0.5 rounded" } });
    const link = Decoration.mark({ attributes: { class: "text-blue-500 underline cursor-pointer hover:text-blue-600" } });
    const image = Decoration.mark({ attributes: { class: "text-green-600 font-medium" } });

    const hr = Decoration.line({ attributes: { class: "border-t border-gray-300 dark:border-gray-700 my-4 h-0 block w-full" } });
    
    const mathBlockDeco = Decoration.line({ attributes: { class: "bg-blue-50/30 dark:bg-blue-950/20 font-mono text-center block py-2 my-2 rounded-md border-y border-blue-100/30 dark:border-blue-900/20" } });
    const mathTextDeco = Decoration.mark({ attributes: { class: "text-blue-600 dark:text-blue-400 font-mono italic" } });

    const hideSyntax = Decoration.mark({ attributes: { class: "cm-hidden-syntax" } });

    const headingDecos: Record<string, Decoration> = {
        "ATXHeading1": h1,
        "ATXHeading2": h2,
        "ATXHeading3": h3,
        "ATXHeading4": h4,
        "ATXHeading5": h5,
        "ATXHeading6": h6,
        "Emphasis": italic,
        "StrongEmphasis": bold,
        "Strikethrough": strikethrough, 
        "InlineCode": inlineCode,
        "FencedCode": multilineCode,
        "BulletList": bulletPoints,
        "OrderedList": ol,
        "Blockquote": indentBlock,
        "Link": link,
        "Image": image,
        "HorizontalRule": hr
    };

    const livePreview = ViewPlugin.fromClass(
        class { 
            decorations: any; 

            constructor(view: EditorView) {
                this.decorations = this.getDecorations(view);
            }

            update(update: ViewUpdate) {
                if (update.docChanged || update.selectionSet) {
                    this.decorations = this.getDecorations(update.view);
                }
            }

            getDecorations(view: EditorView) {
                const builder: any[] = [];
                const { state } = view;

                const cursorLine = state.doc.lineAt(state.selection.main.head).number;

                syntaxTree(state).iterate({
                    enter: (node: SyntaxNodeRef) => {
                        const deco = headingDecos[node.name];
                        if (deco) {
                            const line = state.doc.lineAt(node.from);

                            if (
                                node.name.includes("Heading") || 
                                node.name === "FencedCode" || 
                                node.name.includes("List") || 
                                node.name === "Blockquote" || 
                                node.name === "HorizontalRule"
                            ) {
                                builder.push(deco.range(line.from)); 
                            } 
                            else {
                                if (node.from !== node.to) {
                                    builder.push(deco.range(node.from, node.to));
                                }
                            }

                            if (line.number !== cursorLine) {
                                let child = node.node.firstChild;
                                while (child) {
                                    if (
                                        child.name === "HeaderMark" || 
                                        child.name === "EmphasisMark" || 
                                        child.name === "StrongMark" || 
                                        child.name === "StrikethroughMark" || 
                                        child.name === "CodeMark" ||
                                        child.name === "LinkMark" ||
                                        child.name === "URL" ||       
                                        child.name === "QuoteMark"     
                                    ) {
                                        if (child.from !== child.to) {
                                            builder.push(hideSyntax.range(child.from, child.to));
                                        }
                                    }
                                    child = child.nextSibling;
                                }
                            }
                        }
                    }
                });

                const docText = state.doc.toString();
                const blockMathRegex = /\$\$([\s\S]*?)\$\$/g;
                let match;

                while ((match = blockMathRegex.exec(docText)) !== null) {
                    const from = match.index;
                    const to = from + match[0].length;
                    
                    const startLine = state.doc.lineAt(from).number;
                    const endLine = state.doc.lineAt(to).number;

                    for (let l = startLine; l <= endLine; l++) {
                        builder.push(mathBlockDeco.range(state.doc.line(l).from));
                    }

                    if (cursorLine < startLine || cursorLine > endLine) {
                        builder.push(hideSyntax.range(from, from + 2)); 
                        builder.push(hideSyntax.range(to - 2, to));     
                        builder.push(mathTextDeco.range(from + 2, to - 2));
                    }
                }

                builder.sort((a, b) => a.from - b.from);

                return Decoration.set(builder, true);
            }
        },
        {
            decorations: (v) => v.decorations
        }
    );


    const theme = EditorView.theme({
        "&": { height: "100%", fontSize: "16px" },
        ".cm-content": { fontFamily: "sans-serif", padding: "20px" },
        "&.cm-focused": { outline: "none" },
        
        ".cm-hidden-syntax": { display: "none" }
    });

    const container = useRef<HTMLDivElement | null>(null);
    const viewRef = useRef<EditorView | null>(null);

    const save = async () => {
        
        if (!('path' in tab.value)) return;
        const path = tab.value.path;
        if (!path || !viewRef.current) return;

        const currentText = viewRef.current.state.doc.toString();

        const data = new TextEncoder().encode(currentText);
        await writeFile(path, data);
        
        return;
    }

    
    useHotkey("Mod+S", save);


    if (!('path' in tab.value)) return ( <p> unknown type </p>);

    useEffect(() => {
        if (!container.current) return;

        let isMounted = true;

        async function loadFileAndInitEditor() {
            try {
                if (!('path' in tab.value)) return;
                const data = await readFile(tab.value.path);
                const textContent = new TextDecoder().decode(data);

                if (!isMounted) return;

                const starter = EditorState.create({
                    doc: textContent,
                    extensions: [
                        markdown({ base: markdownLanguage }),
                        livePreview,
                        theme,
                        EditorView.lineWrapping
                    ]
                });

                const view = new EditorView({
                    state: starter,
                    parent: container.current!
                });

                viewRef.current = view;


            } catch (error) {
                console.error("Failed to read markdown file:", error);
            }
        }

        loadFileAndInitEditor();

        return () => {
            isMounted = false;
            if (viewRef.current) {
                viewRef.current.destroy();
                viewRef.current = null;
            }
        };
    }, [tab.value.path]);


    return (
        <div className="w-full h-full flex justify-center p-8">
            <div ref={container}  className="w-full rounded-lg minimal-scrollbar" />
        </div>
    )
}

function FileViewer({ tab }: { tab: Tab }) {
    if (!('path' in tab.value)) return;
    const path = tab.value.path;
    const handleFE = async () => {
        await revealItemInDir(path.replace("\\\\", "\\"));
    };

    const handleOpen = async () => {
        await openPath(path.replace("\\\\", "\\"));
    };


    switch (tab.value.fileExt) {
        case 'md':
            return (
                <MDEditor
                    tab={tab}
                />
            );

        case 'pdf':
            return (
                <div className="w-full h-full min-h-[600px] flex flex-col border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                    <iframe
                        src={convertFileSrc(tab.value.path)}
                        className="w-full h-full min-h-[600px]"
                        title="PDF Document Viewer"
                    />
                </div>
            );

        case 'png':
        case 'jpg':
        case 'jpeg':
        case 'webp':
        case 'gif':
            return (
                <div className="flex flex-row items-center justify-center w-full h-full">
                    <img src={convertFileSrc(tab.value.path.replace("\\\\", "\\"))} className="mx-4 my-2 w-204 h-auto" />
                </div>
            );
        
        default:
            return ( 
                <div className="flex flex-col items-center mt-4">
                    <p className="text-base text-gray-600 mb-1">Incompatible file type.</p>
                    <div className="flex flex-row gap-2">
                        <Button onClick={handleFE} className="flex flex-row items-center gap-1.5">
                            <Folder className="w-4 h-4 text-gray-600" />
                            <p className="text-sm text-gray-600">Reveal in Explorer</p>
                        </Button>
                        <Button onClick={handleOpen} className="flex flex-row items-center gap-1.5">
                            <AppWindow className="w-4 h-4 text-gray-600" />
                            <p className="text-sm text-gray-600">Open in App</p>
                        </Button>
                    </div>
                </div>
            );
    };
};

export default function File({ tab }: { tab: Tab }) {
    return (
        <div className="flex flex-col w-full h-full items-center">
            <FileViewer tab={tab} />
        </div>
    );
};