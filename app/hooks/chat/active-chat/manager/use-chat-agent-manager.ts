import { useLiveQuery } from "@tanstack/react-db";
import { useCallback, useMemo } from "react";

import { settingModelConfigColl } from "~/db/tdb-collections";
import type { SettingModelConfig } from "~/db/db-zod-schema";
import { modelIconRecord } from "~/lib/agent";
import type { ProviderId } from "~/lib/agent/types";
import { useAgent } from "~/lib/agent/client-agent";

const useChatAgentManager = () => {
  const { data: settings = [] } = useLiveQuery((q) =>
    q
      .from({ settingModelConfigColl })
      .orderBy(
        ({ settingModelConfigColl }) => settingModelConfigColl.created_at,
        {
          direction: "desc",
        },
      ),
  );

  const getConfigById = useCallback(
    (id: string | undefined) => {
      return settings.find((it) => it.id === id);
    },
    [settings],
  );

  const validProviders = useMemo(
    () =>
      settings
        .map((it) => ({
          provider: modelIconRecord[it.provider_id as ProviderId],
          ...it,
        }))
        .filter((it) => it.provider !== undefined),
    [settings],
  );

  const currentProviders = useMemo(
    () => validProviders.filter((it) => (it.selected_models ?? []).length > 0),
    [validProviders],
  );

  const hasConfig = settings.length > 0;
  const hasSameName = (name: string) =>
    settings.some((s) => s.config_name === name);

  const insertConfig = (
    config: Omit<SettingModelConfig, "created_at" | "updated_at">,
  ) => {
    settingModelConfigColl.insert({
      ...config,
      created_at: new Date(),
      updated_at: new Date(),
    });
  };

  const updateConfig = (
    id: string,
    config: Omit<SettingModelConfig, "created_at" | "updated_at">,
  ) => {
    settingModelConfigColl.update(id, (draft) => {
      Object.assign(draft, config, { updated_at: new Date() });
    });
  };

  const deleteConfig = (id: string) => {
    settingModelConfigColl.delete(id);
  };

  return {
    settings,
    validProviders,
    hasConfig,
    hasSameName,
    insertConfig,
    updateConfig,
    deleteConfig,
    currentProviders,
    getConfigById,
  };
};

export default useChatAgentManager;
