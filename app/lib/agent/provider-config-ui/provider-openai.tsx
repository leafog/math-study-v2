import type { ModelProviderConfigProps } from "~/lib/agent/types";
import ProviderCommon from "./provider-common";

const OpenAIConfig = ({ providerId, value, onChange }: ModelProviderConfigProps) => (
  <ProviderCommon
    providerId={providerId}
    name="OpenAI"
    apiKeyUrl="https://platform.openai.com/api-keys"
    models={["gpt-4o", "gpt-4o-mini"]}
    defaultBaseUrl="https://api.openai.com/v1"
    value={value}
    onChange={onChange}
  />
);

export default OpenAIConfig;
