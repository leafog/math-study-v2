import { useTranslation } from "react-i18next";
import { useChatTools } from "~/hooks/chat/active-chat";
import { Button } from "../ui/button";
import { toolRegistry } from "./tools";

const ToolsGreeting = () => {
  const { t } = useTranslation();
  const { open } = useChatTools();
  return (
    <div className="flex flex-1 size-full justify-center items-center">
      <div className="flex flex-col  max-w-lg w-full p-4 gap-2">
        {toolRegistry.map(({ kind, Icon }) => (
          <Button
            className="w-full justify-start"
            size="lg"
            key={kind}
            variant={"outline"}
            onClick={(e) => {
              open(kind, t("tools." + kind));
            }}
          >
            <Icon />
            <span>{t("tools." + kind)}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default ToolsGreeting;
