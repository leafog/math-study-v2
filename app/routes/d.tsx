import { useEffect } from "react";
import { useChat, fetchServerSentEvents } from "@tanstack/ai-react";

const D = () => {
  const { messages, sendMessage, isLoading, error } = useChat({
    connection: fetchServerSentEvents("/api/chat"),
  });
  useEffect(() => {
    console.log(window);
  });
  return (
    <div className="w-full">
      <math-field read-only={true}>e=m^2c</math-field>
      <div className="pt-20"> 123</div>
    </div>
  );
};

export default D;
