import { ChevronRightIcon } from "lucide-react";
import {
  Item,
  ItemContent,
  ItemTitle,
  ItemActions,
  ItemMedia,
} from "../ui/item";
import { modelIcons } from "~/lib/agent";
import type { ProviderId } from "~/lib/agent/types";

interface ModelProviderListProps {
  onOpenConfig: (id: ProviderId) => void;
}

export const ModelProviderList = ({ onOpenConfig }: ModelProviderListProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
      {modelIcons.map((provider) => (
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
