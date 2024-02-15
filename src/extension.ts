import * as vscode from 'vscode';
import PickItemCommand from './commands/pick-item';
import ReviewCommand from './commands/review';
import SayHelloCommand from './commands/say-hello';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "code-booster" is now active!');

	const button = vscode.window.createStatusBarItem(
		vscode.StatusBarAlignment.Left,
		0
	);
	button.command = 'codeBooster.review';
	button.text = 'Review'

	context.subscriptions.push(
		vscode.commands.registerCommand('codeBooster.sayHello', SayHelloCommand),
		vscode.commands.registerCommand('codeBooster.pickItem', PickItemCommand),
		vscode.commands.registerCommand('codeBooster.review', ReviewCommand),
		button,
	);

	button.show();
}

// This method is called when your extension is deactivated
export function deactivate() {}
