import { generateText, type LanguageModel } from "ai";
import { useChatAgent } from "~/hooks/chat/active-chat";
import { useVisionModel } from "~/store/chat-vision-model";
import { getOrPut } from "../map-utils";
import { useCallback, useMemo } from "react";
import { createLLMs } from "./create-llm/index";
import type { ProviderId } from "./types";

const modelCache = new Map<string, LanguageModel>();

/** 把 Blob 读成 dataURL（`data:<mime>;base64,<...>`）。Ollama 等 provider 需要 base64 字符串，而非 Uint8Array。 */
const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

/**
 * 视觉模型 OCR：把图片识别成 Markdown。
 * 输出契约与项目现有 OCR 链路一致 —— 数学表达式用 $$...$$ 包裹。
 */
const OCR_PROMPT = `你是 OCR 引擎。识别图片中的数学内容并转为 Markdown。
规则：
- 保留原有段落与公式结构
- 数学表达式一律用 $$...$$ 包裹（行内用 $...$）
- 只输出识别结果，不要解释`;

const useVersion = () => {
  const { getConfigById } = useChatAgent();
  const visionModel = useVisionModel.use.visionModel();
  const config = getConfigById(visionModel?.id);
  const model = useMemo(() => {
    console.log("sss");
    if (!config) return;
    console.log(config, "sss");
    if (!visionModel) return;
    console.log(visionModel, "sss");
    const createLLMFC = createLLMs[config.provider_id as ProviderId];
    console.log(createLLMFC, "sss");
    if (!createLLMFC) return;

    return getOrPut(
      modelCache,
      `${config.id}:${visionModel.model_name}`,
      () => {
        return createLLMFC(
          { apiKey: config.api_key ?? "", baseURL: config.base_url ?? "" },
          visionModel.model_name,
        );
      },
    );
  }, [config, visionModel]);

  /**
   * 识别单张图片，返回 Markdown。
   * 模型未就绪时抛错，调用方自行降级（如回退到本地 PaddleOCR）。
   */
  const predict = useCallback(
    async (blob: Blob): Promise<string> => {
      if (!model) {
        throw new Error("vision model not ready");
      }
      const dataUrl = await blobToDataUrl(blob);
      const { text } = await generateText({
        model,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "file",
                data: dataUrl,
                mediaType: blob.type || "image/png",
              },
              { type: "text", text: OCR_PROMPT },
            ],
          },
        ],
      });
      return text;
    },
    [model],
  );

  return { model, predict };
};

export default useVersion;
