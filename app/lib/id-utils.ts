import { nanoid } from "nanoid";

/**
 * 生成唯一 ID。
 * 当前使用 nanoid，未来可能改为 uuid 或其他方案。
 * 业务代码统一从这里获取 ID，不要直接依赖 nanoid / uuid。
 */
export const genId = () => nanoid();

/**
 * 生成字符串的短 hash（cyrb53，返回 base36）。
 * 用于把长 key（如 apiKey + baseUrl + language）压缩成短缓存键。
 */
export const hashString = (str: string, seed = 0): string => {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
};
