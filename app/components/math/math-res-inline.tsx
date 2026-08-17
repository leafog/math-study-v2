import { normalizeMathDelimiters } from "~/lib/utils";
import MathRes, { type MathResProps } from "./math-res";

const MathResInLine = ({ children }: MathResProps) => {
  return (
    <MathRes className="min-w-0 flex-1 [*_p]:truncate line-clamp-1">
      {normalizeMathDelimiters(children)}
    </MathRes>
  );
};

export default MathResInLine;
