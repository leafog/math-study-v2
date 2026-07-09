import { useEffect, useRef, useState, type PropsWithChildren } from "react";
import { motion } from "motion/react";
import { useParams } from "react-router";
import { useActiveChatState } from "~/hooks/use-active-chat";

import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "../ui/message-scroller";
import { Message, MessageContent } from "../ui/message";
import { Bubble, BubbleContent } from "../ui/bubble";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputProvider,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "../../../components/ai-elements/prompt-input";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "../ui/resizable";
import type { PanelImperativeHandle, PanelSize } from "react-resizable-panels";
import { Button } from "../ui/button";
import {
  Maximize2,
  Minimize2,
  PanelRight,
  PanelRightClose,
  PanelRightDashed,
} from "lucide-react";
import { ButtonGroup } from "../ui/button-group";
import { useChatToolsPanelStore } from "~/store/chat-tools-panel-store";
import Chat from "../../routes/_app.chat.$id";
import { withRef, withRefs } from "~/lib/ref-utils";

const ChatHeaderContainer = ({ children }: PropsWithChildren) => {
  return (
    <div className="h-10 bg-red-100 flex w-full justify-between items-center">
      {children}
    </div>
  );
};

const ToolsTrigger = ({
  onTrigger,
  inTools,
}: {
  onTrigger: VoidFunction;
  inTools: boolean;
}) => {
  return (
    <Button
      size="icon"
      variant={inTools ? "outline" : "ghost"}
      onClick={onTrigger}
    >
      {inTools ? <PanelRight /> : <PanelRightDashed />}
    </Button>
  );
};

const ZenModeButton = ({
  onZen,
  zen,
}: {
  onZen: VoidFunction;
  zen: boolean;
}) => {
  return (
    <Button size="icon" variant={zen ? "outline" : "ghost"} onClick={onZen}>
      {zen ? <Minimize2 /> : <Maximize2 />}
    </Button>
  );
};

const ChatShell = () => {
  const chatId = useActiveChatState((it) => it.chatId);
  const updateChatID = useActiveChatState((it) => it.updateChatId);
  const { id } = useParams();
  const toolsPanelRef = useRef<PanelImperativeHandle>(null);
  const chatPanelRef = useRef<PanelImperativeHandle>(null);
  const toolsSize = useChatToolsPanelStore.use.toolsSize();
  const chatSize = useChatToolsPanelStore.use.chatSize();
  const onChatResize = useChatToolsPanelStore.use.onChatResize();
  const onToolsResize = useChatToolsPanelStore.use.onToolsResize();
  const toolsClosed = useChatToolsPanelStore.use.toolsClosed();
  const chatClosed = useChatToolsPanelStore.use.chatClosed();
  const zenLastChatSize = useChatToolsPanelStore.use.zenLastChatSize();
  const toolsZenMod = useChatToolsPanelStore.use.toolsZenMod();
  const toolsZenModTrigger = useChatToolsPanelStore.use.toolsZenModTrigger();

  useEffect(() => {
    updateChatID(id);
  }, [id]);

  const onToolsTrigger = () => {
    withRefs({ toolsPanelRef, chatPanelRef }, ({ toolsPanel, chatPanel }) => {
      if (toolsClosed) {
        if (toolsZenMod) {
          chatPanel.collapse();
        }
        toolsPanel.expand();
      } else {
        console.log("open", toolsZenMod);
        if (toolsZenMod || chatClosed) {
          chatPanel.expand();
        }
        toolsPanel.collapse();
      }
      // toolsClosed ? it.expand() : it.collapse();
    });
  };

  useEffect(() => {
    console.log(toolsZenMod);
    withRef(chatPanelRef, (it) => {
      if (toolsZenMod) {
        if (chatSize.asPercentage !== 0) {
          it.collapse();
        }
      } else if (zenLastChatSize.inPixels > 0) {
        it.resize(zenLastChatSize.inPixels);
      } else {
        it.expand();
      }
    });
  }, [toolsZenMod]);

  return (
    <div className="size-full flex flex-col ">
      <ResizablePanelGroup className="w-full grow" orientation="horizontal">
        <ResizablePanel
          panelRef={chatPanelRef}
          defaultSize={"50%"}
          minSize={"30%"}
          collapsible
          onResize={(size) => onChatResize(size)}
          className="flex flex-col"
        >
          <ChatHeaderContainer>
            <span className="h-14"></span>
            <div>
              {toolsClosed && (
                <ToolsTrigger onTrigger={onToolsTrigger} inTools={false} />
              )}
            </div>
          </ChatHeaderContainer>

          <MessageScrollerProvider>
            <div className="relative w-full flex-1 overflow-hidden ">
              <div className="mx-auto  size-full overflow-hidden flex flex-col">
                <div className="flex-1 h-full overflow-hidden p-0 ">
                  <MessageScroller>
                    <MessageScrollerViewport>
                      <div className="flex flex-row">
                        <MessageScrollerContent className="m-4 w-full mx-auto max-w-3xl ">
                          {new Array(40).fill(null).map((it, i) => (
                            <Message align="end" key={i}>
                              <MessageContent>
                                <Bubble>
                                  <BubbleContent>
                                    Deploying to prod real quick. {id}
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
                      <PromptInput
                        globalDrop
                        multiple
                        onSubmit={(e) => {
                          console.log(e);
                        }}
                      >
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
        <ResizableHandle withHandle />
        <ResizablePanel
          panelRef={toolsPanelRef}
          defaultSize={"50%"}
          minSize={"25%"}
          collapsible
          onResize={(size) => {
            onToolsResize(size);
          }}
          className="flex flex-col w-full"
        >
          <ChatHeaderContainer>
            <div className="h-14"></div>
            <ButtonGroup></ButtonGroup>
            {!toolsClosed && (
              <div className="flex gap-2">
                <ZenModeButton onZen={toolsZenModTrigger} zen={toolsZenMod} />
                <ToolsTrigger onTrigger={onToolsTrigger} inTools />
              </div>
            )}
          </ChatHeaderContainer>
          <div>info</div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default ChatShell;
