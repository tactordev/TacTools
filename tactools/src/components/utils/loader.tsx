
import { LoaderCircle } from "lucide-react";


export default function Loader() {
    return (
        <div className="flex flex-col mt-4 items-center">
            <LoaderCircle className="w-6 h-6 text-gray-500/60 animate-spin" />
            <p className="text-gray-500/60 text-xs">Stuck? Try doing another action.</p>
        </div>
    )
}