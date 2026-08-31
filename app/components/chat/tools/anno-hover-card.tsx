import { useTranslation } from "react-i18next";
import { StickyNote, X } from "lucide-react";
import {
  PromptInputButton,
  PromptInputHoverCard,
  PromptInputHoverCardContent,
  PromptInputHoverCardTrigger,
  PromptInputTab,
  PromptInputTabBody,
  PromptInputTabItem,
  PromptInputTabLabel,
} from "~/components/chat/prompt-input";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemMedia,
} from "~/components/ui/item";
import type { Annotation } from "~/store/chat-prompt-input-store";
import { Button } from "~/components/ui/button";
import { bus } from "~/event/events";

type AnnoHoverCardProps = {
  /** 按 toolId 隔离的标注 */
  annotationsByTool: Record<string, Annotation[]>;
  /** 工具实例 map：key 为 toolId，title 即工具展示名 */
  toolsMap?: Record<string, { title?: string }>;
  /** 删除某工具第 index 条标注 */
  onRemove: (toolId: string, index: number) => void;
};

const AnnoHoverCard = ({
  annotationsByTool,
  toolsMap,
  onRemove,
}: AnnoHoverCardProps) => {
  const { t } = useTranslation();
  const annotationCount = Object.values(annotationsByTool ?? {}).reduce(
    (n, list) => n + list.length,
    0,
  );

  return (
    <PromptInputHoverCard>
      <PromptInputHoverCardTrigger>
        <PromptInputButton>
          <StickyNote /> {t("common.annoCount", { count: annotationCount })}
        </PromptInputButton>
      </PromptInputHoverCardTrigger>
      <PromptInputHoverCardContent>
        {Object.entries(annotationsByTool ?? {}).map(([toolId, annos]) => {
          if (annos.length === 0) return null;
          return (
            <PromptInputTab key={toolId}>
              <PromptInputTabLabel>
                {toolsMap?.[toolId]?.title ?? toolId}
              </PromptInputTabLabel>
              <PromptInputTabBody>
                {annos.map((anno, i) => (
                  <PromptInputTabItem key={i}>
                    <Item
                      size="xs"
                      className="p-0"
                      onClick={() => {
                        bus.emit("open:tool:by-tool-id", { toolId });
                        bus.emit("focus-annotation", { toolId, annoIdx: i });
                      }}
                    >
                      <ItemMedia variant="image">
                        <img
                          src={
                            anno.type === "image"
                              ? anno.imageUrl
                              : `data:image/svg+xml;utf8,${encodeURIComponent(
                                  anno.svgXmlStr ?? "",
                                )}`
                          }
                          alt={anno.text}
                        />
                      </ItemMedia>
                      <ItemContent className="min-w-0">
                        <span className="whitespace-normal wrap-break-word leading-snug truncate line-clamp-1">
                          {anno.text || t("common.annoEmpty")}
                        </span>
                      </ItemContent>
                      <ItemActions>
                        <Button
                          size="icon"
                          variant={"ghost"}
                          onClick={() => onRemove(toolId, i)}
                        >
                          <X />
                        </Button>
                      </ItemActions>
                    </Item>
                  </PromptInputTabItem>
                ))}
              </PromptInputTabBody>
            </PromptInputTab>
          );
        })}
      </PromptInputHoverCardContent>
    </PromptInputHoverCard>
  );
};

export default AnnoHoverCard;
