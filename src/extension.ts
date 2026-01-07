import * as vscode from 'vscode';
import { registerOutlineSymbolProvider } from './registerOutlineSymbol';
import { registerTokenColorCustomization } from './registerTokenColors';
import { registerUpdateInfo } from './registerUpdateInfo';

export const outputChannel = vscode.window.createOutputChannel('Cisco Config Highlight');

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  try {
    await registerUpdateInfo(context);
  } catch (err) {
    outputChannel.appendLine(String(err));
  }
  registerOutlineSymbolProvider(context);

  // Register token color customization (Option 2)
  registerTokenColorCustomization(context);
}
