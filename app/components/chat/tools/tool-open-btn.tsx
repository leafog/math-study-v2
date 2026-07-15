import { X } from "lucide-react";
import type { ComponentProps } from "react";
import { Button } from "~/components/ui/button";
import { useChatTools } from "~/hooks/chat/active-chat";

const ToolOpenBtn = ({
  children,
  kind,
  title,
  ...props
}: ComponentProps<typeof Button> & { title: string; kind: string }) => {
  const { open } = useChatTools();
  return (
    <Button
      className="w-full justify-start"
      size="lg"
      variant={"outline"}
      {...props}
      onClick={(e) => {
        open(kind, title);
      }}
    >
      {children}
      <span>{title}</span>
    </Button>
  );
};

export default ToolOpenBtn;
