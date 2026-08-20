/**
 * 把文本包装成 HTML 注释：模型可见、界面不渲染。
 *
 * 转义 `--` 为 `- -`，防止内容里出现注释闭合符，意外结束注释。
 * 也把内容中的 `-->` 一起兜住，避免提前闭合外层注释。
 */
export const toHtmlComment = (content: string): string => {
  // 先转义闭合符 `-->`，再转义注释边界 `--`，顺序很重要
  const escaped = content.replaceAll("-->", "- - >").replaceAll("--", "- -");
  return `<!-- ${escaped} -->`;
};

/**
 * 带标签的注释：首行是标签（如 `practice-problem 1`），后续字段以 JSON 输出。
 * 例子：`toLabelledComment("practice-problem 1", { id, description, content })`
 */
export const toLabelledComment = <T>(
  label: string,
  fields: T,
): string => {
  const body = JSON.stringify(fields ?? {}, null, 2);
  return toHtmlComment(`${label}\n${body}`);
};
