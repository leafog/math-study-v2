import type { ModelProviderConfigProps } from "../types";
import ProviderCommon from "./provider-common";

const KimiConfig = ({ providerId, value, onChange }: ModelProviderConfigProps) => (
  <ProviderCommon
    providerId={providerId}
    name="Kimi"
    apiKeyUrl="https://platform.moonshot.cn/console/api-keys"
    models={["moonshot-v1-auto"]}
    defaultBaseUrl="https://api.moonshot.cn/v1"
    value={value}
    onChange={onChange}
  />
);

export default KimiConfig;
