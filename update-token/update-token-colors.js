#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const [, , ...args] = process.argv;
const dryRun = args.includes('--dry-run');

const repoRoot = path.resolve(__dirname, '..');
const textMateRulesPath = path.join(repoRoot, 'syntaxes', 'textMateRules.json');
const scopeMappingsPath = path.join(repoRoot, 'config', 'scopeMappings.json');
const packageJsonPath = path.join(repoRoot, 'package.json');
const packageNlsPath = path.join(repoRoot, 'package.nls.json');
const packageNlsJaPath = path.join(repoRoot, 'package.nls.ja.json');

function readJsonFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(content);
}

function writeJsonFile(filePath, data) {
  const content = JSON.stringify(data, null, 2) + '\n';
  fs.writeFileSync(filePath, content, 'utf8');
}

function removeOrderedWrite(filePath, keysToRemove) {
  const originalContent = fs.readFileSync(filePath, 'utf8');
  const lines = originalContent.split('\n');
  const removeSet = new Set(keysToRemove);

  // Filter out lines that match keys to remove
  let filteredLines = lines.filter(line => {
    const match = line.match(/^\s*"([^"]+)":\s*/);
    if (match && removeSet.has(match[1])) {
      return false; // Remove this line
    }
    return true;
  });

  // Clean up multiple blank lines
  const cleanedLines = [];
  let lastWasBlank = false;
  filteredLines.forEach(line => {
    const isBlank = line.trim() === '';
    if (isBlank && lastWasBlank) {
      // Skip consecutive blank lines
      return;
    }
    cleanedLines.push(line);
    lastWasBlank = isBlank;
  });

  fs.writeFileSync(filePath, cleanedLines.join('\n'), 'utf8');
}

function removeOrderedWrite(filePath, keysToRemove) {
  const originalContent = fs.readFileSync(filePath, 'utf8');
  const lines = originalContent.split('\n');
  const removeSet = new Set(keysToRemove);

  // Filter out lines that match keys to remove
  let filteredLines = lines.filter(line => {
    const match = line.match(/^\s*"([^"]+)":\s*/);
    if (match && removeSet.has(match[1])) {
      return false; // Remove this line
    }
    return true;
  });

  // Clean up multiple blank lines
  const cleanedLines = [];
  let lastWasBlank = false;
  filteredLines.forEach(line => {
    const isBlank = line.trim() === '';
    if (isBlank && lastWasBlank) {
      // Skip consecutive blank lines
      return;
    }
    cleanedLines.push(line);
    lastWasBlank = isBlank;
  });

  fs.writeFileSync(filePath, cleanedLines.join('\n'), 'utf8');
}

function preserveOrderedWrite(filePath, newKeys) {
  // Read original file to preserve key order and spacing
  const originalContent = fs.readFileSync(filePath, 'utf8');
  const lines = originalContent.split('\n');

  // Find insertion point (before closing brace)
  let insertIndex = lines.length - 1;
  while (insertIndex > 0 && !lines[insertIndex].trim().startsWith('}')) {
    insertIndex--;
  }

  // Find the last non-comment, non-brace line before insertion point
  let lastKeyIndex = insertIndex - 1;
  while (
    lastKeyIndex > 0 &&
    (lines[lastKeyIndex].trim() === '' || lines[lastKeyIndex].trim() === '}')
  ) {
    lastKeyIndex--;
  }

  // Check if we need to add comma to last line
  const lastLine = lines[lastKeyIndex];
  const needsComma =
    lastLine.trim() &&
    !lastLine.trim().endsWith(',') &&
    !lastLine.trim().startsWith('"_comment');

  if (needsComma && newKeys.length > 0) {
    lines[lastKeyIndex] = lastLine.replace(/([^,\s])(\s*)$/, '$1,$2');
  }

  // Add new keys right before the closing brace
  const newLines = [];
  newKeys.forEach(({ key, value }) => {
    newLines.push(`  "${key}": "${value}"`);
  });

  if (newLines.length > 0) {
    // Add blank line before new entries for spacing
    lines.splice(insertIndex, 0, '', ...newLines);
  }

  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
}

function extractScopesFromTextMateRules(filePath) {
  const data = readJsonFile(filePath);
  const rules = data['editor.tokenColorCustomizations']?.textMateRules || [];
  const scopeColorMap = new Map(); // scope -> color

  rules.forEach(rule => {
    const scopes = Array.isArray(rule.scope) ? rule.scope : [rule.scope];
    const color = rule.settings?.foreground;
    if (color) {
      scopes.forEach(scope => {
        scopeColorMap.set(scope, color);
      });
    }
  });

  return scopeColorMap;
}

function generateConfigKeyFromScope(scope) {
  // Infer a reasonable configKey from the scope
  // e.g., "entity.name.tag.crypto.crypto-map.name" -> "crypto.crypto-map.name"
  // e.g., "comment.block.banner" -> "comment.banner"
  // e.g., "keyword.other.acl.protocol" -> "acl.protocol"

  const parts = scope.split('.');

  // Remove prefixes like "entity.name.tag", "keyword.other", "meta.function-call", "string.other", etc.
  let configKey = scope;

  if (scope.startsWith('entity.name.tag.')) {
    configKey = scope.replace('entity.name.tag.', '');
  } else if (scope.startsWith('entity.name.class.')) {
    configKey = scope.replace('entity.name.class.', '');
  } else if (scope.startsWith('entity.other.')) {
    configKey = scope.replace('entity.other.', '');
  } else if (scope.startsWith('keyword.other.')) {
    configKey = scope.replace('keyword.other.', '');
  } else if (scope.startsWith('keyword.other.config-keyword.')) {
    configKey = scope.replace('keyword.other.config-keyword.', 'keyword.');
  } else if (scope.startsWith('keyword.other.group.')) {
    configKey = scope.replace('keyword.other.group.', 'group.');
  } else if (scope.startsWith('meta.function-call.')) {
    configKey = scope.replace('meta.function-call.', '');
  } else if (scope.startsWith('string.other.')) {
    configKey = scope.replace('string.other.', 'string.');
  } else if (scope.startsWith('constant.')) {
    configKey = scope.replace('constant.', '');
  } else if (scope.startsWith('comment.')) {
    configKey = scope
      .replace('comment.block.', 'comment.')
      .replace('comment.line.config', 'comment.line');
  } else if (scope.startsWith('punctuation.')) {
    configKey = scope.replace('punctuation.', '');
  }

  return configKey;
}

function loadExistingScopeMappings() {
  try {
    return readJsonFile(scopeMappingsPath);
  } catch {
    return [];
  }
}

function generateScopeMappings(scopeColorMap) {
  const existing = loadExistingScopeMappings();
  const existingMap = new Map(existing.map(m => [m.scope, m.configKey]));

  const mappings = [];
  scopeColorMap.forEach((color, scope) => {
    const configKey = existingMap.get(scope) || generateConfigKeyFromScope(scope);
    mappings.push({ configKey, scope });
  });

  // Sort by configKey for readability
  mappings.sort((a, b) => a.configKey.localeCompare(b.configKey));

  return mappings;
}

function updatePackageJson(mappings) {
  const pkg = readJsonFile(packageJsonPath);
  if (!pkg.contributes) pkg.contributes = {};
  if (!pkg.contributes.configuration) pkg.contributes.configuration = [];

  const config = pkg.contributes.configuration[0];
  if (!config) return; // Shouldn't happen but safety check

  if (!config.properties) config.properties = {};
  const colorsObj = config.properties['cisco-config-highlight.colors'];
  if (!colorsObj) return;
  if (!colorsObj.properties) colorsObj.properties = {};

  const seenKeys = new Set();
  mappings.forEach(({ configKey }) => {
    seenKeys.add(configKey);
    if (!colorsObj.properties[configKey]) {
      colorsObj.properties[configKey] = {
        type: 'string',
        format: 'color',
        markdownDescription: `%configuration.properties.colors.${configKey}.description%`,
      };
    }
  });

  return pkg;
}

function updatePackageNls(mappings) {
  const existingNls = readJsonFile(packageNlsPath);
  const newKeys = [];
  const keysToRemove = [];

  // Build set of valid color description keys from mappings
  const validColorKeys = new Set();
  mappings.forEach(({ configKey }) => {
    validColorKeys.add(`configuration.properties.colors.${configKey}.description`);
  });

  // Find new keys to add
  mappings.forEach(({ configKey, scope }) => {
    const nlsKey = `configuration.properties.colors.${configKey}.description`;
    if (!existingNls[nlsKey]) {
      newKeys.push({ key: nlsKey, value: scope });
    }
  });

  // Find obsolete color keys to remove (any color key that doesn't match current mappings)
  Object.keys(existingNls).forEach(key => {
    // Match pattern: configuration.properties.colors.<anything>.description
    // But exclude: configuration.properties.colors.description (the main description)
    if (
      key.match(/^configuration\.properties\.colors\..+\.description$/) &&
      key !== 'configuration.properties.colors.description' &&
      !validColorKeys.has(key)
    ) {
      keysToRemove.push(key);
    }
  });

  return { existingNls, newKeys, keysToRemove };
}

function updatePackageNlsJa(mappings) {
  const existingNls = readJsonFile(packageNlsJaPath);
  const newKeys = [];
  const keysToRemove = [];

  // Build set of valid color description keys from mappings
  const validColorKeys = new Set();
  mappings.forEach(({ configKey }) => {
    validColorKeys.add(`configuration.properties.colors.${configKey}.description`);
  });

  // Find new keys to add
  mappings.forEach(({ configKey, scope }) => {
    const nlsKey = `configuration.properties.colors.${configKey}.description`;
    if (!existingNls[nlsKey]) {
      newKeys.push({ key: nlsKey, value: scope });
    }
  });

  // Find obsolete color keys to remove (any color key that doesn't match current mappings)
  Object.keys(existingNls).forEach(key => {
    // Match pattern: configuration.properties.colors.<anything>.description
    // But exclude: configuration.properties.colors.description (the main description)
    if (
      key.match(/^configuration\.properties\.colors\..+\.description$/) &&
      key !== 'configuration.properties.colors.description' &&
      !validColorKeys.has(key)
    ) {
      keysToRemove.push(key);
    }
  });

  return { existingNls, newKeys, keysToRemove };
}

function main() {
  const scopeColorMap = extractScopesFromTextMateRules(textMateRulesPath);
  const mappings = generateScopeMappings(scopeColorMap);

  if (dryRun) {
    console.log(`[dry-run] Would update ${mappings.length} scope mappings`);
    console.log('\nGenerated mappings:');
    mappings.slice(0, 5).forEach(({ configKey, scope }) => {
      console.log(`  ${configKey} -> ${scope}`);
    });
    if (mappings.length > 5) {
      console.log(`  ... and ${mappings.length - 5} more`);
    }

    const { newKeys: nlsNewKeys, keysToRemove: nlsRemoveKeys } =
      updatePackageNls(mappings);
    const { newKeys: nlsJaNewKeys, keysToRemove: nlsJaRemoveKeys } =
      updatePackageNlsJa(mappings);

    console.log(`\nWould add ${nlsNewKeys.length} new keys to package.nls.json`);
    if (nlsRemoveKeys.length > 0) {
      console.log(
        `Would remove ${nlsRemoveKeys.length} obsolete keys from package.nls.json`,
      );
    }
    console.log(`Would add ${nlsJaNewKeys.length} new keys to package.nls.ja.json`);
    if (nlsJaRemoveKeys.length > 0) {
      console.log(
        `Would remove ${nlsJaRemoveKeys.length} obsolete keys from package.nls.ja.json`,
      );
    }

    console.log(`\nWould update:`);
    console.log(`  - ${path.relative(repoRoot, scopeMappingsPath)}`);
    console.log(`  - ${path.relative(repoRoot, packageJsonPath)}`);
    if (nlsNewKeys.length > 0 || nlsRemoveKeys.length > 0) {
      console.log(`  - ${path.relative(repoRoot, packageNlsPath)}`);
    }
    if (nlsJaNewKeys.length > 0 || nlsJaRemoveKeys.length > 0) {
      console.log(`  - ${path.relative(repoRoot, packageNlsJaPath)}`);
    }
    return;
  }

  const updatedPkg = updatePackageJson(mappings);
  const { newKeys: nlsNewKeys, keysToRemove: nlsRemoveKeys } =
    updatePackageNls(mappings);
  const { newKeys: nlsJaNewKeys, keysToRemove: nlsJaRemoveKeys } =
    updatePackageNlsJa(mappings);

  writeJsonFile(scopeMappingsPath, mappings);
  writeJsonFile(packageJsonPath, updatedPkg);

  if (nlsRemoveKeys.length > 0) {
    removeOrderedWrite(packageNlsPath, nlsRemoveKeys);
  }

  if (nlsNewKeys.length > 0) {
    preserveOrderedWrite(packageNlsPath, nlsNewKeys);
  }

  if (nlsJaRemoveKeys.length > 0) {
    removeOrderedWrite(packageNlsJaPath, nlsJaRemoveKeys);
  }

  if (nlsJaNewKeys.length > 0) {
    preserveOrderedWrite(packageNlsJaPath, nlsJaNewKeys);
  }

  console.log(`Updated ${mappings.length} scope mappings`);
  console.log(`  - ${path.relative(repoRoot, scopeMappingsPath)}`);
  console.log(`  - ${path.relative(repoRoot, packageJsonPath)}`);
  if (nlsRemoveKeys.length > 0 || nlsNewKeys.length > 0) {
    console.log(
      `  - ${path.relative(repoRoot, packageNlsPath)} (added ${nlsNewKeys.length}, removed ${nlsRemoveKeys.length})`,
    );
  }
  if (nlsJaRemoveKeys.length > 0 || nlsJaNewKeys.length > 0) {
    console.log(
      `  - ${path.relative(repoRoot, packageNlsJaPath)} (added ${nlsJaNewKeys.length}, removed ${nlsJaRemoveKeys.length})`,
    );
  }
}

try {
  main();
} catch (err) {
  console.error(err.message || err);
  process.exit(1);
}
