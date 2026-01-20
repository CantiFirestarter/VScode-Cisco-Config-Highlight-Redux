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

// Configuration mappings for all token scopes managed by this extension
const scopeMappings: ScopeMapping[] = [
  { configKey: 'comment.banner', scope: 'comment.block.banner' },
  { configKey: 'comment.line', scope: 'comment.line.config' },
  { configKey: 'numeric.ipv4-AD', scope: 'constant.numeric.ipv4-AD' },
  { configKey: 'numeric.ipv6-AD', scope: 'constant.numeric.ipv6-AD' },
  { configKey: 'numeric.hex', scope: 'constant.numeric.hex' },
  { configKey: 'numeric.integer', scope: 'constant.numeric.integer' },
  {
    configKey: 'interface.async',
    scope: 'entity.name.class.interface.async',
  },
  {
    configKey: 'interface.bri',
    scope: 'entity.name.class.interface.bri',
  },
  {
    configKey: 'interface.bvi',
    scope: 'entity.name.class.interface.bvi',
  },
  {
    configKey: 'interface.app',
    scope: 'entity.name.class.interface.app',
  },
  {
    configKey: 'interface.cellular',
    scope: 'entity.name.class.interface.cellular',
  },
  {
    configKey: 'interface.dialer',
    scope: 'entity.name.class.interface.dialer',
  },
  {
    configKey: 'interface.ethernet',
    scope: 'entity.name.class.interface.ethernet',
  },
  {
    configKey: 'interface.loopback',
    scope: 'entity.name.class.interface.loopback',
  },
  {
    configKey: 'interface.management',
    scope: 'entity.name.class.interface.management',
  },
  {
    configKey: 'interface.null',
    scope: 'entity.name.class.interface.null',
  },
  {
    configKey: 'interface.portchannel',
    scope: 'entity.name.class.interface.portchannel',
  },
  {
    configKey: 'interface.serial',
    scope: 'entity.name.class.interface.serial',
  },
  {
    configKey: 'interface.tunnel',
    scope: 'entity.name.class.interface.tunnel',
  },
  {
    configKey: 'interface.virtual-template',
    scope: 'entity.name.class.interface.virtual-template',
  },
  {
    configKey: 'interface.vlan',
    scope: 'entity.name.class.interface.vlan',
  },
  {
    configKey: 'interface.wireless',
    scope: 'entity.name.class.interface.wireless',
  },
  {
    configKey: 'interface.atm',
    scope: 'entity.name.class.interface.atm',
  },
  {
    configKey: 'interface.bdi',
    scope: 'entity.name.class.interface.bdi',
  },
  {
    configKey: 'interface.bundle-ether',
    scope: 'entity.name.class.interface.bundle-ether',
  },
  {
    configKey: 'interface.dpt',
    scope: 'entity.name.class.interface.dpt',
  },
  {
    configKey: 'interface.embedded-service-engine',
    scope: 'entity.name.class.interface.embedded-service-engine',
  },
  {
    configKey: 'interface.fiberchannel',
    scope: 'entity.name.class.interface.fiberchannel',
  },
  {
    configKey: 'interface.group-async',
    scope: 'entity.name.class.interface.group-async',
  },
  {
    configKey: 'interface.lisp',
    scope: 'entity.name.class.interface.lisp',
  },
  {
    configKey: 'interface.lre',
    scope: 'entity.name.class.interface.lre',
  },
  {
    configKey: 'interface.mfr',
    scope: 'entity.name.class.interface.mfr',
  },
  {
    configKey: 'interface.multilink',
    scope: 'entity.name.class.interface.multilink',
  },
  {
    configKey: 'interface.nve',
    scope: 'entity.name.class.interface.nve',
  },
  {
    configKey: 'interface.pos',
    scope: 'entity.name.class.interface.pos',
  },
  {
    configKey: 'interface.pseudowire',
    scope: 'entity.name.class.interface.pseudowire',
  },
  {
    configKey: 'interface.sdwan',
    scope: 'entity.name.class.interface.sdwan',
  },
  {
    configKey: 'interface.service-engine',
    scope: 'entity.name.class.interface.service-engine',
  },
  {
    configKey: 'interface.tokenring',
    scope: 'entity.name.class.interface.tokenring',
  },
  {
    configKey: 'interface.vasi',
    scope: 'entity.name.class.interface.vasi',
  },
  {
    configKey: 'vrf.declaration',
    scope: 'entity.name.class.vrf.declaration',
  },
  {
    configKey: 'acl.access-class.name',
    scope: 'entity.name.tag.acl.access-class.name',
  },
  {
    configKey: 'acl.access-group.name',
    scope: 'entity.name.tag.acl.access-group.name',
  },
  {
    configKey: 'acl.access-list.name',
    scope: 'entity.name.tag.acl.access-list.name',
  },
  {
    configKey: 'bgp.neighbor-peer-group.name',
    scope: 'entity.name.tag.bgp.neighbor-peer-group.name',
  },
  {
    configKey: 'bgp.peer-group.name',
    scope: 'entity.name.tag.bgp.peer-group.name',
  },
  {
    configKey: 'bgp.peer-policy.name',
    scope: 'entity.name.tag.bgp.peer-policy.name',
  },
  {
    configKey: 'bgp.peer-session.name',
    scope: 'entity.name.tag.bgp.peer-session.name',
  },
  {
    configKey: 'config-string.domain-name',
    scope: 'entity.name.tag.config-string.domain-name',
  },
  {
    configKey: 'config-string.hostname',
    scope: 'entity.name.tag.config-string.hostname',
  },
  {
    configKey: 'config-string.logging-system-message',
    scope: 'entity.name.tag.config-string.logging-system-message',
  },
  {
    configKey: 'config-string.username',
    scope: 'entity.name.tag.config-string.username',
  },
  {
    configKey: 'config-string.name',
    scope: 'entity.name.tag.config-string.name',
  },
  {
    configKey: 'crypto.crypto-map.name',
    scope: 'entity.name.tag.crypto.crypto-map.name',
  },
  {
    configKey: 'crypto.transform-set.name',
    scope: 'entity.name.tag.crypto.transform-set.name',
  },
  {
    configKey: 'crypto.ipsec-profile.name',
    scope: 'entity.name.tag.crypto.ipsec-profile.name',
  },
  {
    configKey: 'crypto.isakmp-profile.name',
    scope: 'entity.name.tag.crypto.isakmp-profile.name',
  },
  {
    configKey: 'crypto.keyring.name',
    scope: 'entity.name.tag.crypto.keyring.name',
  },
  {
    configKey: 'group.class-map.name',
    scope: 'entity.name.tag.group.qos.class-map.name',
  },
  {
    configKey: 'group.qos.class.name',
    scope: 'entity.name.tag.group.qos.class.name',
  },
  {
    configKey: 'group.object-group.name',
    scope: 'entity.name.tag.group.security.object-group.name.name',
  },
  {
    configKey: 'group.policy-map.name',
    scope: 'entity.name.tag.group.qos.policy-map.name',
  },
  {
    configKey: 'group.pool.name',
    scope: 'entity.name.tag.group.resource.pool.name',
  },
  {
    configKey: 'group.prefix-list.name',
    scope: 'entity.name.tag.group.routing.prefix-list.name.cisco',
  },
  {
    configKey: 'group.route-map.name',
    scope: 'entity.name.tag.group.routing.route-map.name',
  },
  {
    configKey: 'group.service-policy.name',
    scope: 'entity.name.tag.group.qos.service-policy.name',
  },
  {
    configKey: 'group.policy-list.name',
    scope: 'entity.name.tag.group.resource.policy-list.name',
  },
  {
    configKey: 'group.traffic-filter.name',
    scope: 'entity.name.tag.group.traffic.traffic-filter.name',
  },
  {
    configKey: 'group.community.name',
    scope: 'entity.name.tag.group.bgp.community.name',
  },
  { configKey: 'vrf.vrf-name', scope: 'entity.name.tag.vrf.vrf-name' },
  { configKey: 'vrf.definition', scope: 'entity.other.vrf.definition' },
  { configKey: 'vrf.forwarding', scope: 'entity.other.vrf.forwarding' },
  {
    configKey: 'acl.access-list.type',
    scope: 'keyword.other.acl.access-list.type',
  },
  {
    configKey: 'acl.access-class.type',
    scope: 'keyword.other.acl.access-class.type',
  },
  {
    configKey: 'acl.access-group.type',
    scope: 'keyword.other.acl.access-group.type',
  },
  { configKey: 'acl.protocol', scope: 'keyword.other.acl.protocol' },
  { configKey: 'acl.tcp-flag', scope: 'keyword.other.acl.tcp-flag' },
  { configKey: 'acl.icmp-type', scope: 'keyword.other.acl.icmp-type' },
  { configKey: 'acl.option', scope: 'keyword.other.acl.option' },
  {
    configKey: 'acl.port-operator',
    scope: 'keyword.other.acl.port-operator',
  },
  { configKey: 'address.cidr', scope: 'keyword.other.address.cidr' },
  {
    configKey: 'address.ipv4',
    scope: 'keyword.other.address.ipv4.full',
  },
  {
    configKey: 'address.ipv6',
    scope: 'keyword.other.address.ipv6.condensed',
  },
  {
    configKey: 'address.ipv6',
    scope: 'keyword.other.address.ipv6.full',
  },
  { configKey: 'address.mac', scope: 'keyword.other.address.mac' },
  {
    configKey: 'keyword.add-remove.add',
    scope: 'keyword.other.config-keyword.add-remove.add',
  },
  {
    configKey: 'keyword.add-remove.except',
    scope: 'keyword.other.config-keyword.add-remove.except',
  },
  {
    configKey: 'keyword.add-remove.remove',
    scope: 'keyword.other.config-keyword.add-remove.remove',
  },
  {
    configKey: 'keyword.allowed-native',
    scope: 'keyword.other.config-keyword.allowed-native',
  },
  {
    configKey: 'keyword.any-all.all',
    scope: 'keyword.other.config-keyword.any-all.all',
  },
  {
    configKey: 'keyword.any-all.any',
    scope: 'keyword.other.config-keyword.any-all.any',
  },
  {
    configKey: 'keyword.in-out.in',
    scope: 'keyword.other.config-keyword.in-out.in',
  },
  {
    configKey: 'keyword.in-out.out',
    scope: 'keyword.other.config-keyword.in-out.out',
  },
  {
    configKey: 'keyword.input-output.input',
    scope: 'keyword.other.config-keyword.input-output.input',
  },
  {
    configKey: 'keyword.input-output.output',
    scope: 'keyword.other.config-keyword.input-output.output',
  },
  {
    configKey: 'keyword.inside-outside.inside',
    scope: 'keyword.other.config-keyword.inside-outside.inside',
  },
  {
    configKey: 'keyword.inside-outside.outside',
    scope: 'keyword.other.config-keyword.inside-outside.outside',
  },
  {
    configKey: 'keyword.match.all',
    scope: 'keyword.other.config-keyword.match.all',
  },
  {
    configKey: 'keyword.match.any',
    scope: 'keyword.other.config-keyword.match.any',
  },
  {
    configKey: 'keyword.deny',
    scope: 'keyword.other.config-keyword.permit-deny.deny',
  },
  {
    configKey: 'keyword.permit',
    scope: 'keyword.other.config-keyword.permit-deny.permit',
  },
  {
    configKey: 'keyword.shutdown',
    scope: 'keyword.other.config-keyword.shutdown',
  },
  {
    configKey: 'keyword.remark',
    scope: 'keyword.other.config-keyword.remark',
  },
  {
    configKey: 'keyword.network-protocols.security-aaa',
    scope: 'keyword.other.config-keyword.network-protocols.security-aaa',
  },
  {
    configKey: 'keyword.network-protocols.wireless',
    scope: 'keyword.other.config-keyword.network-protocols.wireless',
  },
  {
    configKey: 'keyword.network-protocols.ip-routing',
    scope: 'keyword.other.config-keyword.network-protocols.ip-routing',
  },
  {
    configKey: 'keyword.network-protocols.system-logging',
    scope: 'keyword.other.config-keyword.network-protocols.system-logging',
  },
  {
    configKey: 'keyword.network-protocols.layer2',
    scope: 'keyword.other.config-keyword.network-protocols.layer2',
  },
  {
    configKey: 'keyword.network-protocols.mgmt-interfaces',
    scope: 'keyword.other.config-keyword.network-protocols.mgmt-interfaces',
  },
  {
    configKey: 'keyword.config-commands',
    scope: 'keyword.other.config-keyword.config-commands',
  },
  {
    configKey: 'keyword.operational-states',
    scope: 'keyword.other.config-keyword.operational-states',
  },
  {
    configKey: 'keyword.control-actions',
    scope: 'keyword.other.config-keyword.control-actions',
  },
  {
    configKey: 'keyword.advanced-options',
    scope: 'keyword.other.config-keyword.advanced-options',
  },
  {
    configKey: 'keyword.routing-protocols',
    scope: 'keyword.other.config-keyword.routing-protocols',
  },
  {
    configKey: 'keyword.status.administratively-down',
    scope: 'keyword.other.config-keyword.status.administratively-down',
  },
  {
    configKey: 'keyword.status.deleted',
    scope: 'keyword.other.config-keyword.status.deleted',
  },
  {
    configKey: 'keyword.status.down',
    scope: 'keyword.other.config-keyword.status.down',
  },
  {
    configKey: 'keyword.status.up',
    scope: 'keyword.other.config-keyword.status.up',
  },
  {
    configKey: 'keyword.switchport-mode.access',
    scope: 'keyword.other.config-keyword.switchport-mode.access',
  },
  {
    configKey: 'keyword.switchport-mode.dynamic',
    scope: 'keyword.other.config-keyword.switchport-mode.dynamic',
  },
  {
    configKey: 'keyword.switchport-mode.trunk',
    scope: 'keyword.other.config-keyword.switchport-mode.trunk',
  },
  {
    configKey: 'keyword.vlan',
    scope: 'keyword.other.config-keyword.vlan',
  },
  {
    configKey: 'group.object-group.type',
    scope: 'keyword.other.group.object-group.type',
  },
  {
    configKey: 'arp-insp-val',
    scope: 'meta.function-call.arp-insp-val',
  },
  {
    configKey: 'command_hostname.config-if',
    scope: 'meta.function-call.command_hostname.config-if',
  },
  {
    configKey: 'command_hostname.config-router',
    scope: 'meta.function-call.command_hostname.config-router',
  },
  {
    configKey: 'command_hostname.config-line',
    scope: 'meta.function-call.command_hostname.config-line',
  },
  {
    configKey: 'config-param.first',
    scope: 'meta.function-call.command_hostname.config',
  },
  {
    configKey: 'command_hostname.privileged-mode',
    scope: 'meta.function-call.command_hostname.privileged-mode',
  },
  {
    configKey: 'command_hostname.user-mode',
    scope: 'meta.function-call.command_hostname.user-mode',
  },
  {
    configKey: 'command-disable.default',
    scope: 'meta.function-call.command-disable.default',
  },
  {
    configKey: 'command-disable.unused',
    scope: 'meta.function-call.command-disable.unused',
  },
  { configKey: 'separator', scope: 'punctuation.separator' },
  { configKey: 'string.description', scope: 'string.other.description' },
  { configKey: 'string.password', scope: 'string.other.password' },
  { configKey: 'string.remark', scope: 'string.other.remark' },
  { configKey: 'string.secret', scope: 'string.other.secret' },
];

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

  const currentCustomizations = workspaceConfig.get<TokenColorCustomizations>(
    'editor.tokenColorCustomizations',
    {},
  );

  const existingRules = currentCustomizations.textMateRules ?? [];
  const defaultRules = applyAll ? loadDefaultTokenRules(context) : [];
  const rules = buildTokenRulesFromConfig(configColors);

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
): TextMateRule[] {
  const rules: TextMateRule[] = [];

  // Process all mappings
  scopeMappings.forEach(({ configKey, scope }) => {
    addColorRule(rules, config, configKey, scope);
  });

  return rules;
}
