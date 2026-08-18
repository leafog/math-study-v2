import { normalizeMathDelimiters } from "~/lib/utils";
import { type MessageResponseProps } from "../ai-elements/message";
import MathRes from "./math-res";

const MathResInLine = ({ children }: MessageResponseProps) => {
  return (
    <MathRes className="min-w-0 flex-1 [*_p]:truncate line-clamp-1">
      {normalizeMathDelimiters(children)}
    </MathRes>
  );
};

export default MathResInLine;
