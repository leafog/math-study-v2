import { useTranslation } from "react-i18next";
import type { ToolRendererProps } from "./types";
import MathResBlock from "~/components/math/math-res-block";
import EpsilSourceBlock from "~/components/math/epsil-source-block";
import {
  Sandbox,
  SandboxContent,
  SandboxHeader,
  SandboxTabContent,
  SandboxTabs,
  SandboxTabsBar,
  SandboxTabsList,
  SandboxTabsTrigger,
} from "~/components/ai-elements/sandbox";
import { CodeBlock } from "~/components/ai-elements/code-block";
import { cn } from "~/lib/utils";
import {
  MathDivElement,
  MathSpanElement,
  convertLatexToMathMl,
  convertLatexToSpeakableText,
} from "mathlive";

export const InvokeCortex = ({
  part,
}: ToolRendererProps<"tool-invokeCortex">) => {
  const { t } = useTranslation();
  const { input, output } = part;

  const source =
    part.state === "input-streaming"
      ? t("toolCall.calculating")
      : (input?.source ?? "");

  const isError = output != null && "error" in output;

  return (
    <Sandbox>
      <SandboxHeader
        state={part.state}
        title={input?.title || t("toolCall.title.invokeCortex")}
      />

      <SandboxContent>
        <SandboxTabs defaultValue="output">
          <SandboxTabsBar>
            <SandboxTabsList>
              <SandboxTabsTrigger value="code">
                {t("toolCall.tab.code")}
              </SandboxTabsTrigger>
              <SandboxTabsTrigger value="output">
                {t("toolCall.tab.output")}
              </SandboxTabsTrigger>
            </SandboxTabsList>
          </SandboxTabsBar>

          <SandboxTabContent value="code">
            <EpsilSourceBlock className="border-0" maxHeight="100%">
              {source}
            </EpsilSourceBlock>
          </SandboxTabContent>

          <SandboxTabContent value="output">
            {!output ? (
              <div className="p-4 text-muted-foreground text-sm">
                {t("toolCall.creatingExplanation")}
              </div>
            ) : isError ? (
              <pre className="m-0 border-t px-4 py-3 font-mono text-sm text-red-500 whitespace-pre-wrap">
                {output.error}
              </pre>
            ) : (
              <div className="space-y-3 p-4">
                {output.description && (
                  <p className="text-muted-foreground text-sm">
                    {output.description}
                  </p>
                )}
                {output.latex && (
                  <math-field read-only={true}>{output.latex}</math-field>
                )}
              </div>
            )}
          </SandboxTabContent>
        </SandboxTabs>
      </SandboxContent>
    </Sandbox>
  );
};
