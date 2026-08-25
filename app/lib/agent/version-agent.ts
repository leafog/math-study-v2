import { generateText, type LanguageModel } from "ai";
import { useChatAgent } from "~/hooks/chat/active-chat";
import { useVisionModel } from "~/store/chat-vision-model";
import { getOrPut } from "../map-utils";
import { useCallback, useMemo } from "react";
import { createLLMs } from "./create-llm/index";
import { getPrompt } from "./instructions";
import type { ProviderId } from "./types";
import { settingModelConfigColl } from "~/db/tdb-collections";

const modelCache = new Map<string, LanguageModel>();

/** 把 Blob 读成 dataURL（`data:<mime>;base64,<...>`）。Ollama 等 provider 需要 base64 字符串，而非 Uint8Array。 */
const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

export const llmPredict = async (blob: Blob): Promise<string> => {
  const visionModel = useVisionModel.getState().visionModel;

  if (!visionModel?.id) return "";
  const config = settingModelConfigColl.get(visionModel.id);
  if (!config) return "";
  // use openai
  const createLLMFC = createLLMs["openai"];
  if (!createLLMFC) return "";
  const model = getOrPut(
    modelCache,
    `${config.id}:${visionModel.model_name}`,
    () => {
      return createLLMFC(
        { apiKey: config.api_key ?? "", baseURL: config.base_url ?? "" },
        visionModel.model_name,
      );
    },
  );
  const dataUrl = await blobToDataUrl(blob);
  const { text } = await generateText({
    model,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            image: dataUrl,
            mediaType: blob.type || "image/png",
          },
          { type: "text", text: getPrompt("ocr.vision") },
        ],
      },
    ],
  });
  return text;
};
