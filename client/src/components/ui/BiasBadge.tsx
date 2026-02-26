import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface BiasBadgeProps {
  bias: string;
  className?: string;
  showLabel?: boolean;
}

export function BiasBadge({ bias, className, showLabel = true }: BiasBadgeProps) {
  const normalizedBias = bias.toLowerCase().trim();
  
  let biasColorClass = "bg-slate-200 text-slate-700 border-slate-300";
  let label = "Unknown";

  switch (normalizedBias) {
    case "left":
      biasColorClass = "bg-blue-100 text-blue-800 border-blue-200";
      label = "Left";
      break;
    case "center-left":
    case "center left":
      biasColorClass = "bg-sky-100 text-sky-800 border-sky-200";
      label = "Center Left";
      break;
    case "center":
      biasColorClass = "bg-purple-100 text-purple-800 border-purple-200";
      label = "Center";
      break;
    case "center-right":
    case "center right":
      biasColorClass = "bg-rose-100 text-rose-800 border-rose-200";
      label = "Center Right";
      break;
    case "right":
      biasColorClass = "bg-red-100 text-red-800 border-red-200";
      label = "Right";
      break;
  }

  return (
    <div
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border",
        biasColorClass,
        className
      )}
      title={`Political Bias: ${label}`}
    >
      {showLabel ? label : <div className="w-2 h-2 rounded-full bg-current opacity-70" />}
    </div>
  );
}
