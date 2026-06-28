import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { ThemeProvider } from "./components/ThemeProvider";

const AdminApp = lazy(() =>
  import("./components/admin/AdminApp").then((m) => ({ default: m.AdminApp })),
);
const TravelerRoute = lazy(() =>
  import("./components/traveler/TravelerRoute").then((m) => ({
    default: m.TravelerRoute,
  })),
);

const Loading = () => (
  <div className="flex h-full items-center justify-center bg-app-bg font-semibold text-faint">
    Loading…
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AppShell>
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route path="/admin" element={<AdminApp />} />
              <Route path="/t/:tripId" element={<TravelerRoute />} />
              <Route path="/" element={<Navigate to="/admin" replace />} />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Routes>
          </Suspense>
        </AppShell>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
