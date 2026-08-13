import { createBrowserAI, doesBrowserSupportBrowserAI } from "@browser-ai/core";
import type { TestLLMConnectFC } from "../types";

const testLLMConnectBrowser: TestLLMConnectFC = async (
  _config,
  _model,
  onProgress,
) => {
  if (!doesBrowserSupportBrowserAI()) {
    return { ok: false, supported: false };
  }

  const model = createBrowserAI().chat("text");
  const availability = await model.availability();

  if (availability === "available") {
    return { ok: true, availability };
  }

  if (availability === "unavailable") {
    return { ok: false, availability };
  }

  return { ok: true, availability };
};

export default testLLMConnectBrowser;
