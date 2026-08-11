import type { ModelProviderConfigProps } from "~/lib/agent/types";
import ProviderCommon from "./provider-common";

const GeminiConfig = ({ providerId, value, onChange }: ModelProviderConfigProps) => (
  <ProviderCommon
    providerId={providerId}
    name="Gemini"
    apiKeyUrl="https://aistudio.google.com/apikey"
    models={["gemini-2.0-flash", "gemini-2.0-pro"]}
    defaultBaseUrl="https://generativelanguage.googleapis.com/v1beta"
    value={value}
    onChange={onChange}
  />
);

export default GeminiConfig;
