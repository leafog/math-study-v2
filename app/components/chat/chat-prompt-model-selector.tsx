import { useMemo, useEffect } from "react";
import { useNavigate } from "react-router";
import { useBoolean } from "usehooks-ts";
import { useTranslation } from "react-i18next";
import { SettingsIcon } from "lucide-react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "../ui/empty";
import { useChatAgent } from "~/hooks/chat/active-chat";
import { useChatPromptInput } from "~/hooks/chat/active-chat/hooks";
import { useChatDefaultModel } from "~/store/chat-default-model";

const ChatPromptModelSelector = () => {
  const {
    value: open,
    setValue: setOpen,
    setFalse: closeDropdown,
  } = useBoolean(false);
  const { t } = useTranslation();

  const { defaultModel } = useChatDefaultModel();

  const navigate = useNavigate();
  const { currentProviders } = useChatAgent();
  const currentModel = useChatPromptInput().use.currentModel();
  const setCurrentModel = useChatPromptInput().use.setCurrentModel();

  // Check if currentModel is still valid in currentProviders
  const isCurrentModelValid = useMemo(() => {
    if (!currentModel) return false;
    const provider = currentProviders.find((p) => p.id === currentModel.id);
    if (!provider) return false;
    return (provider.selected_models ?? []).includes(currentModel.model_name);
  }, [currentModel, currentProviders]);

  // Fall back to defaultModel if currentModel is invalid or missing
  useEffect(() => {
    if (!isCurrentModelValid && defaultModel) {
      setCurrentModel(defaultModel);
    }
  }, [isCurrentModelValid, defaultModel, setCurrentModel]);

  const activeModel = isCurrentModelValid ? currentModel : defaultModel;
  const currentValue = activeModel
    ? `${activeModel.id}:${activeModel.model_name}`
    : "";

  const selectedProvider = useMemo(() => {
    if (!activeModel) return null;
    return (
      currentProviders.find((p) => p.id === activeModel.id)?.provider ?? null
    );
  }, [activeModel, currentProviders]);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant={"outline"}
          className="hover: cursor-pointer rounded-full"
        >
          {activeModel && selectedProvider ? (
            <>
              <selectedProvider.avatar size={16} />
              {activeModel.model_name}
            </>
          ) : (
            "Select model"
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="scrollbar-thin w-64 max-h-64"
        align="center"
      >
        {currentProviders.length === 0 ? (
          <Empty className="py-6 px-4 border-none">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <SettingsIcon />
              </EmptyMedia>
              <EmptyTitle>{t("chat.noModelConfigured")}</EmptyTitle>
              <EmptyDescription>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => {
                    closeDropdown();
                    navigate("/settings?tab=model");
                  }}
                >
                  {t("chat.goToModelSettings")}
                </Button>
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          currentProviders.map(
            ({ id, selected_models = [], config_name, provider }, i) => (
              <DropdownMenuGroup key={id}>
                <DropdownMenuLabel>
                  <div className="flex items-center gap-1">
                    <provider.text />
                    {config_name && <span>{config_name}</span>}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  value={currentValue}
                  onValueChange={(value) => {
                    const [configId, model_name] = value.split(":");
                    setCurrentModel({
                      id: configId,
                      config_name: config_name ?? "",
                      model_name,
                    });
                  }}
                >
                  {selected_models.map((model) => {
                    const modelId = `${id}:${model}`;
                    return (
                      <DropdownMenuRadioItem
                        key={modelId}
                        value={modelId}
                        className="focus:**:text-current"
                      >
                        <provider.avatar
                          size={16}
                          iconStyle={{ color: "inherit" }}
                        />
                        {model}
                      </DropdownMenuRadioItem>
                    );
                  })}
                </DropdownMenuRadioGroup>
                {i < currentProviders.length - 1 && <DropdownMenuSeparator />}
              </DropdownMenuGroup>
            ),
          )
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ChatPromptModelSelector;
