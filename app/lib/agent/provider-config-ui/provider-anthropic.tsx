import type { ModelProviderConfigProps } from "~/lib/agent/types";
import ProviderCommon from "./provider-common";

const AnthropicConfig = ({
  providerId,
  value,
  onChange,
}: ModelProviderConfigProps) => (
  <ProviderCommon
    providerId={providerId}
    name="Anthropic"
    apiKeyUrl="https://console.anthropic.com"
    models={["claude-sonnet-5", "claude-opus-5", "claude-haiku-4-5"]}
    defaultBaseUrl="https://api.anthropic.com/v1"
    value={value}
    onChange={onChange}
  />
);

export default AnthropicConfig;
