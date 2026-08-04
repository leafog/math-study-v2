import { z } from "zod";
import {
  column,
  PowerSyncDatabase,
  Schema,
  Table,
  AttachmentTable,
} from "@powersync/web";

import * as S from "./db-zod-schema";
import { camelCase, mapKeys, mapValues } from "lodash-es";

function unwrapZod(type: any): any {
  let current = type;
  while (true) {
    if (current instanceof z.ZodOptional || current instanceof z.ZodNullable) {
      current = current.unwrap();
      continue;
    }

    if (current instanceof z.ZodDefault) {
      current = current.removeDefault();
      continue;
    }

    if (current instanceof z.ZodCatch) {
      current = current._def.innerType;
      continue;
    }

    if (current instanceof z.ZodReadonly) {
      current = current.unwrap();
      continue;
    }

    break;
  }

  return current;
}

// ============================================================
// Zod -> PowerSync column
// ============================================================

function getColumnType(schema: any): any {
  const type = unwrapZod(schema);

  /**
   * string
   */
  if (type instanceof z.ZodString) {
    return column.text;
  }

  /**
   * number
   *
   * int -> INTEGER
   * float -> REAL
   */
  if (type instanceof z.ZodNumber) {
    const checks = type._def.checks ?? [];

    const isInteger = checks.some((c: any) => c.kind === "int");

    return isInteger ? column.integer : column.real;
  }

  /**
   * boolean
   *
   * sqlite no boolean
   * use 0 / 1
   */
  if (type instanceof z.ZodBoolean) {
    return column.integer;
  }

  /**
   * Date
   *
   * ISO string
   */
  if (type instanceof z.ZodDate) {
    return column.text;
  }

  /**
   * enum
   */
  if (type instanceof z.ZodEnum) {
    return column.text;
  }

  /**
   * literal
   */
  if (type instanceof z.ZodLiteral) {
    const value = type.value;

    if (typeof value === "number") {
      return Number.isInteger(value) ? column.integer : column.real;
    }

    return column.text;
  }

  /**
   * union
   *
   * enum number:
   *
   * 1 | 2 | 3
   *
   * => INTEGER
   */
  if (type instanceof z.ZodUnion) {
    const options = type.options;

    const integerLiteral =
      options.length > 0 &&
      options.every(
        (x) =>
          x instanceof z.ZodLiteral &&
          typeof x.value === "number" &&
          Number.isInteger(x.value),
      );

    return integerLiteral ? column.integer : column.text;
  }

  /**
   * JSON
   */
  if (
    type instanceof z.ZodArray ||
    type instanceof z.ZodObject ||
    type instanceof z.ZodRecord ||
    type instanceof z.ZodTuple ||
    type instanceof z.ZodMap ||
    type instanceof z.ZodSet
  ) {
    return column.text;
  }

  /**
   * fallback
   */
  return column.text;
}

// ============================================================
// Zod object -> PowerSync Table
// ============================================================

export function toTable(schema: any) {
  const columns: Record<string, any> = {};

  for (const [key, value] of Object.entries(schema.shape)) {
    const columnName = key;
    columns[columnName] = getColumnType(value);
  }

  return new Table(columns);
}

/** 将 S 中所有 *Schema 导出，去掉 Schema 后缀并 camelCase 作为 key */
type ExtractSchemaMap<T> = {
  [
    K in keyof T as K extends `${infer Base}Schema` ? Uncapitalize<Base> : never
  ]: T[K];
};

export type SchemaMap = ExtractSchemaMap<typeof S>;

export const schemas: SchemaMap = mapKeys(S, (_, key) => {
  return camelCase(key.replace("Schema", ""));
}) as unknown as SchemaMap;

export type TableMap = { [K in keyof SchemaMap]: Table };

export const tables: TableMap = mapValues(schemas, (value, key) => {
  if (key === "attachment") return new AttachmentTable();
  return toTable(value);
}) as unknown as TableMap;

export const AppSchema = new Schema(tables);

export const db = new PowerSyncDatabase({
  database: {
    dbFilename: "math-study-v2.db",
  },
  schema: AppSchema,
});

export const initDb = async () => {
  await db._initialize();
};
