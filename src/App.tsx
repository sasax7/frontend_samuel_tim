import { BrowserRouter, Routes, Route } from "react-router-dom";
import SEO from "./components/SEO";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ScrollManager from "./components/ScrollManager";
import HomePage from "./pages/HomePage";
import AnomalyPage from "./pages/AnomalyPage";
import ImpressumPage from "./pages/ImpressumPage";
import { Navigate } from "react-router-dom";
import FinanceLogPage from "./pages/FinanceLogPage";
import FinanceVizPage from "./pages/FinanceVizPage";
import AuthPage from "./pages/AuthPage";
import { getAccessToken } from "./features/auth/session";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = getAccessToken();
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

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
              <Route path="/impressum" element={<ImpressumPage />} />
              <Route path="/login" element={<AuthPage />} />
              <Route path="/finance" element={<Navigate to="/finance/viz" replace />} />
              <Route
                path="/finance/log"
                element={
                  <RequireAuth>
                    <FinanceLogPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/finance/viz"
                element={
                  <RequireAuth>
                    <FinanceVizPage />
                  </RequireAuth>
                }
              />
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
