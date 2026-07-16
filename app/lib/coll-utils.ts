import { without } from "lodash-es";

export function moveToEnd<T>(list: T[], value: T) {
  return [...without(list, value), value];
}
