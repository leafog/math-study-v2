import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Edit, PackageOpen, Trash2 } from "lucide-react";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemFooter,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "../ui/item";
import { Checkbox } from "../ui/checkbox";
import { Field, FieldGroup, FieldLabel } from "../ui/field";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "../ui/empty";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { useChatAgent } from "~/hooks/chat/active-chat";
import { useChatDefaultModel } from "~/store/chat-default-model";
import { useVisionModel } from "~/store/chat-vision-model";
import { genId } from "~/lib/id-utils";
import { modelConfigUIs, modelIconRecord } from "~/lib/agent";
import type { ProviderConfigValue, ProviderId } from "~/lib/agent/types";
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
import type { Accordion } from "radix-ui";
import type {
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "../ui/accordion";
import type {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../ui/card";
import { ModelProviderList } from "./model-provider-list";

const ModelConfigPage = () => {
  const { t } = useTranslation();
  const { validProviders, insertConfig, updateConfig, deleteConfig } =
    useChatAgent();
  const defaultModel = useChatDefaultModel.use.defaultModel();
  const setDefaultModel = useChatDefaultModel.use.setDefaultModel();
  const visionModel = useVisionModel.use.visionModel();
  const setVisionModel = useVisionModel.use.setVisionModel();

  const [dialogProviderId, setDialogProviderId] = useState<ProviderId | null>(
    null,
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<
    ProviderConfigValue | undefined
  >();

  const dialogProvider = dialogProviderId
    ? (modelIconRecord[dialogProviderId] ?? null)
    : null;
  const DialogConfig = dialogProviderId
    ? (modelConfigUIs[dialogProviderId] ?? null)
    : null;

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

  const handleEditConfig = (
    configId: string,
    providerId: ProviderId,
    value: ProviderConfigValue,
  ) => {
    setDialogProviderId(providerId);
    setEditingId(configId);
    setEditingValue(value);
  };

  const handleOpenConfig = (providerId: ProviderId) => {
    setDialogProviderId(providerId);
    setEditingId(null);
    setEditingValue(undefined);
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

  const onSetDefaultFactory =
    (cfg: {
      id: string;
      provider_id: string;
      config_name: string;
      api_key: string;
      base_url: string;
      all_models: string[];
      selected_models: string[];
    }) =>
    (model: string) => {
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

  const onCheckedChangeFactory =
    (cfg: {
      id: string;
      provider_id: string;
      config_name: string;
      api_key: string;
      base_url: string;
      all_models: string[];
      selected_models: string[];
    }) =>
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

  const onEditFactory =
    (cfg: {
      id: string;
      config_name: string;
      api_key: string;
      base_url: string;
      all_models: string[];
      selected_models: string[];
    }) =>
    (providerId: ProviderId) =>
    () => {
      handleEditConfig(cfg.id, providerId, {
        config_name: cfg.config_name,
        api_key: cfg.api_key,
        base_url: cfg.base_url,
        all_models: cfg.all_models,
        selected_models: cfg.selected_models,
      });
    };

  const visionValue = visionModel
    ? `${visionModel.id}::${visionModel.model_name}`
    : "";

  const handleVisionChange = (value: string) => {
    const [id, model_name] = value.split("::");
    const cfg = validProviders.find((p) => p.id === id);
    setVisionModel({
      id,
      config_name: cfg?.config_name ?? "",
      model_name,
    });
  };

  const selectedVisionProvider = visionModel
    ? (validProviders.find((p) => p.id === visionModel.id)?.provider ?? null)
    : null;

  const visionModelOptions = validProviders.filter(
    (p) => (p.selected_models ?? []).length > 0,
  );

  return (
    <div className="flex flex-col gap-2 flex-1">
      {validProviders.length === 0 ? (
        <Empty className="py-4">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <PackageOpen />
            </EmptyMedia>
            <EmptyTitle>{t("settings.noConfiguredModels")}</EmptyTitle>
          </EmptyHeader>
        </Empty>
      ) : null}
      <ItemGroup>
        <Item variant="outline" className="flex-col items-stretch gap-2">
          <ItemContent>
            <ItemTitle>{t("settings.availableProviders")}</ItemTitle>
          </ItemContent>
          <ModelProviderList onOpenConfig={handleOpenConfig} />
        </Item>
      </ItemGroup>
      {validProviders.length > 0 ? (
        <ItemGroup>
          {validProviders.map(
            ({
              provider,
              id,
              config_name,
              all_models,
              selected_models,
              api_key,
              base_url,
            }) => {
              const cfg = {
                id,
                provider_id: provider.id,
                config_name: config_name ?? "",
                api_key,
                base_url,
                all_models: all_models ?? [],
                selected_models: selected_models ?? [],
              };
              const onEdit = onEditFactory(cfg)(provider.id);
              const onSetDefault = onSetDefaultFactory(cfg);
              const onCheckedChange = onCheckedChangeFactory(cfg);

              return (
                <Item key={id} variant="outline">
                  <ItemMedia>
                    <provider.avatar size={24} shape="square" />
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle>
                      <provider.text />
                      {cfg.config_name || provider.id}
                    </ItemTitle>
                  </ItemContent>
                  <ItemActions>
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
                    <FieldGroup className="gap-2 flex flex-col">
                      {(all_models ?? []).map((model) => {
                        const checked = (selected_models ?? []).includes(model);
                        const isDefault =
                          defaultModel?.id === id &&
                          defaultModel?.model_name === model;
                        const inputId = `${id}-${model}`;
                        return (
                          <Field
                            key={model}
                            orientation="horizontal"
                            className="group/model-row"
                          >
                            <Checkbox
                              id={inputId}
                              checked={checked}
                              disabled={isDefault}
                              onCheckedChange={(value) =>
                                onCheckedChange(model, value)
                              }
                            />
                            <FieldLabel
                              htmlFor={inputId}
                              className="font-normal line-clamp-1 flex w-full justify-between items-center gap-2"
                            >
                              <span className="min-w-0 line-clamp-1">
                                {model}
                              </span>
                              {isDefault ? (
                                <Badge>{t("settings.default")}</Badge>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="xs"
                                  className="opacity-0 group-hover/model-row:opacity-100 transition-opacity"
                                  onClick={() => onSetDefault(model)}
                                >
                                  {t("settings.default")}
                                </Button>
                              )}
                            </FieldLabel>
                          </Field>
                        );
                      })}
                    </FieldGroup>
                  </ItemFooter>
                </Item>
              );
            },
          )}
          <Item variant="outline">
            <ItemContent>
              <ItemTitle>{t("settings.visionModel")}</ItemTitle>
            </ItemContent>
            <ItemActions>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="rounded-full">
                    {visionModel && selectedVisionProvider ? (
                      <>
                        <selectedVisionProvider.avatar size={16} />
                        {visionModel.model_name}
                      </>
                    ) : (
                      t("settings.visionModelPlaceholder")
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="scrollbar-thin w-64 max-h-64"
                  align="center"
                >
                  {visionModelOptions.length === 0 ? (
                    <Empty className="py-6 px-4 border-none">
                      <EmptyHeader>
                        <EmptyTitle>
                          {t("settings.visionModelPlaceholder")}
                        </EmptyTitle>
                      </EmptyHeader>
                    </Empty>
                  ) : (
                    visionModelOptions.map(
                      ({ id, selected_models, config_name, provider }, i) => (
                        <DropdownMenuGroup key={id}>
                          <DropdownMenuLabel>
                            <div className="flex items-center gap-1">
                              <provider.text />
                              {config_name && <span>{config_name}</span>}
                            </div>
                          </DropdownMenuLabel>
                          <DropdownMenuRadioGroup
                            value={visionValue}
                            onValueChange={handleVisionChange}
                          >
                            {(selected_models ?? []).map((model) => (
                              <DropdownMenuRadioItem
                                key={`${id}-${model}`}
                                value={`${id}::${model}`}
                                className="focus:**:text-current"
                              >
                                <provider.avatar
                                  size={16}
                                  iconStyle={{ color: "inherit" }}
                                />
                                {model}
                              </DropdownMenuRadioItem>
                            ))}
                          </DropdownMenuRadioGroup>
                          {i < visionModelOptions.length - 1 && (
                            <DropdownMenuSeparator />
                          )}
                        </DropdownMenuGroup>
                      ),
                    )
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </ItemActions>
          </Item>
        </ItemGroup>
      ) : null}

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
        <DialogContent className="sm:max-w-lg max-h-[85vh] scrollbar-gutter-both grid-rows-[auto_1fr] px-0 overflow-hidden">
          {dialogProvider && DialogConfig && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <dialogProvider.avatar size={20} shape="square" />
                  <dialogProvider.text />
                </DialogTitle>
              </DialogHeader>
              <div className="overflow-y-auto scrollbar-thin min-h-0">
                <DialogConfig
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

export default ModelConfigPage;
