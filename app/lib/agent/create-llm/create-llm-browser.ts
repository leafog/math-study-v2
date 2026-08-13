import type { CreateLLMFC } from "../types";
import { createBrowserAI } from "@browser-ai/core";

const createLLMBrowser: CreateLLMFC = () => {
  const browser = createBrowserAI();
  return browser.chat("text");
};

export default createLLMBrowser;
