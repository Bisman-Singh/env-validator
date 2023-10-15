import * as fs from "fs";
import * as path from "path";

export type FieldType = "string" | "number" | "boolean" | "url" | "email";

export interface SchemaField {
  type: FieldType;
  required?: boolean;
  description?: string;
  default?: string;
  pattern?: string;
}

export interface EnvSchema {
  [key: string]: SchemaField;
}

export function loadSchema(schemaPath: string): EnvSchema {
  const absolutePath = path.resolve(schemaPath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Schema file not found: ${absolutePath}`);
  }

  const raw = fs.readFileSync(absolutePath, "utf-8");

  try {
    const parsed = JSON.parse(raw);
    validateSchemaStructure(parsed);
    return parsed as EnvSchema;
  } catch (err) {
    if (err instanceof SyntaxError) {
      throw new Error(`Invalid JSON in schema file: ${err.message}`);
    }
    throw err;
  }
}

function validateSchemaStructure(schema: unknown): void {
  if (typeof schema !== "object" || schema === null || Array.isArray(schema)) {
    throw new Error("Schema must be a JSON object with variable names as keys");
  }

  const validTypes: FieldType[] = ["string", "number", "boolean", "url", "email"];

  for (const [key, value] of Object.entries(schema)) {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      throw new Error(`Schema field "${key}" must be an object`);
    }

    const field = value as Record<string, unknown>;

    if (!field.type || typeof field.type !== "string") {
      throw new Error(`Schema field "${key}" must have a "type" property`);
    }

    if (!validTypes.includes(field.type as FieldType)) {
      throw new Error(
        `Schema field "${key}" has invalid type "${field.type}". Valid types: ${validTypes.join(", ")}`
      );
    }
  }
}

export function parseEnvFile(envPath: string): Record<string, string> {
  const absolutePath = path.resolve(envPath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Env file not found: ${absolutePath}`);
  }

  const raw = fs.readFileSync(absolutePath, "utf-8");
  const result: Record<string, string> = {};

  const lines = raw.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) {
      continue;
    }

    const key = trimmed.substring(0, eqIndex).trim();
    let value = trimmed.substring(eqIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    result[key] = value;
  }

  return result;
}
