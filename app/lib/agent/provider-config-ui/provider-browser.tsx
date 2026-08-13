import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircleIcon, XCircleIcon } from "lucide-react";
import type { ModelProviderConfigProps } from "~/lib/agent/types";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "~/components/ui/field";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Progress } from "~/components/ui/progress";
import { Spinner } from "~/components/ui/spinner";
import { useBoolean } from "usehooks-ts";
import { testLLMConnectRecord } from "../test-llm-connect";

const BrowserConfig = ({
  providerId,
  value,
  onChange,
}: ModelProviderConfigProps) => {
  const { t } = useTranslation();
  const [configName, setConfigName] = useState(value?.config_name ?? "");
  const {
    value: testing,
    setTrue: startTest,
    setFalse: endTest,
  } = useBoolean(false);
  const { value: testSuccess, setValue: setTestSuccess } = useBoolean(false);
  const [hasTested, setHasTested] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);

  const testFn = testLLMConnectRecord[providerId];

  const handleSave = () => {
    onChange?.({
      config_name: configName.trim() || undefined,
      api_key: "",
      base_url: "",
      all_models: ["text"],
      selected_models: ["text"],
    });
  };

  const handleTest = async () => {
    if (!testFn) return;
    startTest();
    setProgress(null);
    try {
      const result = await testFn({ apiKey: "", baseUrl: "" }, "text", (p) =>
        setProgress(p),
      );

      setTestSuccess(result.ok);
      setHasTested(true);
    } catch {
      setTestSuccess(false);
      setHasTested(true);
    } finally {
      endTest();
      setProgress(null);
    }
  };

  const downloading = testing && progress != null;
  const percent = Math.round((progress ?? 0) * 100);

  return (
    <div className="m-4">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="browser-config-name">
            {t("settings.provider.configName")}
          </FieldLabel>
          <div className="flex items-center gap-1">
            <Input
              id="browser-config-name"
              className="flex-1"
              placeholder={t("settings.provider.configNamePlaceholder")}
              value={configName}
              onChange={(e) => setConfigName(e.target.value)}
            />
            <Button
              size="default"
              variant="outline"
              disabled={testing}
              onClick={handleTest}
            >
              {testing && !downloading && <Spinner data-icon="inline-start" />}
              {downloading
                ? `${percent}%`
                : testing
                  ? t("settings.provider.testing")
                  : t("settings.provider.test")}
            </Button>
            {hasTested &&
              !testing &&
              (testSuccess ? (
                <CheckCircleIcon className="size-4 text-green-500" />
              ) : (
                <XCircleIcon className="size-4 text-destructive" />
              ))}
          </div>
          {downloading && (
            <div className="mt-2">
              <Progress value={percent} />
              <FieldDescription className="mt-1">
                {t("settings.provider.downloadingModel")}
              </FieldDescription>
            </div>
          )}
          {!downloading && (
            <FieldDescription>
              {t("settings.provider.browserNoKeyNeeded")}
            </FieldDescription>
          )}
        </Field>
        <Button type="button" onClick={handleSave}>
          {t("common.save")}
        </Button>
      </FieldGroup>
    </div>
  );
};

export default BrowserConfig;
