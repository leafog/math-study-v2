import {
  attachmentColl,
  attachmentMetaDataColl,
  attachmentTasksColl,
  problemColl,
} from "~/db/tdb-collections";
import type { ToolPanelProps } from "./types";
import { ToolContainer } from "./tool-container";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";
import { useLiveQuery, eq, and } from "@tanstack/react-db";
import { IndexedUrlImage } from "~/components/common-ui/indexed-url-preview";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "~/components/ui/resizable";
import MathResBlock from "~/components/math/math-res-block";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useMeasure } from "@uidotdev/usehooks";
import { useResizeObserver } from "usehooks-ts";
import { useEdges } from "@xyflow/react";
import { Empty, EmptyHeader } from "~/components/ui/empty";
import { Spinner } from "~/components/ui/spinner";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
} from "~/components/ui/card";
import CopyButton from "~/components/common-ui/copy-button";
import { useTranslation } from "react-i18next";
import { ProblemsAttachmentList } from "~/components/math/problems-attachment-list";
import { Button } from "~/components/ui/button";

const ShowAttachmentPanel = ({ chatId, id, refId }: ToolPanelProps) => {
  const { t } = useTranslation();
  const { data: att } = useLiveQuery(
    (q) =>
      q
        .from({ att: attachmentColl })
        .join({ attmeta: attachmentMetaDataColl }, ({ att, attmeta }) =>
          eq(att.id, attmeta.id),
        )
        .where(({ att }) => eq(att.id, refId))
        .select(({ att, attmeta }) => ({
          ...att,
          meta_data: attmeta,
        }))
        .findOne(),
    [refId],
  );

  const { data: task } = useLiveQuery(
    (q) => {
      if (!att) return undefined;
      return q
        .from({ attTasks: attachmentTasksColl })
        .where(({ attTasks }) =>
          and(
            eq(attTasks.attachment_id, att.id),
            eq(attTasks.task_type, "extract_text"),
          ),
        )
        .orderBy(({ attTasks }) => attTasks.updated_at, "desc")
        .limit(1)
        .findOne();
    },
    [att],
  );

  // 与该附件关联的题目（tab 2：相关联的题目）
  const { data: relatedProblems = [] } = useLiveQuery(
    (q) => {
      if (!att) return undefined;
      return q
        .from({ problem: problemColl })
        .where(({ problem }) => eq(problem.source_attachment_id, att.id));
    },
    [att],
  );

  const [imgScale, setImgScale] = useState<string>("auto");
  const [panel, setPanel] = useState<"recognition" | "problems">("recognition");
  const attShowRef = useRef<HTMLDivElement>(null);

  const { width = 0, height = 0 } = useResizeObserver({
    ref: attShowRef as RefObject<HTMLDivElement>,
    box: "content-box",
  });

  const [natural, setNatural] = useState<{ w: number; h: number }>({
    w: 0,
    h: 0,
  });

  const [scale, setScale] = useState<number>(1);
  useEffect(() => {
    if (imgScale === "auto") {
      if (natural.w !== 0 && natural.h !== 0) {
        const scale = Math.min(width / natural.w, height / natural.h);
        setScale(scale);
      }
    } else {
      setScale(Number.parseInt(imgScale) / 100);
    }
  }, [natural, imgScale, natural, width, height]);

  return (
    <ToolContainer className="bg-accent grid grid-rows-[auto_1fr]">
      <div className="h-12 flex items-center justify-end-safe px-2">
        <Select value={imgScale} onValueChange={setImgScale}>
          <SelectTrigger className="w-40">
            <span>{(scale * 100).toFixed(0)}%</span>
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectGroup>
              <SelectItem value="25">25%</SelectItem>
              <SelectItem value="50">50%</SelectItem>
              <SelectItem value="100">100%</SelectItem>
              <SelectItem value="150">150%</SelectItem>
              <SelectItem value="200">200%</SelectItem>
            </SelectGroup>
            <SelectSeparator />
            <SelectGroup>
              <SelectItem value="auto">自动适应</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <ResizablePanelGroup orientation="vertical">
        <ResizablePanel defaultSize={"70%"} minSize={"30%"}>
          {att?.local_uri && (
            <div
              ref={attShowRef}
              className="size-full  scrollbar-gutter-both overflow-scroll scrollbar-thin"
            >
              <div className="flex  size-fit min-h-full w-fit min-w-full items-center justify-center">
                <IndexedUrlImage
                  className=" max-h-none max-w-none"
                  src={att.local_uri}
                  onNatureChange={setNatural}
                  width={natural.w * scale}
                  height={natural.h * scale}
                  style={{
                    width: natural.w * scale,
                    height: natural.h * scale,
                    maxWidth: "none",
                    maxHeight: "none",
                  }}
                  alt={att?.meta_data?.origin_filename ?? ""}
                />
              </div>
            </div>
          )}
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={"30%"} minSize={"30%"}>
          <Card className="h-full rounded-none border-none ">
            <CardHeader className="flex-row flex-wrap items-center gap-1">
              <div className="flex">
                <Button
                  size="lg"
                  variant={panel === "recognition" ? "secondary" : "ghost"}
                  onClick={() => setPanel("recognition")}
                >
                  {t("toolCall.attachmentResult")}
                </Button>
                {relatedProblems.length > 0 && (
                  <Button
                    size="lg"
                    variant={panel === "problems" ? "secondary" : "ghost"}
                    onClick={() => setPanel("problems")}
                  >
                    {t("toolCall.relatedProblems")}
                  </Button>
                )}
              </div>

              {panel === "recognition" && (
                <CardAction>
                  <CopyButton text={task?.result} />
                </CardAction>
              )}
            </CardHeader>

            <CardContent className="-mb-(--card-spacing) overflow-y-scroll scrollbar-thin scrollbar-gutter-both">
              {panel === "recognition" || relatedProblems.length === 0 ? (
                task?.status === "pending" ? (
                  <Empty>
                    <EmptyHeader>
                      <Spinner />
                    </EmptyHeader>
                  </Empty>
                ) : (
                  <MathResBlock className="-mx-(--card-spacing) ">
                    {task?.result}
                  </MathResBlock>
                )
              ) : (
                <ProblemsAttachmentList problems={relatedProblems} />
              )}
            </CardContent>
          </Card>
        </ResizablePanel>
      </ResizablePanelGroup>
    </ToolContainer>
  );
};

export default ShowAttachmentPanel;
