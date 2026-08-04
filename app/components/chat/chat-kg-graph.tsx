import { KnowledgeGraph } from "~/components/graph/knowledge-graph";
import { useChatKgTopics } from "~/hooks/chat/active-chat";

const ChatKnowledgeGraph = () => {
  const { chatGraphNodes, chatGraphEdges } = useChatKgTopics();
  return <KnowledgeGraph nodes={chatGraphNodes} edges={chatGraphEdges} />;
};

export default ChatKnowledgeGraph;
