import { nanoid } from "nanoid";

/**
 * 生成唯一 ID。
 * 当前使用 nanoid，未来可能改为 uuid 或其他方案。
 * 业务代码统一从这里获取 ID，不要直接依赖 nanoid / uuid。
 */
export const genId = () => nanoid();
