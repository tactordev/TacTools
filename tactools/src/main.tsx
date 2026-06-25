import ReactDOM from "react-dom/client";
import Sidebar from "./components/sidebar/sidebar";
import TitleBar from "./components/title-bar";
import "./globals.css";


ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <main className="flex flex-col w-full h-[100vh] z-0">
      <TitleBar />
      <Sidebar />
    </main>
);
