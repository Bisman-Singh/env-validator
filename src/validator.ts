import { EnvSchema, SchemaField, FieldType } from "./schema";

export interface ValidationResult {
  variable: string;
  valid: boolean;
  message: string;
  value?: string;
  expected?: string;
}

export interface ValidationSummary {
  results: ValidationResult[];
  totalChecked: number;
  passed: number;
  failed: number;
  warnings: number;
}

const URL_REGEX = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateType(value: string, type: FieldType): { valid: boolean; message: string } {
  switch (type) {
    case "string":
      return { valid: true, message: "Valid string" };

    case "number": {
      const num = Number(value);
      if (isNaN(num)) {
        return { valid: false, message: `Expected a number, got "${value}"` };
      }
      return { valid: true, message: "Valid number" };
    }

    case "boolean": {
      const lower = value.toLowerCase();
      if (["true", "false", "1", "0", "yes", "no"].includes(lower)) {
        return { valid: true, message: "Valid boolean" };
      }
      return {
        valid: false,
        message: `Expected a boolean (true/false/1/0/yes/no), got "${value}"`,
      };
    }

    case "url": {
      if (URL_REGEX.test(value)) {
        return { valid: true, message: "Valid URL" };
      }
      return { valid: false, message: `Expected a valid URL, got "${value}"` };
    }

    case "email": {
      if (EMAIL_REGEX.test(value)) {
        return { valid: true, message: "Valid email" };
      }
      return { valid: false, message: `Expected a valid email, got "${value}"` };
    }

    default:
      return { valid: false, message: `Unknown type: ${type}` };
  }
}

function validatePattern(value: string, pattern: string): { valid: boolean; message: string } {
  try {
    const regex = new RegExp(pattern);
    if (regex.test(value)) {
      return { valid: true, message: "Matches pattern" };
    }
    return { valid: false, message: `Value "${value}" does not match pattern /${pattern}/` };
  } catch {
    return { valid: false, message: `Invalid regex pattern: ${pattern}` };
  }
}

export function validate(
  envVars: Record<string, string>,
  schema: EnvSchema
): ValidationSummary {
  const results: ValidationResult[] = [];
  let passed = 0;
  let failed = 0;
  let warnings = 0;

  for (const [varName, fieldSchema] of Object.entries(schema)) {
    const value = envVars[varName];
    const isRequired = fieldSchema.required !== false;

    if (value === undefined || value === "") {
      if (isRequired) {
        if (fieldSchema.default !== undefined) {
          results.push({
            variable: varName,
            valid: true,
            message: `Missing but has default value: "${fieldSchema.default}"`,
            expected: fieldSchema.type,
          });
          passed++;
          warnings++;
        } else {
          results.push({
            variable: varName,
            valid: false,
            message: "Required variable is missing",
            expected: fieldSchema.type,
          });
          failed++;
        }
      } else {
        results.push({
          variable: varName,
          valid: true,
          message: "Optional variable not set (OK)",
          expected: fieldSchema.type,
        });
        passed++;
      }
      continue;
    }

    const typeResult = validateType(value, fieldSchema.type);

    if (!typeResult.valid) {
      results.push({
        variable: varName,
        valid: false,
        message: typeResult.message,
        value,
        expected: fieldSchema.type,
      });
      failed++;
      continue;
    }

    if (fieldSchema.pattern) {
      const patternResult = validatePattern(value, fieldSchema.pattern);
      if (!patternResult.valid) {
        results.push({
          variable: varName,
          valid: false,
          message: patternResult.message,
          value,
          expected: fieldSchema.type,
        });
        failed++;
        continue;
      }
    }

    results.push({
      variable: varName,
      valid: true,
      message: typeResult.message,
      value,
      expected: fieldSchema.type,
    });
    passed++;
  }

  const extraVars = Object.keys(envVars).filter((key) => !(key in schema));
  for (const varName of extraVars) {
    results.push({
      variable: varName,
      valid: true,
      message: "Not in schema (extra variable)",
      value: envVars[varName],
    });
    warnings++;
  }

  return {
    results,
    totalChecked: Object.keys(schema).length,
    passed,
    failed,
    warnings,
  };
}
