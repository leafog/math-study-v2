import { useLiveQuery } from "@tanstack/react-db";

import { settingModelConfigColl } from "~/db/tdb-collections";
import type { SettingModelConfig } from "~/db/db-zod-schema";

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

  return { settings, hasConfig, hasSameName, insertConfig, updateConfig };
};

export default useChatAgentManager;
