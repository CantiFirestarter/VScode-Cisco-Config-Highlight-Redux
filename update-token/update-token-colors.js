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
  const nls = readJsonFile(packageNlsPath);
  const seen = new Set();

  mappings.forEach(({ configKey, scope }) => {
    const nlsKey = `configuration.properties.colors.${configKey}.description`;
    if (!seen.has(nlsKey) && !nls[nlsKey]) {
      nls[nlsKey] = scope;
    }
    seen.add(nlsKey);
  });

  return nls;
}

function updatePackageNlsJa(mappings) {
  const nls = readJsonFile(packageNlsJaPath);
  const seen = new Set();

  // Simple placeholder: use scope name as Japanese description
  mappings.forEach(({ configKey, scope }) => {
    const nlsKey = `configuration.properties.colors.${configKey}.description`;
    if (!seen.has(nlsKey) && !nls[nlsKey]) {
      nls[nlsKey] = scope; // Placeholder; user should translate
    }
    seen.add(nlsKey);
  });

  return nls;
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
    console.log(`\nWould update:`);
    console.log(`  - ${path.relative(repoRoot, scopeMappingsPath)}`);
    console.log(`  - ${path.relative(repoRoot, packageJsonPath)}`);
    console.log(`  - ${path.relative(repoRoot, packageNlsPath)}`);
    console.log(`  - ${path.relative(repoRoot, packageNlsJaPath)}`);
    return;
  }

  const updatedPkg = updatePackageJson(mappings);
  const updatedNls = updatePackageNls(mappings);
  const updatedNlsJa = updatePackageNlsJa(mappings);

  writeJsonFile(scopeMappingsPath, mappings);
  writeJsonFile(packageJsonPath, updatedPkg);
  writeJsonFile(packageNlsPath, updatedNls);
  writeJsonFile(packageNlsJaPath, updatedNlsJa);

  console.log(`Updated ${mappings.length} scope mappings`);
  console.log(`  - ${path.relative(repoRoot, scopeMappingsPath)}`);
  console.log(`  - ${path.relative(repoRoot, packageJsonPath)}`);
  console.log(`  - ${path.relative(repoRoot, packageNlsPath)}`);
  console.log(`  - ${path.relative(repoRoot, packageNlsJaPath)}`);
}

try {
  main();
} catch (err) {
  console.error(err.message || err);
  process.exit(1);
}
