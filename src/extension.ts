import * as vscode from "vscode";
import { runCoverage } from "./runCoverage";

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "zoomba" is now active!');
  const disposable = vscode.commands.registerCommand(
    "zoomba.runCoverage",
    () => {
      runCoverage(context);
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
