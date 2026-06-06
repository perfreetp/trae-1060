import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Overview from "@/pages/Overview";
import Rainfall from "@/pages/Rainfall";
import River from "@/pages/River";
import Reservoir from "@/pages/Reservoir";
import Scheme from "@/pages/Scheme";
import Command from "@/pages/Command";
import Review from "@/pages/Review";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Overview />} />
          <Route path="/rainfall" element={<Rainfall />} />
          <Route path="/river" element={<River />} />
          <Route path="/reservoir/:id" element={<Reservoir />} />
          <Route path="/scheme" element={<Scheme />} />
          <Route path="/command" element={<Command />} />
          <Route path="/review" element={<Review />} />
        </Route>
      </Routes>
    </Router>
  );
}
