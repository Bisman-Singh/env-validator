# env-validator

A CLI tool that validates `.env` files against a JSON schema definition.

## Features

- Validates environment variables against a `.env.schema.json` file
- Supports types: `string`, `number`, `boolean`, `url`, `email`
- Supports required and optional fields with default values
- Pattern matching via regex
- Colorful terminal output showing pass/fail per variable
- Detects extra variables not defined in the schema
- Exit code 1 on validation failure for CI/CD integration

## Installation

```bash
npm install
npm run build
```

## Usage

Create a `.env.schema.json` file:

```json
{
  "DATABASE_URL": {
    "type": "url",
    "required": true,
    "description": "PostgreSQL connection string"
  },
  "PORT": {
    "type": "number",
    "required": false,
    "default": "3000"
  },
  "DEBUG": {
    "type": "boolean",
    "required": false
  },
  "ADMIN_EMAIL": {
    "type": "email",
    "required": true
  }
}
```

Run the validator:

```bash
# Using defaults (.env and .env.schema.json)
npx env-validator

# Specify files
npx env-validator --env .env.production --schema my-schema.json
```

## Schema Field Options

| Property      | Type    | Description                          |
|---------------|---------|--------------------------------------|
| `type`        | string  | One of: string, number, boolean, url, email |
| `required`    | boolean | Whether the variable must be set (default: true) |
| `description` | string  | Human-readable description           |
| `default`     | string  | Default value if not set             |
| `pattern`     | string  | Regex pattern to validate against    |


