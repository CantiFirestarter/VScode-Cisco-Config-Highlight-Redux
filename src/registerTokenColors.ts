import * as fs from "fs";
import * as vscode from "vscode";

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
  "editor.tokenColorCustomizations"?: {
    textMateRules?: TextMateRule[];
  };
}

interface ScopeMapping {
  configKey: string;
  scope: string | string[];
}

// Configuration mappings for all token scopes managed by this extension
const scopeMappings: ScopeMapping[] = [
  // Separator
  { configKey: "separator", scope: "punctuation.separator" },
  // Keywords
  { configKey: "keyword.vlan", scope: "keyword.other.config-keyword.vlan" },
  {
    configKey: "keyword.switchport-mode.access",
    scope: "keyword.other.config-keyword.switchport-mode.access",
  },
  {
    configKey: "keyword.switchport-mode.trunk",
    scope: "keyword.other.config-keyword.switchport-mode.trunk",
  },
  {
    configKey: "keyword.switchport-mode.dynamic",
    scope: "keyword.other.config-keyword.switchport-mode.dynamic",
  },
  {
    configKey: "keyword.add-remove.add",
    scope: "keyword.other.config-keyword.add-remove.add",
  },
  {
    configKey: "keyword.add-remove.remove",
    scope: "keyword.other.config-keyword.add-remove.remove",
  },
  {
    configKey: "keyword.add-remove.except",
    scope: "keyword.other.config-keyword.add-remove.except",
  },
  {
    configKey: "keyword.allowed-native",
    scope: "keyword.other.config-keyword.allowed-native",
  },
  {
    configKey: "keyword.any-all.any",
    scope: "keyword.other.config-keyword.any-all.any",
  },
  {
    configKey: "keyword.any-all.all",
    scope: "keyword.other.config-keyword.any-all.all",
  },
  {
    configKey: "keyword.permit",
    scope: "keyword.other.config-keyword.permit-deny.permit",
  },
  {
    configKey: "keyword.deny",
    scope: "keyword.other.config-keyword.permit-deny.deny",
  },
  {
    configKey: "keyword.status.up",
    scope: "keyword.other.config-keyword.status.up",
  },
  {
    configKey: "keyword.status.down",
    scope: "keyword.other.config-keyword.status.down",
  },
  {
    configKey: "keyword.status.deleted",
    scope: "keyword.other.config-keyword.status.deleted",
  },
  {
    configKey: "keyword.status.administratively-down",
    scope: "keyword.other.config-keyword.status.administratively-down",
  },
  {
    configKey: "keyword.match.any",
    scope: "keyword.other.config-keyword.match.any",
  },
  {
    configKey: "keyword.match.all",
    scope: "keyword.other.config-keyword.match.all",
  },
  {
    configKey: "keyword.in-out.in",
    scope: "keyword.other.config-keyword.in-out.in",
  },
  {
    configKey: "keyword.in-out.out",
    scope: "keyword.other.config-keyword.in-out.out",
  },
  {
    configKey: "keyword.input-output.input",
    scope: "keyword.other.config-keyword.input-output.input",
  },
  {
    configKey: "keyword.input-output.output",
    scope: "keyword.other.config-keyword.input-output.output",
  },
  {
    configKey: "keyword.inside-outside.inside",
    scope: "keyword.other.config-keyword.inside-outside.inside",
  },
  {
    configKey: "keyword.inside-outside.outside",
    scope: "keyword.other.config-keyword.inside-outside.outside",
  },
  {
    configKey: "keyword.shutdown",
    scope: "keyword.other.config-keyword.shutdown",
  },
  { configKey: "keyword.remark", scope: "keyword.other.config-keyword.remark" },
  { configKey: "keyword.group1", scope: "keyword.other.config-keyword.group1" },
  { configKey: "keyword.group2", scope: "keyword.other.config-keyword.group2" },
  { configKey: "keyword.group3", scope: "keyword.other.config-keyword.group3" },
  { configKey: "keyword.group4", scope: "keyword.other.config-keyword.group4" },
  { configKey: "keyword.group5", scope: "keyword.other.config-keyword.group5" },
  { configKey: "keyword.group6", scope: "keyword.other.config-keyword.group6" },
  // Interfaces
  {
    configKey: "interface.ethernet",
    scope: "entity.name.class.interface.ethernet",
  },
  {
    configKey: "interface.wireless",
    scope: "entity.name.class.interface.wireless",
  },
  {
    configKey: "interface.loopback",
    scope: "entity.name.class.interface.loopback",
  },
  {
    configKey: "interface.portchannel",
    scope: "entity.name.class.interface.portchannel",
  },
  {
    configKey: "interface.tunnel",
    scope: "entity.name.class.interface.tunnel",
  },
  { configKey: "interface.vlan", scope: "entity.name.class.interface.vlan" },
  { configKey: "interface.null", scope: "entity.name.class.interface.null" },
  {
    configKey: "interface.serial",
    scope: "entity.name.class.interface.serial",
  },
  {
    configKey: "interface.cellular",
    scope: "entity.name.class.interface.cellular",
  },
  {
    configKey: "interface.virtual-template",
    scope: "entity.name.class.interface.virtual-template",
  },
  {
    configKey: "interface.dialer",
    scope: "entity.name.class.interface.dialer",
  },
  { configKey: "interface.async", scope: "entity.name.class.interface.async" },
  { configKey: "interface.bri", scope: "entity.name.class.interface.bri" },
  { configKey: "interface.bvi", scope: "entity.name.class.interface.bvi" },
  { configKey: "interface.app", scope: "entity.name.class.interface.app" },
  {
    configKey: "interface.management",
    scope: "entity.name.class.interface.management",
  },
  // Numeric
  { configKey: "numeric.hex", scope: "constant.numeric.hex" },
  { configKey: "numeric.integer", scope: "constant.numeric.integer" },
  { configKey: "numeric.ipv4-AD", scope: "constant.numeric.ipv4-AD" },
  { configKey: "numeric.ipv6-AD", scope: "constant.numeric.ipv6-AD" },
  // Comments
  { configKey: "comment", scope: "comment.line.config" },
  { configKey: "comment.banner", scope: "comment.block.banner" },
  // Addresses
  { configKey: "address.ipv4", scope: "keyword.other.address.ipv4.full" },
  {
    configKey: "address.ipv6",
    scope: [
      "keyword.other.address.ipv6.full",
      "keyword.other.address.ipv6.condensed",
    ],
  },
  { configKey: "address.cidr", scope: "keyword.other.address.cidr" },
  { configKey: "address.mac", scope: "keyword.other.address.mac" },
  // Command hostname
  {
    configKey: "command_hostname.user-mode",
    scope: "meta.function-call.command_hostname.user-mode",
  },
  {
    configKey: "command_hostname.privileged-mode",
    scope: "meta.function-call.command_hostname.privileged-mode",
  },
  // Params
  { configKey: "config-param.first", scope: "punctuation.config-param.first" },
  {
    configKey: "config-param.second",
    scope: "punctuation.config-param.second",
  },
  // VRF
  { configKey: "vrf.declaration", scope: "entity.name.class.vrf.declaration" },
  { configKey: "vrf.forwarding", scope: "entity.other.vrf.forwarding" },
  { configKey: "vrf.definition", scope: "entity.other.vrf.definition" },
  { configKey: "vrf.vrf-name", scope: "entity.name.tag.vrf.vrf-name" },
  // Strings
  { configKey: "string.description", scope: "string.other.description" },
  { configKey: "string.remark", scope: "string.other.remark" },
  { configKey: "string.password", scope: "string.other.password" },
  { configKey: "string.secret", scope: "string.other.secret" },
  {
    configKey: "config-string.hostname",
    scope: "entity.name.tag.config-string.hostname",
  },
  {
    configKey: "config-string.domain-name",
    scope: "entity.name.tag.config-string.domain-name",
  },
  {
    configKey: "config-string.username",
    scope: "entity.name.tag.config-string.username",
  },
  {
    configKey: "config-string.name",
    scope: "entity.name.tag.config-string.name",
  },
  {
    configKey: "config-string.logging-system-message",
    scope: "entity.name.tag.config-string.logging-system-message",
  },
  // BGP
  {
    configKey: "bgp.neighbor-peer-group.name",
    scope: "entity.name.tag.bgp.neighbor-peer-group.name",
  },
  {
    configKey: "bgp.peer-session.name",
    scope: "entity.name.tag.bgp.peer-session.name",
  },
  {
    configKey: "bgp.peer-policy.name",
    scope: "entity.name.tag.bgp.peer-policy.name",
  },
  {
    configKey: "bgp.peer-group.name",
    scope: "entity.name.tag.bgp.peer-group.name",
  },
  // Groups
  { configKey: "group.class.name", scope: "entity.name.tag.group.class.name" },
  {
    configKey: "group.service-policy.name",
    scope: "entity.name.tag.group.service-policy.name",
  },
  {
    configKey: "group.policy-map.name",
    scope: "entity.name.tag.group.policy-map.name",
  },
  {
    configKey: "group.class-map.name",
    scope: "entity.name.tag.group.class-map.name",
  },
  {
    configKey: "group.route-map.name",
    scope: "entity.name.tag.group.route-map.name",
  },
  {
    configKey: "group.prefix-list.name",
    scope: "entity.name.tag.group.prefix-list.name",
  },
  { configKey: "group.acl.name", scope: "entity.name.tag.group.acl.name" },
  {
    configKey: "group.object-group.type",
    scope: "keyword.other.group.object-group.type.cisco",
  },
  {
    configKey: "group.object-group.name",
    scope: "entity.name.tag.group.object-group.name",
  },
  { configKey: "group.pool.name", scope: "entity.name.tag.group.pool.name" },
  {
    configKey: "group.policy-list.name",
    scope: "entity.name.tag.group.policy-list.name",
  },
  {
    configKey: "group.traffic-filter.name",
    scope: "entity.name.tag.group.traffic-filter.name",
  },
  {
    configKey: "group.community.name",
    scope: "entity.name.tag.group.community.name",
  },
  // ACL
  {
    configKey: "acl.access-list.name",
    scope: "entity.name.tag.acl.access-list.name",
  },
  {
    configKey: "acl.access-class.name",
    scope: "entity.name.tag.acl.access-class.name",
  },
  {
    configKey: "acl.access-group.name",
    scope: "entity.name.tag.acl.access-group.name",
  },
  // Crypto
  {
    configKey: "crypto.crypto-map.name",
    scope: "entity.name.tag.crypto.crypto-map.name",
  },
  {
    configKey: "crypto.transform-set.name",
    scope: "entity.name.tag.crypto.transform-set.name",
  },
  {
    configKey: "crypto.ipsec-profile.name",
    scope: "entity.name.tag.crypto.ipsec-profile.name",
  },
  {
    configKey: "crypto.isakmp-profile.name",
    scope: "entity.name.tag.crypto.isakmp-profile.name",
  },
  {
    configKey: "crypto.keyring.name",
    scope: "entity.name.tag.crypto.keyring.name",
  },
  // Command disable
  {
    configKey: "command-disable.unused",
    scope: "meta.function-call.command-disable.unused",
  },
  {
    configKey: "command-disable.default",
    scope: "meta.function-call.command-disable.default",
  },
];

/**
 * Applies custom token colors based on user configuration settings
 */
export function registerTokenColorCustomization(
  context: vscode.ExtensionContext,
): void {
  // Apply colors when extension activates
  applyTokenColors(context);

  // Watch for configuration changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (
        e.affectsConfiguration("cisco-config-highlight.colors") ||
        e.affectsConfiguration("cisco-config-highlight.applyAllTokenRules")
      ) {
        applyTokenColors(context);
      }
    }),
  );

  // Register command to manually apply colors
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "cisco-config-highlight.applyColors",
      () => {
        applyTokenColors(context);
        vscode.window.showInformationMessage("Cisco Config colors applied!");
      },
    ),
  );
}

function applyTokenColors(context: vscode.ExtensionContext): void {
  const configColors = vscode.workspace.getConfiguration(
    "cisco-config-highlight.colors",
  );
  const generalConfig = vscode.workspace.getConfiguration(
    "cisco-config-highlight",
  );
  const applyAll = generalConfig.get<boolean>("applyAllTokenRules", false);
  const workspaceConfig = vscode.workspace.getConfiguration();

  const currentCustomizations = workspaceConfig.get<TokenColorCustomizations>(
    "editor.tokenColorCustomizations",
    {},
  );

  const existingRules = currentCustomizations.textMateRules ?? [];
  const defaultRules = applyAll ? loadDefaultTokenRules(context) : [];
  const rules = buildTokenRulesFromConfig(configColors);

  const getScopeKey = (scope: string | string[]) =>
    Array.isArray(scope) ? scope.join("|") : scope;

  const managedScopeKeys = new Set(
    scopeMappings.map(({ scope }) => getScopeKey(scope)),
  );
  const mergedRulesMap = new Map<string, TextMateRule>();

  // Keep any unmanaged rules the user may have set themselves
  existingRules.forEach((rule) => {
    const key = getScopeKey(rule.scope);
    if (!managedScopeKeys.has(key)) {
      mergedRulesMap.set(key, rule);
    }
  });

  // Apply default file rules first
  defaultRules.forEach((rule) => {
    mergedRulesMap.set(getScopeKey(rule.scope), rule);
  });

  // Apply configured rules (may override defaults)
  rules.forEach((rule) => {
    mergedRulesMap.set(getScopeKey(rule.scope), rule);
  });

  // Managed scopes are added only if present in config/defaults; removed when absent
  currentCustomizations.textMateRules = Array.from(mergedRulesMap.values());

  workspaceConfig.update(
    "editor.tokenColorCustomizations",
    currentCustomizations,
    vscode.ConfigurationTarget.Global,
  );
}

function loadDefaultTokenRules(
  context: vscode.ExtensionContext,
): TextMateRule[] {
  try {
    const filePath = context.asAbsolutePath("syntaxes/textMateRules.json");
    const content = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(content) as TextMateRulesFile;
    const rules: TextMateRule[] =
      parsed?.["editor.tokenColorCustomizations"]?.textMateRules ?? [];
    return Array.isArray(rules) ? rules : [];
  } catch (err) {
    console.warn("Failed to load default token rules:", err);
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
): TextMateRule[] {
  const rules: TextMateRule[] = [];

  // Process all mappings
  scopeMappings.forEach(({ configKey, scope }) => {
    addColorRule(rules, config, configKey, scope);
  });

  return rules;
}
