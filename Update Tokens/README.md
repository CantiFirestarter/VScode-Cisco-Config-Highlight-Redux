# Token Color Update Script

## Overview

`update-token-colors.js` automates the synchronization of token colors across the extension's configuration files. It ensures **textMateRules.json is the single source of truth** for all managed token scopes and their colors.

## How It Works

### Single Source of Truth: textMateRules.json

`syntaxes/textMateRules.json` contains all TextMate scope definitions and their default colors. This is the authoritative source for:

- Which scopes are managed by the extension
- What colors those scopes should have

### The Flow

When you run the script, it:

1. **Reads textMateRules.json**
   - Extracts all scopes and their foreground colors
   - Maps each scope to a generated or existing config key

2. **Updates config/scopeMappings.json**
   - Stores the mapping of `configKey` ↔ `scope`
   - Used by both the extension (`registerTokenColors.ts`) and other tooling
   - Eliminates brittle regex parsing of source code

3. **Updates package.json**
   - Adds/maintains color configuration properties in `cisco-config-highlight.colors`
   - Each property corresponds to a scope mapping
   - Users can override colors via VS Code settings

4. **Updates package.nls.json**
   - Adds English descriptions for all color configuration keys
   - Descriptions reference the TextMate scope for clarity

5. **Updates package.nls.ja.json**
   - Adds Japanese placeholder descriptions
   - User should provide proper Japanese translations

## Usage

### Preview Changes (Dry Run)

```bash
node scripts/update-token-colors.js --dry-run
```

Shows what would be updated without modifying files:

- Number of mappings to be generated
- Sample mappings
- List of files that would be changed

### Apply Changes

```bash
node scripts/update-token-colors.js
```

Updates all files in place:

- `config/scopeMappings.json` — regenerated from textMateRules.json
- `package.json` — color properties added/updated
- `package.nls.json` — English descriptions added
- `package.nls.ja.json` — Japanese placeholders added

## Workflow Example

### 1. Add a new color to textMateRules.json

```json
{
  "scope": "my.new.scope",
  "settings": {
    "foreground": "#FF8C00"
  }
}
```

### 2. Run the script

```bash
node scripts/update-token-colors.js --dry-run
# Review changes...

node scripts/update-token-colors.js
# Apply changes
```

### 3. Verify

- `config/scopeMappings.json` now includes: `{ "configKey": "my.new", "scope": "my.new.scope" }`
- `package.json` has a new property: `"my.new": { "type": "string", "format": "color", ... }`
- `package.nls.json` has: `"configuration.properties.colors.my.new.description": "my.new.scope"`
- `package.nls.ja.json` has a placeholder for translation

### 4. Update package.nls.ja.json with proper translation

Replace the placeholder with an appropriate Japanese description.

### 5. Rebuild and test

```bash
npm run compile
```

## Config Key Generation

The script automatically infers config keys from scopes by removing common prefixes:

| Scope                                    | →   | Config Key               |
| ---------------------------------------- | --- | ------------------------ |
| `comment.block.banner`                   | →   | `comment.banner`         |
| `entity.name.tag.crypto.crypto-map.name` | →   | `crypto.crypto-map.name` |
| `keyword.other.acl.protocol`             | →   | `acl.protocol`           |
| `meta.function-call.arp-insp-val`        | →   | `arp-insp-val`           |

If a mapping already exists in `config/scopeMappings.json`, the existing config key is preserved.

## Key Files

- **Source of Truth:** `syntaxes/textMateRules.json`
- **Mapping Registry:** `config/scopeMappings.json`
- **Extension Config Schema:** `package.json` (`contributes.configuration[0].properties`)
- **English Localization:** `package.nls.json`
- **Japanese Localization:** `package.nls.ja.json`
- **Extension Logic:** `src/registerTokenColors.ts` (reads `config/scopeMappings.json`)

## Notes

- The script is **idempotent**; running it multiple times produces the same result.
- Existing config keys in `scopeMappings.json` are preserved unless their scope no longer exists in textMateRules.json.
- Japanese descriptions are auto-generated placeholders; provide proper translations before publishing.
- After running the script, rebuild the extension: `npm run compile`
