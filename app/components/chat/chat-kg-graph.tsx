import { useRef } from "react";
import {
  KnowledgeGraph,
  type KnowledgeGraphHandle,
} from "~/components/graph/knowledge-graph";
import { useRxEvent } from "~/event/events";
import { useChatKgTopics } from "~/hooks/chat/active-chat";

const ChatKnowledgeGraph = () => {
  const { chatGraphNodes, chatGraphEdges } = useChatKgTopics();
  const graphRef = useRef<KnowledgeGraphHandle>(null);

  useRxEvent("topic:in-chat-view-topic", true, (id) => {
    graphRef.current?.focusNode(id);
  });

  return (
    <KnowledgeGraph
      ref={graphRef}
      nodes={chatGraphNodes}
      edges={chatGraphEdges}
    />
  );
};

export default ChatKnowledgeGraph;
