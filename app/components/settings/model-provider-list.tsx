import { ChevronRightIcon } from "lucide-react";
import {
  Item,
  ItemContent,
  ItemTitle,
  ItemActions,
  ItemMedia,
  ItemDescription,
} from "../ui/item";
import { OpenAI, Anthropic, Gemini, DeepSeek, Kimi } from "@lobehub/icons";
import type { ModelProvider } from "./types";
import { idToProviderConfig } from "./provider-config-ui";
import { keyBy } from "lodash-es";
export const providers: ModelProvider[] = [
  {
    id: "deepseek",
    name: "DeepSeek",
    avatar: DeepSeek.Avatar,
    text: DeepSeek.Text,
    description: "not yet set",
    Config: idToProviderConfig("deepseek")!.Config,
  },
  {
    id: "openai",
    name: "OpenAI",
    avatar: OpenAI.Avatar,
    text: OpenAI.Text,
    description: "not yet set",
    Config: idToProviderConfig("openai")!.Config,
  },
  {
    id: "anthropic",
    name: "Anthropic",
    avatar: Anthropic.Avatar,
    text: Anthropic.Text,
    description: "not yet set",
    Config: idToProviderConfig("anthropic")!.Config,
  },
  {
    id: "gemini",
    name: "Gemini",
    avatar: Gemini.Avatar,
    text: Gemini.Text,
    description: "not yet set",
    Config: idToProviderConfig("gemini")!.Config,
  },
  {
    id: "kimi",
    name: "Kimi",
    avatar: Kimi.Avatar,
    text: Kimi.Text,
    description: "not yet set",
    Config: idToProviderConfig("kimi")!.Config,
  },
];

export const providersMap = keyBy(providers, "id");

interface ModelProviderListProps {
  onOpenConfig: (id: string) => void;
}

export const ModelProviderList = ({ onOpenConfig }: ModelProviderListProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
      {providers.map((provider) => (
        <Item key={provider.id} variant="outline" asChild>
          <a
            onClick={() => {
              onOpenConfig(provider.id);
            }}
          >
            <ItemMedia variant="image">
              <provider.avatar size={24} shape="square" />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>
                <provider.text />
              </ItemTitle>
            </ItemContent>
            <ItemActions>
              <ChevronRightIcon className="size-4" />
            </ItemActions>
          </a>
        </Item>
      ))}
    </div>
  );
};
