import { Card, CardContent, CardTitle } from "../ui/card";
import ChatKnowledgeGraph from "./chat-kg-graph";

const ChatPanelRight = () => {
  return (
    <div>
      <Card>
        <CardTitle>知识图谱</CardTitle>
        <CardContent>
          <ChatKnowledgeGraph />
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatPanelRight;
