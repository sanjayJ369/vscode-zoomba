import * as vscode from "vscode";
import { runCoverage, stopCoverage } from "./runCoverage";

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "zoomba" is now active!');
  const startCoverage = vscode.commands.registerCommand(
    "zoomba.runCoverage",
    () => {
      runCoverage(context);
    }
  );

  const disposeCoverage = vscode.commands.registerCommand(
    "zoomba.stopCoverage",
    stopCoverage
  );

  context.subscriptions.push(disposeCoverage);
  context.subscriptions.push(startCoverage);
}

export function deactivate() {}
