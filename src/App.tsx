import { BrowserRouter, Routes, Route } from "react-router-dom";
import SEO from "./components/SEO";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ScrollManager from "./components/ScrollManager";
import HomePage from "./pages/HomePage";
import AnomalyPage from "./pages/AnomalyPage";

function App() {
  return (
    <>
      <SEO />
      <BrowserRouter>
        <ScrollManager />
        <div className="min-h-screen">
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/anomaly-detection" element={<AnomalyPage />} />
              <Route path="*" element={<HomePage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </>
  );
}

export default App;
