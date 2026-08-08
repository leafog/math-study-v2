import { MathfieldElement } from "mathlive";
import { useRef } from "react";
import { useBoolean } from "usehooks-ts";
export const MathInputReadOnly = ({
  latex,
  className,
}: {
  latex: string;
  className?: string;
}) => {
  return (
    <math-field read-only={true} className={className}>
      {latex}
    </math-field>
  );
};

const MathInput = ({ latex }: { latex: string }) => {
  const { value, setTrue, setFalse } = useBoolean(true);
  const mfRef = useRef<MathfieldElement>(null);

  return (
    <div
      className="w-full max-w-full"
      onBlurCapture={(e) => {
        setTrue();
      }}
      onFocusCapture={() => {
        setFalse();
      }}
    >
      <math-field ref={mfRef} read-only={value} className="w-full">
        {latex}
      </math-field>
    </div>
  );
};

export default MathInput;
