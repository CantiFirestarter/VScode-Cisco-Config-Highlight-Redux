import * as vscode from 'vscode';
import { registerOutlineSymbolProvider } from './registerOutlineSymbol';
import { registerUpdateInfo } from './registerUpdateInfo';

export function activate(context: vscode.ExtensionContext): void {
  registerUpdateInfo(context);
  registerOutlineSymbolProvider(context);
}
