import { KnowledgeGraph } from "~/components/graph/knowledge-graph";
import { useChatKgTopics } from "~/hooks/chat/active-chat";

const Graph = () => {
  const { graphNodes, graphEdges } = useChatKgTopics();
  return (
    <div className="flex flex-1 min-h-0 relative">
      {/* Graph - full background */}
      <div className="absolute inset-0">
        <KnowledgeGraph nodes={graphNodes} edges={graphEdges} />
      </div>
    </div>
  );
};

export default Graph;
