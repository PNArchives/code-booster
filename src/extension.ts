import * as vscode from 'vscode';
import SayHelloCommand from './commands/say-hello';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "code-booster" is now active!');

	context.subscriptions.push(
		vscode.commands.registerCommand('codeBooster.sayHello', SayHelloCommand)
	);
}

// This method is called when your extension is deactivated
export function deactivate() {}
