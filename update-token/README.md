# Token Color Update Script

> [!NOTE]
> The use of this script is entend for use after adding or taking away tokens from the cisco.tmLanuage.json, and then updating textMateRules.json with the reflective changes. It is done this way, because a color for the token in textMateRules.json still needs to be seleceted.

## Overview

`update-token-colors.py` automates the synchronization of token colors across the extension's configuration files. It ensures **textMateRules.json is the single source of truth** for all managed token scopes and their colors.

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
   - Sorted alphabetically by scope for consistency
   - Used by both the extension (`registerTokenColors.ts`) and other tooling
   - Eliminates brittle regex parsing of source code

3. **Updates package.json**
   - Adds/maintains color configuration properties in `cisco-config-highlight.colors`
   - Properties are sorted alphabetically for consistent ordering
   - Each property corresponds to a scope mapping
   - Users can override colors via VS Code settings
   - Removes obsolete entries that no longer exist in textMateRules.json

4. **Updates package.nls.json**
   - Adds English descriptions for all color configuration keys
   - Descriptions reference the TextMate scope for clarity
   - New entries are inserted into appropriate categorized sections (_comment_colors_\*)
   - Maintains formatting and section organization
   - Removes obsolete entries

5. **Updates package.nls.ja.json**
   - Adds Japanese placeholder descriptions
   - Organized by category for easier translation
   - Removes obsolete entries
   - User should provide proper Japanese translations

## Usage

### Preview Changes (Dry Run)

```bash
python update-token/update-token-colors.py --dry-run
```

Shows what would be updated without modifying files:

- Number of mappings to be generated
- Sample mappings (first 5)
- Keys to add/update/remove in NLS files
- List of files that would be changed

### Apply Changes

```bash
python update-token/update-token-colors.py
```

Updates all files in place:

- `config/scopeMappings.json` — regenerated from textMateRules.json
- `package.json` — color properties added/updated (alphabetically sorted)
- `package.nls.json` — English descriptions added (categorized by section)
- `package.nls.ja.json` — Japanese placeholders added (categorized by section)

## Workflow Example

### 1. Add a new color to textMateRules.json

```json
{
  "scope": "keyword.other.address.ipv6.condensed",
  "settings": {
    "foreground": "#2e74b5"
  }
}
```

### 2. Run the script

```bash
python update-token/update-token-colors.py --dry-run
# Review changes...

python update-token/update-token-colors.py
# Apply changes
```

### 3. Verify

- `config/scopeMappings.json` now includes: `{ "configKey": "address.ipv6.condensed", "scope": "keyword.other.address.ipv6.condensed" }`
- `package.json` has a new property (alphabetically sorted): `"address.ipv6.condensed": { "type": "string", "format": "color", ... }`
- `package.nls.json` has the entry in the Addresses section: `"configuration.properties.colors.address.ipv6.condensed.description": "keyword.other.address.ipv6.condensed"`
- `package.nls.ja.json` has a placeholder in the Addresses section for translation

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
| `keyword.other.address.ipv6.condensed`   | →   | `address.ipv6.condensed` |
| `meta.function-call.arp-insp-val`        | →   | `arp-insp-val`           |

If a mapping already exists in `config/scopeMappings.json`, the existing config key is preserved unless the file is deleted and regenerated.

## NLS File Organization

The script automatically categorizes new entries into appropriate sections in the NLS files based on the config key prefix:

- `address.*` → `_comment_colors_addresses`
- `interface.*` → `_comment_colors_interfaces`
- `keyword.*` → `_comment_colors_keywords`
- `group.*` → `_comment_colors_groups`
- `acl.*` → `_comment_colors_acl`
- `crypto.*` → `_comment_colors_crypto`
- And more...

New entries are inserted at the end of their respective sections, preserving formatting and blank line separation between sections.

## Key Features

- **Idempotent**: Running multiple times produces the same result
- **Smart Categorization**: Automatically places entries in correct NLS sections
- **Cleanup**: Removes obsolete entries that no longer exist in textMateRules.json
- **Formatting**: Preserves JSON formatting and structure in NLS files
- **Alphabetical Sorting**: Maintains consistent ordering in package.json and scopeMappings.json
- **Dry Run**: Preview changes before applying them

## Key Files

- **Source of Truth:** `syntaxes/textMateRules.json`
- **Mapping Registry:** `config/scopeMappings.json`
- **Extension Config Schema:** `package.json` (`contributes.configuration[0].properties`)
- **English Localization:** `package.nls.json` (categorized by `_comment_colors_*` sections)
- **Japanese Localization:** `package.nls.ja.json` (categorized by `_comment_colors_*` sections)
- **Extension Logic:** `src/registerTokenColors.ts` (reads `config/scopeMappings.json`)

## Notes

- The script is **idempotent**; running it multiple times produces the same result.
- Existing config keys in `scopeMappings.json` are preserved unless the file is deleted and regenerated from scratch.
- Japanese descriptions are auto-generated placeholders; provide proper translations before publishing.
- After running the script, rebuild the extension: `npm run compile`
- The script requires Python 3.6+ to run.
