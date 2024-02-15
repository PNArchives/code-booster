import * as vscode from 'vscode';

export default async function () {
    const commands = await vscode.commands.getCommands();
    const options = commands.map(cmd => {
        return {
            label: cmd,
            description: `コマンド ${cmd} の説明です`,
        }
    })
    const selectedCommand = await vscode.window.showQuickPick(options, {
        placeHolder: 'どれかを選んでください',
    })
    if (selectedCommand) {
        const message = `選択されたコマンドは ${selectedCommand!.label} です`;
        vscode.window.showInformationMessage(message);
    } else {
        vscode.window.showInformationMessage('何も選択されていません');
    }
}
