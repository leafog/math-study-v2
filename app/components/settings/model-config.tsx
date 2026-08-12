import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Edit, PackageOpen, Trash2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";
import { Badge } from "../ui/badge";
import { ModelProviderList } from "./model-provider-list";
import { useChatAgent } from "~/hooks/chat/active-chat";
import { genId } from "~/lib/id-utils";
import {
  Item,
  ItemActions,
  ItemContent,
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
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "../ui/field";
import { Checkbox } from "../ui/checkbox";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "../ui/empty";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { ProviderId, type ProviderConfigValue } from "~/lib/agent/types";
import { modelConfigUIs, modelIconRecord } from "~/lib/agent";

import { useChatDefaultModel } from "~/store/chat-default-model";

type ConfigData = {
  id: string;
  provider_id: string;
  api_key: string;
  base_url: string;
  config_name: string;
  all_models: string[];
  selected_models: string[];
};
const ModelConfig = () => {
  const { t } = useTranslation();
  const { validProviders, insertConfig, updateConfig, deleteConfig } =
    useChatAgent();

  const [dialogProviderId, setDialogProviderId] = useState<ProviderId | null>(
    null,
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<
    ProviderConfigValue | undefined
  >();
  const defaultModel = useChatDefaultModel.use.defaultModel();
  const setDefaultModel = useChatDefaultModel.use.setDefaultModel();

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
    ? (modelIconRecord[dialogProviderId] ?? null)
    : null;

  const DialogConfig = dialogProviderId
    ? (modelConfigUIs[dialogProviderId] ?? null)
    : null;

  const handleOpenConfig = (id: ProviderId) => {
    setDialogProviderId(id);
    setEditingId(null);
    setEditingValue(undefined);
  };

  const handleEditConfig = (
    configId: string,
    providerId: ProviderId,
    value: ProviderConfigValue,
  ) => {
    setDialogProviderId(providerId);
    setEditingId(configId);
    setEditingValue(value);
  };

  const handleSetDefault = (
    configId: string,
    configName: string,
    modelName: string,
    currentSelected: string[],
    providerId: string,
    apiKey: string,
    baseUrl: string,
    allModels: string[],
  ) => {
    if (!currentSelected.includes(modelName)) {
      updateConfig(configId, {
        id: configId,
        provider_id: providerId,
        api_key: apiKey,
        base_url: baseUrl,
        config_name: configName,
        all_models: allModels,
        selected_models: [...currentSelected, modelName],
      });
    }
    setDefaultModel({
      id: configId,
      config_name: configName,
      model_name: modelName,
    });
  };

  const onCheckedChangeFactory =
    (cfg: ConfigData) =>
    (model: string, checked: boolean | "indeterminate") => {
      const sel = cfg.selected_models;
      const next =
        checked === true ? [...sel, model] : sel.filter((m) => m !== model);
      updateConfig(cfg.id, {
        id: cfg.id,
        provider_id: cfg.provider_id,
        api_key: cfg.api_key,
        base_url: cfg.base_url,
        config_name: cfg.config_name,
        all_models: cfg.all_models,
        selected_models: next,
      });
    };

  const onSetDefaultFactory = (cfg: ConfigData) => (model: string) => {
    handleSetDefault(
      cfg.id,
      cfg.config_name,
      model,
      cfg.selected_models,
      cfg.provider_id,
      cfg.api_key,
      cfg.base_url,
      cfg.all_models,
    );
  };

  const onEditFactory = (cfg: ConfigData) => (providerId: ProviderId) => () => {
    handleEditConfig(cfg.id, providerId, {
      config_name: cfg.config_name,
      api_key: cfg.api_key,
      base_url: cfg.base_url,
      all_models: cfg.all_models,
      selected_models: cfg.selected_models,
    });
  };

  return (
    <div className="flex flex-col gap-2 space-y-3 flex-1">
      <Card size="sm">
        <CardHeader>
          <CardTitle>{t("settings.model")}</CardTitle>
          <CardDescription>{t("settings.modelDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" defaultValue={["available-providers"]}>
            {/* Accordion 1: 可添加的服务商目录 */}
            <AccordionItem value="available-providers">
              <AccordionTrigger>
                {t("settings.availableProviders")}
              </AccordionTrigger>
              <AccordionContent>
                <ModelProviderList onOpenConfig={handleOpenConfig} />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader>
          <CardTitle>{t("settings.configuredModels")}</CardTitle>
        </CardHeader>
        <CardContent key={validProviders.length}>
          {validProviders.length > 0 ? (
            <div className="grid gap-4">
              {validProviders.map(
                ({
                  provider,
                  id,
                  provider_id,
                  config_name,
                  selected_models,
                  all_models,
                  api_key,
                  base_url,
                }) => {
                  const cfg: ConfigData = {
                    id,
                    provider_id,
                    api_key,
                    base_url,
                    config_name: config_name ?? "",
                    all_models: all_models ?? [],
                    selected_models: selected_models ?? [],
                  };

                  const onCheckedChange = onCheckedChangeFactory(cfg);
                  const onSetDefault = onSetDefaultFactory(cfg);
                  const onEdit = onEditFactory(cfg)(provider.id);

                  return (
                    <Item key={id} variant={"muted"}>
                      <ItemMedia>
                        <provider.avatar size={24} shape="square" />
                      </ItemMedia>
                      <ItemContent>
                        <ItemTitle>
                          <provider.text />
                          {cfg.config_name || provider.id}
                        </ItemTitle>
                      </ItemContent>
                      <ItemActions className="opacity-0 gap-1 group-hover/item:opacity-100">
                        <Button size="icon" variant="ghost" onClick={onEdit}>
                          <Edit />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              disabled={defaultModel?.id === id}
                            >
                              <Trash2 className="text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                {t("settings.deleteConfigTitle")}
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                {t("settings.deleteConfigDesc", {
                                  name: cfg.config_name || provider.id,
                                })}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>
                                {t("common.cancel")}
                              </AlertDialogCancel>
                              <AlertDialogAction
                                variant="destructive"
                                onClick={() => deleteConfig(id)}
                              >
                                {t("common.delete")}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </ItemActions>
                      <ItemFooter>
                        <FieldGroup className="gap-2 grid grid-cols-2 md:grid-cols-3">
                          {cfg.all_models.map((model) => {
                            const isDefault =
                              defaultModel?.id === id &&
                              defaultModel?.model_name === model;
                            return (
                              <FieldLabel key={model}>
                                <Field
                                  orientation="horizontal"
                                  className="group/model-row"
                                >
                                  <Checkbox
                                    id={`${id}-${model}`}
                                    checked={cfg.selected_models.includes(
                                      model,
                                    )}
                                    disabled={isDefault}
                                    onCheckedChange={(checked) =>
                                      onCheckedChange(model, checked)
                                    }
                                  />
                                  <FieldContent>
                                    <FieldTitle className="flex w-full justify-between items-center">
                                      {model}
                                      {isDefault ? (
                                        <Badge>default</Badge>
                                      ) : (
                                        <Button
                                          variant="outline"
                                          size="xs"
                                          className="opacity-0 group-hover/model-row:opacity-100 transition-opacity"
                                          onClick={() => onSetDefault(model)}
                                        >
                                          default
                                        </Button>
                                      )}
                                    </FieldTitle>
                                  </FieldContent>
                                </Field>
                              </FieldLabel>
                            );
                          })}
                        </FieldGroup>
                      </ItemFooter>
                    </Item>
                  );
                },
              )}
            </div>
          ) : (
            <Empty className="py-4">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <PackageOpen />
                </EmptyMedia>
                <EmptyTitle>{t("settings.noConfiguredModels")}</EmptyTitle>
              </EmptyHeader>
            </Empty>
          )}
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
          {dialogProvider && DialogConfig && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <dialogProvider.avatar size={20} shape="square" />
                  <dialogProvider.text />
                </DialogTitle>
              </DialogHeader>
              <div className="overflow-y-auto scrollbar-thin min-h-0">
                {DialogConfig && (
                  <DialogConfig
                    providerId={dialogProvider.id}
                    value={editingValue}
                    onChange={handleConfigChange}
                  />
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
export default ModelConfig;
