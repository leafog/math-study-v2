import { useTranslation } from "react-i18next";
import type { ToolRendererProps } from "./types";
import { ToolBlock } from "./_tool-common";
import MathResBlock from "~/components/math/math-res-block";

export const InvokeCortex = ({
  part,
}: ToolRendererProps<"tool-invokeCortex">) => {
  const { t } = useTranslation();

  return (
    <ToolBlock title={t("toolCall.title.invokeCortex")} part={part}>
      {part.state === "output-available" &&
        ("error" in part.output ? (
          <code className="text-xs font-mono text-destructive">
            {part.output.error}
          </code>
        ) : (
          <div className="flex flex-col gap-2">
            {part.output.description && (
              <p className="text-sm text-muted-foreground">
                {part.output.description}
              </p>
            )}
            <MathResBlock>
              {`$$${part.output.latex}$$`}
            </MathResBlock>
          </div>
        ))}
    </ToolBlock>
  );
};
