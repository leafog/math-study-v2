import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Edit, PackageOpen } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { ModelProviderList, providersMap } from "./model-provider-list";
import { useChatAgent } from "~/hooks/chat/active-chat";
import { genId } from "~/lib/id-utils";
import type { ProviderConfigValue } from "./types";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemMedia,
  ItemTitle,
} from "../ui/item";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "../ui/field";
import { Checkbox } from "../ui/checkbox";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "../ui/empty";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";

const ModelConfig = () => {
  const { t } = useTranslation();
  const { settings, hasConfig, insertConfig, updateConfig } = useChatAgent();

  const [dialogProviderId, setDialogProviderId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<
    ProviderConfigValue | undefined
  >();

  const handleConfigChange = (configValue: ProviderConfigValue) => {
    if (!dialogProvider) return;

    if (editingId) {
      updateConfig(editingId, {
        id: editingId,
        provider_id: dialogProvider.id,
        ...configValue,
      });
    } else {
      insertConfig({
        id: genId(),
        provider_id: dialogProvider.id,
        ...configValue,
      });
    }
    setDialogProviderId(null);
    setEditingId(null);
    setEditingValue(undefined);
  };
  const dialogProvider = dialogProviderId
    ? (providersMap[dialogProviderId] ?? null)
    : null;

  const validProviders = useMemo(
    () =>
      settings
        .map((it) => ({
          provider: providersMap[it.provider_id],
          ...it,
        }))
        .filter((it) => it.provider !== undefined),
    [settings],
  );

  const handleOpenConfig = (id: string) => {
    setDialogProviderId(id);
    setEditingId(null);
    setEditingValue(undefined);
  };

  const handleEditConfig = (
    configId: string,
    providerId: string,
    value: ProviderConfigValue,
  ) => {
    setDialogProviderId(providerId);
    setEditingId(configId);
    setEditingValue(value);
  };

  return (
    <div className="flex flex-col gap-2 space-y-3 flex-1">
      <Card size="sm">
        <CardHeader>
          <CardTitle>{t("settings.model")}</CardTitle>
          <CardDescription>{t("settings.modelDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion
            type="multiple"
            defaultValue={
              hasConfig ? ["configured-models"] : ["available-providers"]
            }
          >
            {/* Accordion 1: 可添加的服务商目录 */}
            <AccordionItem value="available-providers">
              <AccordionTrigger>
                {t("settings.availableProviders")}
              </AccordionTrigger>
              <AccordionContent>
                <ModelProviderList onOpenConfig={handleOpenConfig} />
              </AccordionContent>
            </AccordionItem>

            {/* Accordion 2: 已配置的模型列表 */}
            <AccordionItem value="configured-models">
              <AccordionTrigger>
                {t("settings.configuredModels")}
              </AccordionTrigger>
              <AccordionContent key={validProviders.length}>
                {validProviders.length > 0 ? (
                  <div className="grid  gap-4">
                    {validProviders.map(
                      ({
                        provider,
                        id,
                        config_name,
                        selected_models,
                        all_models,
                        api_key,
                        base_url,
                      }) => (
                        <Item key={id} variant={"muted"}>
                          <ItemMedia>
                            <provider.avatar size={24} shape="square" />
                          </ItemMedia>
                          <ItemContent>
                            <ItemTitle>{config_name ?? provider.id}</ItemTitle>
                            <ItemDescription>
                              {(selected_models ?? []).length > 0
                                ? `${(selected_models ?? []).length} models`
                                : provider.description}
                            </ItemDescription>
                          </ItemContent>
                          <ItemActions className="opacity-0 group-hover/item:opacity-100">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() =>
                                handleEditConfig(id, provider.id, {
                                  config_name,
                                  api_key,
                                  base_url,
                                  all_models,
                                  selected_models,
                                })
                              }
                            >
                              <Edit />
                            </Button>
                          </ItemActions>
                          <ItemFooter>
                            <FieldGroup className="gap-2 grid grid-cols-4">
                              {(all_models ?? selected_models ?? []).map(
                                (model) => (
                                  <FieldLabel key={model}>
                                    <Field orientation="horizontal">
                                      <Checkbox
                                        id={`${id}-${model}`}
                                        checked={(
                                          selected_models ?? []
                                        ).includes(model)}
                                      />
                                      <FieldContent>
                                        <FieldTitle>{model}</FieldTitle>
                                      </FieldContent>
                                    </Field>
                                  </FieldLabel>
                                ),
                              )}
                            </FieldGroup>
                          </ItemFooter>
                        </Item>
                      ),
                    )}
                  </div>
                ) : (
                  <Empty className="py-4">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <PackageOpen />
                      </EmptyMedia>
                      <EmptyTitle>
                        {t("settings.noConfiguredModels")}
                      </EmptyTitle>
                    </EmptyHeader>
                  </Empty>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      <Dialog
        open={dialogProviderId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDialogProviderId(null);
            setEditingId(null);
            setEditingValue(undefined);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg max-h-[85vh] grid-rows-[auto_1fr] overflow-hidden">
          {dialogProvider && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <dialogProvider.avatar size={20} shape="square" />
                  <dialogProvider.text />
                </DialogTitle>
              </DialogHeader>
              <div className="overflow-y-auto scrollbar-thin min-h-0">
                <dialogProvider.Config
                  providerId={dialogProvider.id}
                  value={editingValue}
                  onChange={handleConfigChange}
                />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
export default ModelConfig;
