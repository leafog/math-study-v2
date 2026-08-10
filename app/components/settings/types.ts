import type { FC } from "react";
import type { IconAvatarProps, IconType } from "@lobehub/icons";
import type { SettingModelConfig } from "~/db/db-zod-schema";

export type AvatarComponent = FC<Omit<IconAvatarProps, "Icon">>;

/** Form-managed subset of SettingModelConfig — single source of truth */
export type ProviderConfigValue = Omit<
  SettingModelConfig,
  "id" | "provider_id" | "extra" | "created_at" | "updated_at"
>;

export interface ModelProviderConfigProps {
  providerId: string;
  value?: ProviderConfigValue;
  onChange?: (value: ProviderConfigValue) => void;
}

export interface ModelProvider {
  id: string;
  name: string;
  avatar: AvatarComponent;
  text: IconType;
  description: string;
  Config: FC<ModelProviderConfigProps>;
}

export type ProviderConfigDefinition = {
  id: string;
  Config: FC<ModelProviderConfigProps>;
};
