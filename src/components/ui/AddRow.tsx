import { Plus } from "lucide-react";

interface AddRowProps {
  label: string;
  color: string;
  onClick: () => void;
}

export function AddRow({ label, color, onClick }: AddRowProps) {
  return (
    <button
      onClick={onClick}
      className="flex h-[46px] w-full cursor-pointer items-center justify-center gap-[7px] rounded-md bg-transparent text-[14.5px] font-bold"
      style={{ border: `1.5px dashed ${color}55`, color }}
    >
      <Plus size={18} color={color} strokeWidth={2.4} />
      {label}
    </button>
  );
}
