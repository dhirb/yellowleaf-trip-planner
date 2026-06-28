import type { ReactNode } from "react";
import { CalendarCheck, LifeBuoy, Settings } from "lucide-react";
import { cn } from "../../lib/cn";
import { ui } from "../../lib/ui";

export type TravelerScreen = "day" | "help" | "settings";

const TodayIcon = () => <CalendarCheck size={24} strokeWidth={2} />;
const HelpIcon = () => <LifeBuoy size={24} strokeWidth={2} />;
const SettingsIcon = () => <Settings size={24} strokeWidth={2} />;

function Tab({
  on,
  onClick,
  icon,
  label,
}: {
  on: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-1 cursor-pointer flex-col items-center gap-1 bg-transparent px-0 py-[2px] text-[11.5px] font-bold tracking-[0.1px]",
        on ? "text-accent" : "text-faint",
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

export function TabBar({
  active,
  onChange,
}: {
  active: TravelerScreen;
  onChange: (s: TravelerScreen) => void;
}) {
  return (
    <div className={ui.tabbar}>
      <Tab
        on={active === "day"}
        onClick={() => onChange("day")}
        icon={<TodayIcon />}
        label="Today"
      />
      <Tab
        on={active === "help"}
        onClick={() => onChange("help")}
        icon={<HelpIcon />}
        label="Help"
      />
      <Tab
        on={active === "settings"}
        onClick={() => onChange("settings")}
        icon={<SettingsIcon />}
        label="Settings"
      />
    </div>
  );
}
