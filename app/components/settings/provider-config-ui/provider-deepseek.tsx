import type { ModelProviderConfigProps } from "../types";
import ProviderCommon from "./provider-common";

const DeepSeekConfig = ({ providerId, value, onChange }: ModelProviderConfigProps) => (
  <ProviderCommon
    providerId={providerId}
    name="DeepSeek"
    apiKeyUrl="https://platform.deepseek.com/api_keys"
    models={["deepseek-chat", "deepseek-coder", "deepseek-v3"]}
    defaultBaseUrl="https://api.deepseek.com/v1"
    value={value}
    onChange={onChange}
  />
);

export default DeepSeekConfig;
