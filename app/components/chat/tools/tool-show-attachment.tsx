import {
  attachmentColl,
  attachmentMetaDataColl,
  attachmentTasksColl,
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
  CardTitle,
} from "~/components/ui/card";
import CopyButton from "~/components/common-ui/copy-button";

const ShowAttachmentPanel = ({ chatId, id, refId }: ToolPanelProps) => {
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
  const [imgScale, setImgScale] = useState<string>("auto");
  //const [attShowRef, { width, height }] = useMeasure();
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
          {task?.status === "pending" ? (
            <Empty>
              <EmptyHeader>
                <Spinner />
              </EmptyHeader>
            </Empty>
          ) : (
            <Card className="h-full rounded-none bg-muted border-none">
              <CardHeader>
                <CardTitle>Ocr Result</CardTitle>
                <CardAction>
                  <CopyButton text={task?.result} />
                </CardAction>
              </CardHeader>

              <CardContent className="-mb-(--card-spacing) overflow-y-scroll scrollbar-thin scrollbar-gutter-both">
                <MathResBlock className="-mx-(--card-spacing) ">
                  {task?.result}
                </MathResBlock>
              </CardContent>
            </Card>
          )}
        </ResizablePanel>
      </ResizablePanelGroup>
    </ToolContainer>
  );
};

export default ShowAttachmentPanel;
