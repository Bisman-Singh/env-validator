#!/usr/bin/env node

import * as path from "path";
import chalk from "chalk";
import { loadSchema, parseEnvFile } from "./schema";
import { validate, ValidationResult } from "./validator";

function printUsage(): void {
  console.log(`
${chalk.bold("env-validator")} - Validate .env files against a schema

${chalk.bold("Usage:")}
  env-validator [options]

${chalk.bold("Options:")}
  --env <path>      Path to .env file (default: .env)
  --schema <path>   Path to schema file (default: .env.schema.json)
  --help            Show this help message

${chalk.bold("Example:")}
  env-validator --env .env.production --schema .env.schema.json
`);
}

function formatResult(result: ValidationResult): string {
  const icon = result.valid ? chalk.green("PASS") : chalk.red("FAIL");
  const varName = chalk.bold(result.variable);
  const message = result.valid
    ? chalk.gray(result.message)
    : chalk.red(result.message);
  const typeInfo = result.expected ? chalk.cyan(`[${result.expected}]`) : "";

  return `  ${icon} ${varName} ${typeInfo} ${message}`;
}

function main(): void {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    printUsage();
    process.exit(0);
  }

  let envPath = ".env";
  let schemaPath = ".env.schema.json";

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--env" && args[i + 1]) {
      envPath = args[i + 1];
      i++;
    } else if (args[i] === "--schema" && args[i + 1]) {
      schemaPath = args[i + 1];
      i++;
    }
  }

  console.log(chalk.bold("\n  Environment Variable Validator\n"));
  console.log(chalk.gray(`  Schema: ${path.resolve(schemaPath)}`));
  console.log(chalk.gray(`  Env:    ${path.resolve(envPath)}\n`));

  try {
    const schema = loadSchema(schemaPath);
    const envVars = parseEnvFile(envPath);
    const summary = validate(envVars, schema);

    console.log(chalk.bold("  Results:\n"));

    for (const result of summary.results) {
      console.log(formatResult(result));
    }

    console.log("\n" + chalk.bold("  Summary:"));
    console.log(chalk.gray(`  Total checked: ${summary.totalChecked}`));
    console.log(chalk.green(`  Passed: ${summary.passed}`));
    console.log(
      summary.failed > 0
        ? chalk.red(`  Failed: ${summary.failed}`)
        : chalk.gray(`  Failed: ${summary.failed}`)
    );
    if (summary.warnings > 0) {
      console.log(chalk.yellow(`  Warnings: ${summary.warnings}`));
    }
    console.log("");

    if (summary.failed > 0) {
      console.log(chalk.red.bold("  Validation FAILED\n"));
      process.exit(1);
    } else {
      console.log(chalk.green.bold("  Validation PASSED\n"));
      process.exit(0);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(chalk.red(`\n  Error: ${message}\n`));
    process.exit(1);
  }
}

main();
