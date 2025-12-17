import "./App.css";
import { MapView } from "./map/MapView";
import { ControlPanel } from "./ui/ControlPanel";
import { StatusCard } from "./ui/StatusCard";
import { RouteFoundModal } from "./ui/RouteFoundModal";
import { NavigationOverlay } from "./ui/NavigationOverlay";
import { useAppStore } from "./state/useAppStore";
import { Legend } from "./ui/Legend";

function App() {
  const navigationMode = useAppStore((s) => s.navigationMode);
  return (
    <div className="app">
      <main className="app__layout">
        <aside className={`app__controls ${navigationMode ? "app__controls--collapsed" : ""}`}>
          {navigationMode ? (
            <div className="card now-routing">
              <div className="section__title">Now routing</div>
              <StatusCard />
            </div>
          ) : (
            <>
              <ControlPanel />
              <StatusCard />
            </>
          )}
        </aside>
        <section className="app__map">
          <MapView />
          <Legend />
          <NavigationOverlay />
        </section>
      </main>
      <RouteFoundModal />
    </div>
  );
}

export default App;
