import { useState } from "react";
import { useTranslation } from "react-i18next";
import { RefreshCw } from "lucide-react";
import { useForm, useSelector } from "@tanstack/react-form";
import type { ModelProviderConfigProps } from "~/lib/agent/types";
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
import { Input } from "~/components/ui/input";
import { Checkbox } from "~/components/ui/checkbox";
import { Spinner } from "~/components/ui/spinner";
import { useChatAgent } from "~/hooks/chat/active-chat";

const DEFAULT_BASE_URL = "http://localhost:11434";

const fetchOllamaModels = async (baseUrl: string): Promise<string[]> => {
  const url = `${baseUrl.replace(/\/+$/, "")}/api/tags`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as { models?: { name: string }[] };
  return (data.models ?? []).map((m) => m.name);
};

type OllamaFormData = {
  config_name: string;
  base_url: string;
  all_models: string[];
  selected_models: string[];
};

const OllamaConfig = ({ value, onChange }: ModelProviderConfigProps) => {
  const { t } = useTranslation();
  const { hasSameName } = useChatAgent();
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      config_name: value?.config_name ?? "",
      base_url: value?.base_url || DEFAULT_BASE_URL,
      all_models: value?.all_models ?? [],
      selected_models: value?.selected_models ?? [],
    } as OllamaFormData,
    onSubmit: ({ value: formValue }) => {
      onChange?.({
        config_name: formValue.config_name?.trim() || undefined,
        api_key: "",
        base_url: formValue.base_url || DEFAULT_BASE_URL,
        all_models:
          formValue.all_models.length > 0 ? formValue.all_models : undefined,
        selected_models:
          formValue.selected_models.length > 0
            ? formValue.selected_models
            : undefined,
      });
    },
  });

  const baseUrl = useSelector(form.store, (it) => it.values.base_url);
  const allModels = useSelector(form.store, (it) => it.values.all_models ?? []);

  const fieldErrors = (errors: unknown[]) =>
    errors.map((e) => (typeof e === "string" ? { message: e } : e)) as Array<{
      message?: string;
    }>;

  const handleFetch = async () => {
    if (!baseUrl?.trim()) return;
    setFetching(true);
    setFetchError(null);
    try {
      const list = await fetchOllamaModels(baseUrl.trim());
      const selected = (form.getFieldValue("selected_models") ?? []).filter(
        (m) => list.includes(m),
      );
      form.setFieldValue("all_models", list);
      form.setFieldValue("selected_models", selected);
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : String(e));
    } finally {
      setFetching(false);
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
              <FieldLabel htmlFor="ollama-config-name">
                {t("settings.provider.configName")}
              </FieldLabel>
              <Input
                id="ollama-config-name"
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

        <form.Field name="base_url">
          {(urlField) => (
            <Field>
              <FieldLabel htmlFor="ollama-base-url">
                {t("settings.provider.serviceUrl")}
              </FieldLabel>
              <div className="flex gap-1">
                <Input
                  id="ollama-base-url"
                  className="flex-1"
                  placeholder={DEFAULT_BASE_URL}
                  value={urlField.state.value}
                  onChange={(e) => urlField.handleChange(e.target.value)}
                  onBlur={urlField.handleBlur}
                />
                <Button
                  variant="outline"
                  disabled={fetching}
                  onClick={handleFetch}
                >
                  {fetching ? (
                    <Spinner data-icon="inline-start" />
                  ) : (
                    <RefreshCw className="size-4" />
                  )}
                  {fetching
                    ? t("settings.provider.fetchingModels")
                    : t("settings.provider.refreshModels")}
                </Button>
              </div>
              <FieldDescription>
                {t("settings.provider.serviceUrlDesc")}
              </FieldDescription>
              {fetchError && <FieldError errors={[{ message: fetchError }]} />}
            </Field>
          )}
        </form.Field>

        <form.Field name="selected_models">
          {(modelsField) => (
            <Field>
              <FieldLegend>{t("settings.provider.models")}</FieldLegend>
              <FieldDescription>
                {t("settings.provider.modelsDesc")}
              </FieldDescription>
              {allModels.length === 0 ? (
                <FieldDescription>
                  {t("settings.provider.noModelsFetched")}
                </FieldDescription>
              ) : (
                <div className="flex flex-col gap-2">
                  {allModels.map((model) => {
                    const selected = modelsField.state.value ?? [];
                    return (
                      <FieldLabel key={model}>
                        <Field orientation="horizontal">
                          <Checkbox
                            id={model}
                            name={model}
                            checked={selected.includes(model)}
                            onCheckedChange={(checked) => {
                              const next =
                                checked === true
                                  ? [...selected, model]
                                  : selected.filter((m) => m !== model);
                              modelsField.handleChange(next);
                            }}
                          />
                          <FieldContent>
                            <FieldTitle>{model}</FieldTitle>
                          </FieldContent>
                        </Field>
                      </FieldLabel>
                    );
                  })}
                </div>
              )}
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

export default OllamaConfig;
