import type { PanelImperativeHandle } from "react-resizable-panels";
import { ResizablePanel } from "../ui/resizable";
import { useChatToolsPanelStore } from "~/store/chat-tools-panel-store";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "../ui/message-scroller";
import { Message, MessageContent } from "../ui/message";
import { Bubble, BubbleContent } from "../ui/bubble";
import { useBoolean } from "usehooks-ts";

import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputProvider,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "../../../components/ai-elements/prompt-input";
import ChatHeaderContainer from "./chat-header-container";
import ToolsTrigger from "./tools-trigger";
import { Menu } from "lucide-react";
import { Button } from "../ui/button";

interface ChatPanelProps {
  panelRef: React.RefObject<PanelImperativeHandle | null>;
  onToolsTrigger: VoidFunction;
  chatId?: string;
}

const MenuButton = ({
  show,
  open,
  toggle,
}: {
  show: boolean;
  open: boolean;
  toggle: VoidFunction;
}) => {
  return (
    <Button size="icon" variant={open ? "outline" : "ghost"} onClick={toggle}>
      <Menu />
    </Button>
  );
};
const ChatPanel = ({ panelRef, onToolsTrigger, chatId }: ChatPanelProps) => {
  const onChatResize = useChatToolsPanelStore.use.onChatResize();
  const toolsClosed = useChatToolsPanelStore.use.toolsClosed();
  const { value, setValue, setTrue, setFalse, toggle } = useBoolean(false);

  return (
    <ResizablePanel
      panelRef={panelRef}
      defaultSize={"100%"}
      minSize={"30%"}
      collapsible
      onResize={(size) => onChatResize(size)}
      className="flex flex-col"
    >
      <ChatHeaderContainer>
        <span className="h-14"></span>
        <div className="gap-2 flex">
          <MenuButton show open={value} toggle={toggle} />
          {toolsClosed && <ToolsTrigger onTrigger={onToolsTrigger} />}
        </div>
      </ChatHeaderContainer>

      <MessageScrollerProvider>
        <div className="relative w-full flex-1 overflow-hidden">
          <div className="mx-auto size-full overflow-hidden flex flex-col">
            <div className="flex-1 h-full overflow-hidden p-0">
              <MessageScroller>
                <MessageScrollerViewport>
                  <div className="flex flex-row">
                    <MessageScrollerContent className="m-4 w-full mx-auto max-w-3xl">
                      {new Array(40).fill(null).map((_, i) => (
                        <Message align="end" key={i}>
                          <MessageContent>
                            <Bubble>
                              <BubbleContent>
                                Deploying to prod real quick. {chatId}
                              </BubbleContent>
                            </Bubble>
                          </MessageContent>
                        </Message>
                      ))}
                    </MessageScrollerContent>
                  </div>
                </MessageScrollerViewport>
                <MessageScrollerButton />
              </MessageScroller>
            </div>
            <div className="flex flex-row">
              <div className="m-4 w-full mx-auto max-w-3xl">
                <PromptInputProvider>
                  <PromptInput globalDrop multiple onSubmit={() => {}}>
                    <PromptInputBody>
                      <PromptInputTextarea className="scrollbar-thin" />
                    </PromptInputBody>
                    <PromptInputFooter>
                      <PromptInputTools />
                      <PromptInputSubmit />
                    </PromptInputFooter>
                  </PromptInput>
                </PromptInputProvider>
              </div>
            </div>
          </div>
        </div>
      </MessageScrollerProvider>
    </ResizablePanel>
  );
};

export default ChatPanel;
