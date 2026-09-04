import type { ModelProviderConfigProps } from "~/lib/agent/types";
import ProviderCommon from "./provider-common";

const DeepSeekConfig = ({
  providerId,
  value,
  onChange,
}: ModelProviderConfigProps) => (
  <ProviderCommon
    providerId={providerId}
    name="DeepSeek"
    apiKeyUrl="https://platform.deepseek.com/api_keys"
    models={[
      "deepseek-v4-flash",
      "deepseek-v4-pro",
      "deepseek-v4-flash-vision-exp",
    ]}
    defaultBaseUrl="https://api.deepseek.com/v1"
    value={value}
    onChange={onChange}
  />
);

export default DeepSeekConfig;
