import { HashRouter, Routes, Route } from "react-router";
import { HomeView } from "./components/HomeView";
import { VisitorView } from "./components/VisitorView";

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomeView />} />
        <Route path="/visit" element={<VisitorView />} />
      </Routes>
    </HashRouter>
  );
}
