#!/usr/bin/env python3
import json
import sys
import re
from pathlib import Path

# Parse arguments
dry_run = "--dry-run" in sys.argv

# Setup paths
repo_root = Path(__file__).parent.parent
text_mate_rules_path = repo_root / "syntaxes" / "textMateRules.json"
scope_mappings_path = repo_root / "config" / "scopeMappings.json"
package_json_path = repo_root / "package.json"
package_nls_path = repo_root / "package.nls.json"
package_nls_ja_path = repo_root / "package.nls.ja.json"


def read_json_file(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)


def write_json_file(file_path, data):
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")


def remove_ordered_write(file_path, keys_to_remove):
    """Remove lines matching specified keys from JSON file while preserving formatting."""
    with open(file_path, "r", encoding="utf-8") as f:
        lines = f.readlines()

    remove_set = set(keys_to_remove)
    filtered_lines = []

    for line in lines:
        match = re.match(r'\s*"([^"]+)":\s*', line)
        if match and match.group(1) in remove_set:
            continue
        filtered_lines.append(line)

    # Clean up multiple blank lines
    cleaned_lines = []
    last_was_blank = False
    for line in filtered_lines:
        is_blank = line.strip() == ""
        if is_blank and last_was_blank:
            continue
        cleaned_lines.append(line)
        last_was_blank = is_blank

    with open(file_path, "w", encoding="utf-8") as f:
        f.writelines(cleaned_lines)


def update_ordered_write(file_path, keys_to_update):
    """Update existing key values in place."""
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    for item in keys_to_update:
        key = item["key"]
        value = item["value"]
        # Escape special regex characters in the key
        escaped_key = re.escape(key)
        # Match the key and replace its value
        pattern = rf'("{escaped_key}":\s*")([^"]*?)(")'
        replacement = rf'\1{value}\3'
        content = re.sub(pattern, replacement, content)

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)


def preserve_ordered_write(file_path, new_keys):
    """Add new entries into appropriate category sections."""
    with open(file_path, "r", encoding="utf-8") as f:
        lines = f.readlines()

    # Categorize new keys by prefix
    categories = {
        "command-disable": [],
        "comment": [],
        "interface": [],
        "vrf": [],
        "string": [],
        "config-string": [],
        "group": [],
        "acl": [],
        "crypto": [],
        "address": [],
        "arp-insp-val": [],
        "command_hostname": [],
        "numeric": [],
        "separator": [],
        "bgp": [],
        "keyword": [],
        "other": [],
    }

    for item in new_keys:
        key = item["key"]
        match = re.match(r"^configuration\.properties\.colors\.([^.]+)\.", key)
        if match:
            prefix = match.group(1)
            if prefix in categories:
                categories[prefix].append(item)
            else:
                categories["other"].append(item)
        else:
            categories["other"].append(item)

    # Insert keys into appropriate sections
    for category, keys_to_add in categories.items():
        if not keys_to_add:
            continue

        # Determine preferred section marker and label
        sample_key = keys_to_add[0]["key"]
        section_marker = f"_comment_colors_{category.replace('_', '-')}"
        category_label = " ".join(word.capitalize() for word in category.split("-"))

        # Overrides to align with existing NLS section names
        overrides = {
            "separator": ("_comment_colors_separator", "Separator"),
            "comment": ("_comment_colors_comments", "Comments"),
            "address": ("_comment_colors_addresses", "Addresses"),
            "numeric": ("_comment_colors_numeric", "Numeric"),
            "interface": ("_comment_colors_interfaces", "Interfaces"),
            "keyword": ("_comment_colors_keywords", "Keywords"),
            "vrf": ("_comment_colors_vrf", "VRF"),
            "string": ("_comment_colors_strings", "Strings"),
            "config-string": ("_comment_colors_config_strings", "Config Strings"),
            "bgp": ("_comment_colors_bgp", "BGP"),
            "group": ("_comment_colors_groups", "Groups"),
            "acl": ("_comment_colors_acl", "ACL"),
            "crypto": ("_comment_colors_crypto", "Crypto"),
            "arp-insp-val": ("_comment_colors_arp", "ARP"),
            "command_hostname": ("_comment_colors_command", "Command Hostname"),
            "command-disable": ("_comment_colors_command_disable", "Command Disable"),
        }

        # Special-case extended Groups if we detect group.qos.* keys
        if category == "group" and ".group.qos." in sample_key:
            section_marker = "_comment_colors_groups_extended"
            category_label = "Groups Extended"
        elif category in overrides:
            section_marker, category_label = overrides[category]
        section_index = -1

        for i, line in enumerate(lines):
            if f'"{section_marker}"' in line:
                section_index = i
                break

        if section_index == -1:
            # Create new section
            insert_index = len(lines) - 1
            while insert_index > 0 and not lines[insert_index].strip().startswith("}"):
                insert_index -= 1

            last_key_index = insert_index - 1
            while (
                last_key_index > 0
                and (lines[last_key_index].strip() == "" or lines[last_key_index].strip() == "}")
            ):
                last_key_index -= 1

            last_line = lines[last_key_index]
            if (
                last_line.strip()
                and not last_line.strip().endswith(",")
                and not last_line.strip().startswith('"_comment')
            ):
                lines[last_key_index] = re.sub(r"([^,\s])(\s*)$", r"\1,\2", last_line)

            # category_label and section_marker already determined above

            new_lines = [
                "\n",
                f'  "{section_marker}": "Token Colors - {category_label}",\n',
            ]
            for idx, item in enumerate(keys_to_add):
                is_last = idx == len(keys_to_add) - 1
                if is_last:
                    new_lines.append(f'  "{item["key"]}": "{item["value"]}"\n')
                else:
                    new_lines.append(f'  "{item["key"]}": "{item["value"]}",\n')

            lines = lines[:insert_index] + new_lines + lines[insert_index:]
        else:
            # Find end of section
            end_index = section_index + 1
            while end_index < len(lines):
                line = lines[end_index].strip()
                if line.startswith('"_comment') or line.startswith("}"):
                    break
                end_index += 1

            # Find last key in section
            last_key_index = end_index - 1
            while last_key_index > section_index and lines[last_key_index].strip() == "":
                last_key_index -= 1

            # Find insertion point (after last key, before any blank lines)
            insert_position = last_key_index + 1

            # Add comma if needed
            if last_key_index > section_index:
                last_line = lines[last_key_index]
                if last_line.strip() and not last_line.strip().endswith(","):
                    lines[last_key_index] = re.sub(r"([^,\s])(\s*)$", r"\1,\2", last_line)

            # Insert new keys
            new_lines = []
            for idx, item in enumerate(keys_to_add):
                is_last = idx == len(keys_to_add) - 1
                # If the next line is a closing brace, avoid trailing comma
                next_line = lines[end_index].strip() if end_index < len(lines) else "}"
                if is_last and next_line.startswith('}'):
                    new_lines.append(f'  "{item["key"]}": "{item["value"]}"\n')
                else:
                    new_lines.append(f'  "{item["key"]}": "{item["value"]}",\n')
            lines = lines[:insert_position] + new_lines + lines[insert_position:]

    with open(file_path, "w", encoding="utf-8") as f:
        f.writelines(lines)


def extract_scopes_from_text_mate_rules(file_path):
    """Extract scopes and colors from textMateRules.json."""
    data = read_json_file(file_path)
    rules = data.get("editor.tokenColorCustomizations", {}).get("textMateRules", [])
    scope_color_map = {}

    for rule in rules:
        scopes = rule.get("scope", [])
        if isinstance(scopes, str):
            scopes = [scopes]
        color = rule.get("settings", {}).get("foreground")
        if color:
            for scope in scopes:
                scope_color_map[scope] = color

    return scope_color_map


def generate_config_key_from_scope(scope):
    """Infer configKey from scope."""
    if scope.startswith("entity.name.tag."):
        return scope.replace("entity.name.tag.", "")
    elif scope.startswith("entity.name.class."):
        return scope.replace("entity.name.class.", "")
    elif scope.startswith("entity.other."):
        return scope.replace("entity.other.", "")
    elif scope.startswith("keyword.other.config-keyword."):
        return scope.replace("keyword.other.config-keyword.", "keyword.")
    elif scope.startswith("keyword.other.group."):
        return scope.replace("keyword.other.group.", "group.")
    elif scope.startswith("keyword.other.address."):
        # Handle address variants: ipv6.condensed, ipv6.full, ipv4.full, etc.
        return scope.replace("keyword.other.", "")
    elif scope.startswith("keyword.other."):
        return scope.replace("keyword.other.", "")
    elif scope.startswith("meta.function-call."):
        return scope.replace("meta.function-call.", "")
    elif scope.startswith("string.other."):
        return scope.replace("string.other.", "string.")
    elif scope.startswith("constant."):
        return scope.replace("constant.", "")
    elif scope.startswith("comment."):
        result = scope.replace("comment.block.", "comment.")
        result = result.replace("comment.line.config", "comment.line")
        return result
    elif scope.startswith("punctuation."):
        return scope.replace("punctuation.", "")
    return scope


def load_existing_scope_mappings():
    """Load existing scope mappings."""
    try:
        return read_json_file(scope_mappings_path)
    except:
        return []


def generate_scope_mappings(scope_color_map):
    """Generate scope mappings from textMateRules."""
    existing = load_existing_scope_mappings()
    existing_map = {m["scope"]: m["configKey"] for m in existing}

    mappings = []
    for scope in scope_color_map:
        config_key = existing_map.get(scope) or generate_config_key_from_scope(scope)
        mappings.append({"configKey": config_key, "scope": scope})

    # Sort by scope
    mappings.sort(key=lambda m: m["scope"])
    return mappings


def update_package_json(mappings):
    """Update package.json with color configuration."""
    pkg = read_json_file(package_json_path)
    if "contributes" not in pkg:
        pkg["contributes"] = {}
    if "configuration" not in pkg["contributes"]:
        pkg["contributes"]["configuration"] = []

    config = pkg["contributes"]["configuration"][0]
    if not config:
        return pkg

    if "properties" not in config:
        config["properties"] = {}
    colors_obj = config["properties"].get("cisco-config-highlight.colors")
    if not colors_obj:
        return pkg
    if "properties" not in colors_obj:
        colors_obj["properties"] = {}

    seen_keys = set()
    for mapping in mappings:
        config_key = mapping["configKey"]
        seen_keys.add(config_key)
        if config_key not in colors_obj["properties"]:
            colors_obj["properties"][config_key] = {
                "type": "string",
                "format": "color",
                "markdownDescription": f"%configuration.properties.colors.{config_key}.description%",
            }

    # Remove obsolete entries
    keys_to_remove = [
        key
        for key in colors_obj["properties"]
        if key not in seen_keys
    ]
    for key in keys_to_remove:
        del colors_obj["properties"][key]

    # Sort properties alphabetically for consistent ordering
    colors_obj["properties"] = dict(sorted(colors_obj["properties"].items()))

    return pkg


def update_package_nls(mappings):
    """Update NLS file with scope descriptions."""
    existing_nls = read_json_file(package_nls_path)
    new_keys = []
    keys_to_update = []
    keys_to_remove = []

    # Build valid keys set
    valid_color_keys = set()
    for mapping in mappings:
        nls_key = f"configuration.properties.colors.{mapping['configKey']}.description"
        valid_color_keys.add(nls_key)

    # Find new keys and updates
    for mapping in mappings:
        nls_key = f"configuration.properties.colors.{mapping['configKey']}.description"
        if nls_key not in existing_nls:
            new_keys.append({"key": nls_key, "value": mapping["scope"]})
        elif existing_nls[nls_key] != mapping["scope"]:
            keys_to_update.append({"key": nls_key, "value": mapping["scope"]})

    # Find obsolete keys
    for key in existing_nls:
        if (
            re.match(r"^configuration\.properties\.colors\..+\.description$", key)
            and key != "configuration.properties.colors.description"
            and key not in valid_color_keys
        ):
            keys_to_remove.append(key)

    return {
        "existing_nls": existing_nls,
        "new_keys": new_keys,
        "keys_to_update": keys_to_update,
        "keys_to_remove": keys_to_remove,
    }


def update_package_nls_ja(mappings):
    """Update Japanese NLS file with scope descriptions."""
    existing_nls = read_json_file(package_nls_ja_path)
    new_keys = []
    keys_to_update = []
    keys_to_remove = []

    # Build valid keys set
    valid_color_keys = set()
    for mapping in mappings:
        nls_key = f"configuration.properties.colors.{mapping['configKey']}.description"
        valid_color_keys.add(nls_key)

    # Find new keys and updates
    for mapping in mappings:
        nls_key = f"configuration.properties.colors.{mapping['configKey']}.description"
        if nls_key not in existing_nls:
            new_keys.append({"key": nls_key, "value": mapping["scope"]})
        elif existing_nls[nls_key] != mapping["scope"]:
            keys_to_update.append({"key": nls_key, "value": mapping["scope"]})

    # Find obsolete keys
    for key in existing_nls:
        if (
            re.match(r"^configuration\.properties\.colors\..+\.description$", key)
            and key != "configuration.properties.colors.description"
            and key not in valid_color_keys
        ):
            keys_to_remove.append(key)

    return {
        "existing_nls": existing_nls,
        "new_keys": new_keys,
        "keys_to_update": keys_to_update,
        "keys_to_remove": keys_to_remove,
    }


def main():
    scope_color_map = extract_scopes_from_text_mate_rules(text_mate_rules_path)
    mappings = generate_scope_mappings(scope_color_map)

    if dry_run:
        print(f"[dry-run] Would update {len(mappings)} scope mappings")
        print("\nGenerated mappings:")
        for mapping in mappings[:5]:
            print(f"  {mapping['configKey']} -> {mapping['scope']}")
        if len(mappings) > 5:
            print(f"  ... and {len(mappings) - 5} more")

        nls_result = update_package_nls(mappings)
        nls_ja_result = update_package_nls_ja(mappings)

        print(f"\nWould add {len(nls_result['new_keys'])} new keys to package.nls.json")
        if nls_result["keys_to_update"]:
            print(f"Would update {len(nls_result['keys_to_update'])} scope values in package.nls.json")
        if nls_result["keys_to_remove"]:
            print(f"Would remove {len(nls_result['keys_to_remove'])} obsolete keys from package.nls.json:")
            for key in nls_result["keys_to_remove"]:
                print(f"  - {key}")

        print(f"Would add {len(nls_ja_result['new_keys'])} new keys to package.nls.ja.json")
        if nls_ja_result["keys_to_update"]:
            print(f"Would update {len(nls_ja_result['keys_to_update'])} scope values in package.nls.ja.json")
        if nls_ja_result["keys_to_remove"]:
            print(f"Would remove {len(nls_ja_result['keys_to_remove'])} obsolete keys from package.nls.ja.json")

        print(f"\nWould update:")
        print(f"  - {scope_mappings_path.relative_to(repo_root)}")
        print(f"  - {package_json_path.relative_to(repo_root)}")
        if nls_result["new_keys"] or nls_result["keys_to_remove"]:
            print(f"  - {package_nls_path.relative_to(repo_root)}")
        if nls_ja_result["new_keys"] or nls_ja_result["keys_to_remove"]:
            print(f"  - {package_nls_ja_path.relative_to(repo_root)}")
        return

    # Execute updates
    updated_pkg = update_package_json(mappings)
    nls_result = update_package_nls(mappings)
    nls_ja_result = update_package_nls_ja(mappings)

    write_json_file(scope_mappings_path, mappings)
    write_json_file(package_json_path, updated_pkg)

    if nls_result["keys_to_remove"]:
        remove_ordered_write(package_nls_path, nls_result["keys_to_remove"])

    if nls_result["keys_to_update"]:
        update_ordered_write(package_nls_path, nls_result["keys_to_update"])

    if nls_result["new_keys"]:
        preserve_ordered_write(package_nls_path, nls_result["new_keys"])

    if nls_ja_result["keys_to_remove"]:
        remove_ordered_write(package_nls_ja_path, nls_ja_result["keys_to_remove"])

    if nls_ja_result["keys_to_update"]:
        update_ordered_write(package_nls_ja_path, nls_ja_result["keys_to_update"])

    if nls_ja_result["new_keys"]:
        preserve_ordered_write(package_nls_ja_path, nls_ja_result["new_keys"])

    print(f"Updated {len(mappings)} scope mappings")
    print(f"  - {scope_mappings_path.relative_to(repo_root)}")
    print(f"  - {package_json_path.relative_to(repo_root)}")
    if nls_result["keys_to_remove"] or nls_result["new_keys"]:
        print(
            f"  - {package_nls_path.relative_to(repo_root)} "
            f"(added {len(nls_result['new_keys'])}, removed {len(nls_result['keys_to_remove'])})"
        )
    if nls_ja_result["keys_to_remove"] or nls_ja_result["new_keys"]:
        print(
            f"  - {package_nls_ja_path.relative_to(repo_root)} "
            f"(added {len(nls_ja_result['new_keys'])}, removed {len(nls_ja_result['keys_to_remove'])})"
        )


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
