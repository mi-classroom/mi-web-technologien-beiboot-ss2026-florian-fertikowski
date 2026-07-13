import pointIcon from "../assets/icons/point-gesture.svg";
import pinchIcon from "../assets/icons/pinch-gesture.svg";
import palmIcon from "../assets/icons/palm-gesture.svg";
import swipeIcon from "../assets/icons/swipe-gesture.svg";
import type { Hint } from "../utils/types.ts";

interface GestureHintBarProps {
  hints: Hint[];
}

export function GestureHintBar({ hints }: GestureHintBarProps) {
  if (hints.length === 0) return null;

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "point":
        return pointIcon;
      case "pinch":
        return pinchIcon;
      case "palm":
        return palmIcon;
      case "swipe":
        return swipeIcon;
      default:
        return undefined;
    }
  };

  return (
    <div className="flex flex-col fixed left-4 bottom-2 z-30 bg-white border border-gray-200 shadow-md pr-10 pl-4 pt-4">
      {hints.map((hint, i) => (
        <div key={i} className={"flex gap-4"}>
          <img
            src={getIcon(hint.iconName)}
            height={10}
            width={50}
            alt="pointIcon"
          />
          <div className={"my-auto pb-2 uppercase font-sans font-medium"}>
            {hint.text}
          </div>
        </div>
      ))}
    </div>
  );
}
