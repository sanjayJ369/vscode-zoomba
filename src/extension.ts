import * as vscode from 'vscode';


export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "zoomba" is now active!');
	const disposable = vscode.commands.registerCommand('zoomba.helloWorld', () => {
		vscode.window.showInformationMessage('Hello World from zoomba!');
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {}
