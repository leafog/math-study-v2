import { useEffect, useMemo, useState, type FC } from "react";
import { useTranslation } from "react-i18next";
import { useForm, useSelector } from "@tanstack/react-form";
import {
  PlusIcon,
  XIcon,
  ExternalLinkIcon,
  EyeIcon,
  EyeOffIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "lucide-react";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldTitle,
} from "~/components/ui/field";
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";
import { Input } from "~/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import { Checkbox } from "~/components/ui/checkbox";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "~/components/ui/input-group";
import { useChatAgent } from "~/hooks/chat/active-chat";
import { useImmer } from "use-immer";
import { useBoolean } from "usehooks-ts";
import type { ProviderConfigValue, ProviderId } from "~/lib/agent/types";
import { testLLMConnectRecord } from "../test-llm-connect";

interface ProviderCommonProps {
  providerId: ProviderId;
  name: string;
  apiKeyUrl: string;
  models: string[];
  defaultBaseUrl: string;
  value?: ProviderConfigValue;
  onChange?: (value: ProviderConfigValue) => void;
}

type ProviderFormData = ProviderConfigValue & {
  new_model: string;
};

const ProviderCommon: FC<ProviderCommonProps> = ({
  providerId,
  name,
  apiKeyUrl,
  models,
  defaultBaseUrl,
  value,
  onChange,
}) => {
  const { t } = useTranslation();
  const { value: showApiKey, toggle: toggleShowApiKey } = useBoolean(false);
  const { hasSameName } = useChatAgent();

  const initialCustom = useMemo(
    () => new Set((value?.all_models ?? []).filter((m) => !models.includes(m))),
    [value?.all_models, models],
  );
  const [customModels, setCustomModels] = useImmer<Set<string>>(initialCustom);

  const allModels = useMemo(
    () => [...models, ...customModels],
    [models, customModels],
  );

  const defaultValues = useMemo(
    () => ({ ...value }) as ProviderFormData,
    [value],
  );

  const form = useForm({
    defaultValues,
    onSubmit: ({ value: formValue }: { value: ProviderFormData }) => {
      onChange?.({
        config_name: formValue.config_name?.trim() || undefined,
        api_key: formValue.api_key,
        base_url: formValue.base_url || defaultBaseUrl,
        all_models:
          (formValue.all_models ?? []).length > 0
            ? formValue.all_models
            : undefined,
        selected_models:
          (formValue.selected_models ?? []).length > 0
            ? formValue.selected_models
            : undefined,
      });
    },
  });

  useEffect(() => {
    form.setFieldValue("all_models", allModels);
  }, [allModels, form]);

  const handleAddModel = () => {
    const current = form.getFieldValue("new_model") as string;
    const trimmed = current.trim();
    if (!trimmed) return;
    if (allModels.includes(trimmed)) return;
    setCustomModels((draft) => {
      draft.add(trimmed);
    });
    form.setFieldValue("new_model", "");
  };

  const fieldErrors = (errors: unknown[]) =>
    errors.map((e) => (typeof e === "string" ? { message: e } : e)) as Array<{
      message?: string;
    }>;

  const handleRemoveModel = (model: string) => {
    setCustomModels((draft) => {
      draft.delete(model);
    });
  };

  const toggleModel = (
    current: string[],
    handleChange: (v: string[]) => void,
    model: string,
    checked: boolean | "indeterminate",
  ) => {
    if (checked === true) {
      handleChange([...current, model]);
    } else {
      handleChange(current.filter((m) => m !== model));
    }
  };

  const {
    value: testing,
    setTrue: startTest,
    setFalse: endTest,
  } = useBoolean(false);

  const { value: testSuccess, setValue: setTestSuccess } = useBoolean(false);
  const [hasTested, setHasTested] = useState(false);

  const apiKey = useSelector(form.store, (it) => it.values.api_key);
  const allModelsLength = useSelector(
    form.store,
    (it) => it.values.all_models?.length ?? 0,
  );
  const testFn = testLLMConnectRecord[providerId];
  const canTest = Boolean(
    testFn && apiKey?.trim() && allModelsLength > 0 && !testing,
  );

  // Reset test result when API key or models change
  useEffect(() => {
    setTestSuccess(false);
    setHasTested(false);
  }, [apiKey, allModelsLength]);

  const handleTest = async () => {
    if (!testFn) return;
    startTest();
    try {
      const result = await testFn(
        {
          api_key: apiKey ?? "",
          base_url: form.getFieldValue("base_url") || defaultBaseUrl,
        },
        allModels[0],
      );
      setTestSuccess(result);
      setHasTested(true);
    } catch {
      setTestSuccess(false);
      setHasTested(true);
    } finally {
      endTest();
    }
  };

  return (
    <div className="m-4">
      <FieldGroup>
        <form.Field
          name="config_name"
          validators={{
            onChange: ({ value: v }) => {
              const name = v?.trim();
              if (!name)
                return t("settings.provider.errors.configNameRequired");
              if (hasSameName(name) && name !== value?.config_name)
                return t("settings.provider.errors.configNameDuplicate");
              return undefined;
            },
          }}
        >
          {(fieldApi) => (
            <Field>
              <FieldLabel htmlFor="config-name">
                {t("settings.provider.configName")}
              </FieldLabel>
              <Input
                id="config-name"
                placeholder={t("settings.provider.configNamePlaceholder")}
                value={fieldApi.state.value}
                onChange={(e) => fieldApi.handleChange(e.target.value)}
                onBlur={fieldApi.handleBlur}
              />
              <FieldDescription>
                {t("settings.provider.configNameDesc")}
              </FieldDescription>
              <FieldError errors={fieldErrors(fieldApi.state.meta.errors)} />
            </Field>
          )}
        </form.Field>

        <form.Field
          name="api_key"
          validators={{
            onChange: ({ value: v }) => {
              if (!v.trim())
                return t("settings.provider.errors.apiKeyRequired");
              return undefined;
            },
          }}
        >
          {(apiField) => (
            <Field>
              <FieldLabel htmlFor="api-key">
                {t("settings.provider.apiKeyLabel", { name })}
              </FieldLabel>
              <div className="flex gap-1">
                <InputGroup className="flex-1">
                  <InputGroupInput
                    id="api-key"
                    disabled={testing}
                    type={showApiKey ? "text" : "password"}
                    placeholder={t("settings.provider.apiKeyPlaceholder")}
                    value={apiField.state.value}
                    onChange={(e) => apiField.handleChange(e.target.value)}
                    onBlur={apiField.handleBlur}
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton
                      size="icon-xs"
                      variant="ghost"
                      onClick={toggleShowApiKey}
                    >
                      {showApiKey ? (
                        <EyeOffIcon className="size-4" />
                      ) : (
                        <EyeIcon className="size-4" />
                      )}
                    </InputGroupButton>
                    {hasTested &&
                      !testing &&
                      (testSuccess ? (
                        <CheckCircleIcon className="size-4 text-green-500" />
                      ) : (
                        <XCircleIcon className="size-4 text-destructive" />
                      ))}
                  </InputGroupAddon>
                </InputGroup>
                <Button
                  size="default"
                  variant="outline"
                  className="ml-1"
                  disabled={!canTest}
                  onClick={handleTest}
                >
                  {testing && <Spinner data-icon="inline-start" />}
                  {testing
                    ? t("settings.provider.testing")
                    : t("settings.provider.test")}
                </Button>
              </div>
              <FieldDescription>
                {t("settings.provider.noKeyYet")}{" "}
                <Button
                  variant="link"
                  onClick={() => window.open(apiKeyUrl, "_blank")}
                >
                  {apiKeyUrl.replace("https://", "")}
                  <ExternalLinkIcon />
                </Button>
              </FieldDescription>
              <FieldError errors={fieldErrors(apiField.state.meta.errors)} />
            </Field>
          )}
        </form.Field>

        <Accordion type="single" collapsible>
          <AccordionItem value="custom-endpoint">
            <AccordionTrigger>
              {t("settings.provider.customEndpoint")}
            </AccordionTrigger>
            <AccordionContent>
              <form.Field name="base_url">
                {(urlField) => (
                  <Field orientation="vertical">
                    <FieldLabel htmlFor="base-url">
                      {t("settings.provider.baseUrl")}
                    </FieldLabel>
                    <Input
                      id="base-url"
                      placeholder={defaultBaseUrl}
                      value={urlField.state.value}
                      onChange={(e) => urlField.handleChange(e.target.value)}
                      onBlur={urlField.handleBlur}
                    />
                    <FieldDescription>
                      {t("settings.provider.baseUrlDesc")}
                    </FieldDescription>
                  </Field>
                )}
              </form.Field>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <form.Field name="selected_models">
          {(modelsField) => (
            <Field>
              <FieldLegend>{t("settings.provider.models")}</FieldLegend>
              <FieldDescription>
                {t("settings.provider.modelsDesc")}
              </FieldDescription>
              <div className="flex flex-col gap-2">
                {allModels.map((model) => {
                  const isCustom = customModels.has(model);
                  const selected = modelsField.state.value ?? [];
                  return (
                    <FieldLabel key={model}>
                      <Field orientation="horizontal">
                        <Checkbox
                          id={model}
                          name={model}
                          checked={selected.includes(model)}
                          onCheckedChange={(checked) =>
                            toggleModel(
                              selected,
                              modelsField.handleChange,
                              model,
                              checked,
                            )
                          }
                        />
                        <FieldContent>
                          <FieldTitle>{model}</FieldTitle>
                        </FieldContent>
                        {isCustom && (
                          <InputGroupButton
                            variant="destructive"
                            size="icon-xs"
                            onClick={() => handleRemoveModel(model)}
                          >
                            <XIcon className="size-3" />
                          </InputGroupButton>
                        )}
                      </Field>
                    </FieldLabel>
                  );
                })}
              </div>
              <form.Field
                name="new_model"
                validators={{
                  onChange: ({ value: v }) => {
                    const trimmed = v?.trim() ?? "";
                    if (trimmed && allModels.includes(trimmed)) {
                      return t("settings.provider.errors.modelAlreadyExists");
                    }
                    return undefined;
                  },
                }}
              >
                {(newModelField) => (
                  <>
                    <InputGroup>
                      <Input
                        placeholder={t("settings.provider.addCustomModel")}
                        value={newModelField.state.value}
                        onChange={(e) =>
                          newModelField.handleChange(e.target.value)
                        }
                        onKeyDown={(e) => e.key === "Enter" && handleAddModel()}
                      />
                      <InputGroupAddon align="inline-end">
                        <InputGroupButton onClick={handleAddModel}>
                          <PlusIcon className="size-4" />
                        </InputGroupButton>
                      </InputGroupAddon>
                    </InputGroup>
                    <FieldError
                      errors={fieldErrors(newModelField.state.meta.errors)}
                    />
                  </>
                )}
              </form.Field>
              <FieldError errors={fieldErrors(modelsField.state.meta.errors)} />
            </Field>
          )}
        </form.Field>

        <Button type="button" onClick={() => form.handleSubmit()}>
          {t("common.save")}
        </Button>
      </FieldGroup>
    </div>
  );
};

export default ProviderCommon;
