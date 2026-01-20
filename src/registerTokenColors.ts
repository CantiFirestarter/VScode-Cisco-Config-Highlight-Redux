import * as fs from 'fs';
import * as vscode from 'vscode';

interface TextMateSettings {
  foreground?: string;
  fontStyle?: string;
}

interface TextMateRule {
  scope: string | string[];
  settings: TextMateSettings;
}

interface TokenColorCustomizations {
  textMateRules?: TextMateRule[];
}

interface TextMateRulesFile {
  'editor.tokenColorCustomizations'?: {
    textMateRules?: TextMateRule[];
  };
}

interface ScopeMapping {
  configKey: string;
  scope: string | string[];
}

function loadScopeMappings(context: vscode.ExtensionContext): ScopeMapping[] {
  try {
    const filePath = context.asAbsolutePath('config/scopeMappings.json');
    const content = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(content);
    if (!Array.isArray(parsed)) {
      throw new Error('scopeMappings.json must be an array');
    }
    return parsed as ScopeMapping[];
  } catch (err) {
    console.warn('Failed to load scope mappings:', err);
    return [];
  }
}

/**
 * Applies custom token colors based on user configuration settings
 */
export function registerTokenColorCustomization(context: vscode.ExtensionContext): void {
  // Apply colors when extension activates
  applyTokenColors(context);

  // Watch for configuration changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(e => {
      if (
        e.affectsConfiguration('cisco-config-highlight.colors') ||
        e.affectsConfiguration('cisco-config-highlight.applyAllTokenRules')
      ) {
        applyTokenColors(context);
      }
    }),
  );

  // Register command to manually apply colors
  context.subscriptions.push(
    vscode.commands.registerCommand('cisco-config-highlight.applyColors', () => {
      applyTokenColors(context);
      vscode.window.showInformationMessage('Cisco Config colors applied!');
    }),
  );
}

function applyTokenColors(context: vscode.ExtensionContext): void {
  const configColors = vscode.workspace.getConfiguration(
    'cisco-config-highlight.colors',
  );
  const generalConfig = vscode.workspace.getConfiguration('cisco-config-highlight');
  const applyAll = generalConfig.get<boolean>('applyAllTokenRules', false);
  const workspaceConfig = vscode.workspace.getConfiguration();
  const scopeMappings = loadScopeMappings(context);

  const currentCustomizations = workspaceConfig.get<TokenColorCustomizations>(
    'editor.tokenColorCustomizations',
    {},
  );

  const existingRules = currentCustomizations.textMateRules ?? [];
  const defaultRules = applyAll ? loadDefaultTokenRules(context) : [];
  const rules = buildTokenRulesFromConfig(configColors, scopeMappings);

  const getScopeKey = (scope: string | string[]) =>
    Array.isArray(scope) ? scope.join('|') : scope;

  const managedScopeKeys = new Set(scopeMappings.map(({ scope }) => getScopeKey(scope)));
  const mergedRulesMap = new Map<string, TextMateRule>();

  // Keep any unmanaged rules the user may have set themselves
  existingRules.forEach(rule => {
    const key = getScopeKey(rule.scope);
    if (!managedScopeKeys.has(key)) {
      mergedRulesMap.set(key, rule);
    }
  });

  // Apply default file rules first
  defaultRules.forEach(rule => {
    mergedRulesMap.set(getScopeKey(rule.scope), rule);
  });

  // Apply configured rules (may override defaults)
  rules.forEach(rule => {
    mergedRulesMap.set(getScopeKey(rule.scope), rule);
  });

  // Managed scopes are added only if present in config/defaults; removed when absent
  currentCustomizations.textMateRules = Array.from(mergedRulesMap.values());

  workspaceConfig.update(
    'editor.tokenColorCustomizations',
    currentCustomizations,
    vscode.ConfigurationTarget.Global,
  );
}

function loadDefaultTokenRules(context: vscode.ExtensionContext): TextMateRule[] {
  try {
    const filePath = context.asAbsolutePath('syntaxes/textMateRules.json');
    const content = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(content) as TextMateRulesFile;
    const rules: TextMateRule[] =
      parsed?.['editor.tokenColorCustomizations']?.textMateRules ?? [];
    return Array.isArray(rules) ? rules : [];
  } catch (err) {
    console.warn('Failed to load default token rules:', err);
    return [];
  }
}

function addColorRule(
  rules: TextMateRule[],
  config: vscode.WorkspaceConfiguration,
  configKey: string,
  scope: string | string[],
): void {
  const color = config.get<string>(configKey);
  if (color) {
    rules.push({ scope, settings: { foreground: color } });
  }
}

function buildTokenRulesFromConfig(
  config: vscode.WorkspaceConfiguration,
  mappings: ScopeMapping[],
): TextMateRule[] {
  const rules: TextMateRule[] = [];

  // Process all mappings
  mappings.forEach(({ configKey, scope }) => {
    addColorRule(rules, config, configKey, scope);
  });

  return rules;
}
