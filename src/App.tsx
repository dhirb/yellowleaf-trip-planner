import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { PhoneFrame } from "./components/PhoneFrame";

const AdminApp = lazy(() => import("./components/admin/AdminApp").then((m) => ({ default: m.AdminApp })));
const TravelerRoute = lazy(() => import("./components/traveler/TravelerRoute").then((m) => ({ default: m.TravelerRoute })));

const Loading = () => (
  <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#A89F92", fontWeight: 600, background: "#FBF8F3" }}>
    Loading…
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <PhoneFrame>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/admin" element={<AdminApp />} />
            <Route path="/t/:tripId" element={<TravelerRoute />} />
            <Route path="/" element={<Navigate to="/admin" replace />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </Suspense>
      </PhoneFrame>
    </BrowserRouter>
  );
}

export default App;
