import { memo } from "react";
import { KnowledgeGraph } from "~/components/graph/knowledge-graph";
import { useChatKgTopics } from "~/hooks/chat/active-chat";

const KnowledgeGraphAll = () => {
  const { graphNodes, graphEdges } = useChatKgTopics();
  return <KnowledgeGraph nodes={graphNodes} edges={graphEdges} />;
};

export default memo(KnowledgeGraphAll);
