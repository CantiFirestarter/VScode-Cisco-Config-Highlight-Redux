# Changelog

## Visual Studio Marketplace Released Version History

[marketplace.visualstudio.com/items/CantiFirestarter.cisco-config-highlight-redux/changelog](https://marketplace.visualstudio.com/items/CantiFirestarter.cisco-config-highlight-redux/changelog)

## 0.7.0 (2026-01-05)

### Added

- New token color customization system
  - Semantic token color framework for user-configurable colors
  - New file: `src/registerTokenColors.ts` for dynamic color management
  - New file: `syntaxes/textMateRules.json` with comprehensive default color rules
  - New command: `cisco-config-highlight.applyColors` for manual color application
  - Automatic color updates on configuration changes

- Enhanced syntax highlighting patterns
  - New separator pattern for punctuation matching (`|`, `/`, `:`, `.`, `,`, `-`, `<`, `>`)
  - New `param2` pattern to capture second parameter in config lines
  - New `name` string pattern for configuration names
  - Support for additional interface type: `app` (AppGig Ethernet)
  - Improved IPv4 and IPv6 address patterns with visual separator highlighting
  - Better MAC address matching with consistent separator validation
  - Enhanced comment patterns supporting both inline and line comments
  - Expanded keyword groups (group1-group6) with comprehensive Cisco commands

- Six new keyword groups for better command organization
  - group1: Foundation commands (aaa_server, access-log, address, etc.)
  - group2: Configuration commands (access-class, access-list, hostname, etc.)
  - group3: Status/control commands (timeout, inactive, shutdown, etc.)
  - group4: Enable/activation commands (activate, enable, permit, etc.)
  - group5: Protocol/feature commands (address-family, automatic, buffered, etc.)
  - group6: Protocol types (all, auto-summary, bgp, eigrp, ospf, etc.)

### Changed

- Modern tooling updates
  - Updated `@types/vscode` from ^1.52.0 → ^1.63.0
  - Updated `eslint` from ^8.57.0 → ^9.0.0
  - Updated `typescript` from ^5.4.3 → ^5.9.3
  - Updated `typescript-eslint` from ^7.4.0 → ^8.0.0
  - Added `@types/node` ^20.11.30 and `ts-node` ^10.9.2

- Code formatting and quality improvements
  - Standardized indentation across all JSON files (tabs → 2 spaces)
  - Applied Prettier formatting throughout codebase
  - Updated VS Code settings for Prettier formatter
  - Migrated ESLint to flat config format (v9 compatibility)

- Enhanced syntax patterns
  - Case-insensitive matching for all keywords using `(?i)` flag
  - Improved interface type regex patterns for better matching accuracy
  - Better numeric pattern detection for hex and integer values
  - Enhanced IPv6 condensed format support
  - ACL patterns now support `access-class` in addition to existing patterns

- TypeScript configuration
  - Added `"types": ["node"]` to `tsconfig.json`
  - Updated `exclude` to include `"scripts"` directory

- Code improvements
  - Updated `src/registerUpdateInfo.ts` to use nullish coalescing operator (`??`)

### Fixed

- Improved regex patterns to avoid false positives in number and address detection
- Better handling of case variations in Cisco configuration keywords

## 0.6.1 (2025-06-19)

### Added

- Add syntax highlighting patterns.
  - entity.name.tag.group.policy-list.name
  - entity.name.tag.group.traffic-filter.name
  - entity.name.tag.group.community.name

### Changed

- IPv6 regex now supports uppercase address representations.

### Contributions to extension:

- [@ReverseTelnet](https://github.com/ReverseTelnet)

## Prereleased 0.6.0 (2024-08-01)

### Added

- Add syntax highlighting patterns.
  - entity.name.tag.crypto.ipsec-profile.name
  - entity.name.tag.crypto.isakmp-profile.name
  - entity.name.tag.crypto.keyring.name
  - entity.name.tag.crypto.crypto-map.name
  - entity.name.tag.crypto.transform-set.name
  - entity.name.tag.group.pool.name

- Change syntax highlighting patterns. Refer to following section.
  - keyword.other.config-keyword.add-remove.add
  - keyword.other.config-keyword.add-remove.except
  - keyword.other.config-keyword.add-remove.remove
  - keyword.other.config-keyword.any-all.all
  - keyword.other.config-keyword.any-all.any
  - keyword.other.config-keyword.in-out.in
  - keyword.other.config-keyword.in-out.out
  - keyword.other.config-keyword.input-output.input
  - keyword.other.config-keyword.input-output.output
  - keyword.other.config-keyword.inside-outside.inside
  - keyword.other.config-keyword.inside-outside.outside
  - keyword.other.config-keyword.match.all
  - keyword.other.config-keyword.match.any
  - keyword.other.config-keyword.permit-deny.deny
  - keyword.other.config-keyword.permit-deny.permit
  - keyword.other.config-keyword.status.administratively-down
  - keyword.other.config-keyword.status.deleted
  - keyword.other.config-keyword.status.down
  - keyword.other.config-keyword.status.up
  - keyword.other.config-keyword.switchport-mode.access
  - keyword.other.config-keyword.switchport-mode.dynamic
  - keyword.other.config-keyword.switchport-mode.trunk

### Changed

- Refined and subdivided several syntax highlighting patterns into more specific categories.
  - Notice
  - If you have customized Token Colors, this change may cause the Token definitions to no longer match and your customizations may not take effect.
  - Removed the `.cisco` suffix from the Token Scopes mentioned in the README. This was done to minimize the impact of future similar subdivisions.

  - Token Scopes
    - [before] keyword.other.config-keyword.add-remove
      - keyword.other.config-keyword.add-remove.add
      - keyword.other.config-keyword.add-remove.except
      - keyword.other.config-keyword.add-remove.remove
    - [before] keyword.other.config-keyword.any-all
      - keyword.other.config-keyword.any-all.all
      - keyword.other.config-keyword.any-all.any
    - [before] keyword.other.config-keyword.in-out
      - keyword.other.config-keyword.in-out.in
      - keyword.other.config-keyword.in-out.out
    - [before] keyword.other.config-keyword.input-output
      - keyword.other.config-keyword.input-output.input
      - keyword.other.config-keyword.input-output.output
    - [before] keyword.other.config-keyword.inside-outside
      - keyword.other.config-keyword.inside-outside.inside
      - keyword.other.config-keyword.inside-outside.outside
    - [before] keyword.other.config-keyword.match
      - keyword.other.config-keyword.match.all
      - keyword.other.config-keyword.match.any
    - [before] keyword.other.config-keyword.permit-deny
      - keyword.other.config-keyword.permit-deny.deny
      - keyword.other.config-keyword.permit-deny.permit
    - [before] keyword.other.config-keyword.status
      - keyword.other.config-keyword.status.administratively-down
      - keyword.other.config-keyword.status.deleted
      - keyword.other.config-keyword.status.down
      - keyword.other.config-keyword.status.up
    - [before] keyword.other.config-keyword.switchport-mode
      - keyword.other.config-keyword.switchport-mode.access
      - keyword.other.config-keyword.switchport-mode.dynamic
      - keyword.other.config-keyword.switchport-mode.trunk

## 0.5.1 (2023-02-06)

### Added

- Add syntax highlighting pattern.
  - Add secret pattern

## 0.5.0 (2022-06-21)

### Added

- Add syntax highlighting patterns.
  - Add Management interface pattern
  - Add TwentyFiveGigabitEthernet interface pattern
  - Add FiftyGigabitEthernet interface pattern
  - Add HundredGigabitEthernet interface pattern
  - Add TwoHundredGigabitEthernet interface pattern
  - Add comment line pattern (beginning with #)

### Changed

- Update implementation of symbol display in the outline panel, which is currently an experimental feature.

## 0.4.1 (2022-06-10)

### Added

- Add syntax highlighting patterns.
  - Add pool name pattern
  - Add crypto map name pattern
  - Add transform-set name pattern

## 0.4.0 (2022-06-04)

### Added

- Added notification of incompatible changes.
- Add syntax highlighting pattern.
  - Add remark keyword

### Changed

- Change Token Name Issue#2
  - Note: If you have customized the token color in Settings.json, the corresponding Token must be renamed to the new name.
  - Changed the category name of tokens whose category name was QoS to Group.

  ```
  entity.name.tag.qos.class.name.cisco --> entity.name.tag.group.class.name.cisco
  entity.name.tag.qos.service-policy.name.cisco --> entity.name.tag.group.service-policy.name.cisco
  entity.name.tag.qos.policy-map.name.cisco --> entity.name.tag.group.policy-map.name.cisco
  entity.name.tag.qos.class-map.name.cisco --> entity.name.tag.group.class-map.name.cisco
  entity.name.tag.qos.route-map.name.cisco --> entity.name.tag.group.route-map.name.cisco
  entity.name.tag.qos.prefix-list.name.cisco --> entity.name.tag.group.prefix-list.name.cisco
  ```

  - Changed the category name of some tokens whose category name is ACL to Group.

  ```
  keyword.other.acl.object-group.type.cisco --> keyword.other.group.object-group.type.cisco
  entity.name.tag.acl.object-group.name.cisco --> entity.name.tag.group.object-group.name.cisco
  ```

## 0.3.5 (2021-12-12)

### Added

- Add syntax highlighting pattern.
  - Add shutdown keyword

### Changed

- Update syntax highlighting patterns.
  - Changed the beginning-of-line match pattern of some patterns from `\s` to `(^|\\s)`.
  - Updated regular expression in hostname to exclude irrelevant matches.

## 0.3.4 (2021-12-10)

### Added

- Add Command symbol to outline panel.

### Changed

- Update syntax highlighting patterns.
  - Update route-map, prefix-list patterns.
- Symbol info object moved to symbolsInfo.ts file.

## 0.3.3 (2021-11-07)

### Changed

- Update outline symbol pattern.
  - Exclude vrf forwarding from ip vrf outline symbol.

## 0.3.2 (2021-11-07)

### Changed

- Update outline symbol.
  - Add vrf symbol.

## 0.3.1 (2021-10-11)

### Changed

- Update syntax highlighting patterns.
  - Add logging system message pattern.
  - Add interface patterns. (BRI, BVI)
  - Update status pattern. (add first character uppercase.)

## 0.3.0 (2021-09-14)

### Added

- Add a list to the config to toggle which symbols to enable.

### Changed

- Changed to use TypeScript.

## 0.2.0 (2021-07-12)

### Changed

- Add the feature to show symbols in the outline panel.
- Add `showSymbolsInOutlinePanel` to configuration.

## 0.1.5 (2021-05-27)

### Changed

- Update syntax highlighting patterns.
  - Add interface async patterns
  - Add string patterns
  - Update patterns

### Removed

- remove comment patterns from `language-configuration.json`.

## 0.1.4 (2021-05-25)

### Changed

- Update syntax highlighting patterns.
  - Add interface dialer patterns
  - Change key names
  - Update patterns

## 0.1.3 (2021-05-23)

### Changed

- Update syntax highlighting patterns.
  - Add bgp pattern
  - Add acl pattern
  - Add string pattern
  - Update patterns

## 0.1.2 (2021-05-22)

### Changed

- Update syntax highlighting patterns.
  - Add patterns
  - Change key names
  - Update patterns

## 0.1.1 (2021-05-22)

### Changed

- Update syntax highlighting patterns.
  - Add patterns
  - Change key names
  - Update patterns

## 0.1.0 (2021-05-21)

### Added

- Add syntax highlighting patterns.

## 0.0.1 (2021-03-29)

- Initial release
