import {
  generateText,
  Output,
  type FlexibleSchema,
  type LanguageModel,
} from "ai";
import { useVisionModel } from "~/store/chat-vision-model";
import { getOrPut } from "../map-utils";
import { createLLMs } from "./create-llm/index";
import { getPrompt } from "./instructions";
import { settingModelConfigColl } from "~/db/tdb-collections";
import { createOpenAI, openai } from "@ai-sdk/openai";
import type { LLMConfig } from "./types";

const modelCache = new Map<string, LanguageModel>();

/** 把 Blob 读成 dataURL（`data:<mime>;base64,<...>`）。Ollama 等 provider 需要 base64 字符串，而非 Uint8Array。 */
const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

/** 取当前视觉模型的 LanguageModel 实例（复用缓存）；未配置返回 null */
function getVisionModel(): LanguageModel | null {
  const visionModel = useVisionModel.getState().visionModel;
  if (!visionModel?.id) return null;
  const config = settingModelConfigColl.get(visionModel.id);
  if (!config) return null;
  // use openai

  const createLLMFC = (config: LLMConfig, model: string) => {
    const openai = createOpenAI(config);
    return openai.responses(model);
  };

  if (!createLLMFC) return null;
  return getOrPut(modelCache, `${config.id}:${visionModel.model_name}`, () => {
    return createLLMFC(
      { apiKey: config.api_key ?? "", baseURL: config.base_url ?? "" },
      visionModel.model_name,
    );
  });
}

/**
 * 视觉模型生成纯文本（默认走 ocr.vision 提示词，可覆盖）。
 * 未配置视觉模型时返回空串。
 */
export const llmPredict = async (
  blob: Blob,
  prompt?: string,
): Promise<string> => {
  const model = getVisionModel();
  if (!model) return "";

  const dataUrl = await blobToDataUrl(blob);
  const { text } = await generateText({
    reasoning: "none",
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
          { type: "text", text: prompt ?? getPrompt("ocr.vision") },
        ],
      },
    ],
  });
  return text;
};

/**
 * 视觉模型生成结构化对象（Output.object）：传入 schema 与提示词，返回按 schema 校验后的对象。
 * 用于「按标注编号 → 内容」等需要稳定结构的识别。
 * 未配置视觉模型时返回 null。
 */
export async function llmPredictObject<T>(
  blob: Blob,
  options: { schema: FlexibleSchema<T>; prompt: string },
): Promise<T | null> {
  const model = getVisionModel();
  if (!model) return null;
  const dataUrl = await blobToDataUrl(blob);
  const { output } = await generateText({
    reasoning: "none",
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
          { type: "text", text: options.prompt },
        ],
      },
    ],
    output: Output.object({ schema: options.schema }),
  });
  return output;
}
