import * as vscode from 'vscode';
import assistant from '../assistant';
// import assistant from '../assistant';

/* ToDo
- [ ] API Keyの保存の仕方を考える
- [ ] instructionを考え直す (機能実装なのかテストなのかで違う、複数のアシスタントを準備すべき?)
- [ ] 取得するコードの範囲を変える
- [ ] スレッドを削除するタイミング
*/

const insertBlockComment = async (editor: vscode.TextEditor, selectionIndex: number, comment: string) => {
  await editor.edit(async (edit) => {
      const position = new vscode.Position(editor.selections[selectionIndex].end.line, 0)
      edit.insert(position, comment+"\n")

      // const lineCount = comment.split('\n').length
      // const range = new vscode.Range(
      //   new vscode.Position(position.line, 0),
      //   new vscode.Position(position.line + lineCount, 0),
      // );
      // console.log(range)
      // await vscode.commands.executeCommand('editor.action.blockComment', range)
  })
}

const updateInstructions = async () => {
  const text = `Please respond in Japanese.

Function 1: Check and improve variable, constant, and function names for readability and maintainability.
Details:
- Analyze names of variables, constants, and functions.
- Evaluate if names represent their functionality clearly.
- Confirm adherence to programming conventions (e.g., camel case, snake case).
- Propose better names when appropriate, explaining the reasons.

Function 2: Identify and improve code affecting performance.
Details:
- Identify performance-affecting patterns (e.g., nested loops, improper data structure use).
- Propose specific improvements to address these issues, explaining their impact.

Function 3: Suggest guard clauses for readability.
Details:
- Identify factors reducing readability (e.g., deep nesting, complex conditionals).
- Propose specific improvements (e.g., guard clauses), explaining their readability enhancement.`
  const gpt4model = "gpt-4-turbo-preview";
  await assistant.updateInstructions(text);
}

export default async function (context: vscode.ExtensionContext) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        console.error('開いているエディタがありません!');
        return;
    }

    const filePath = editor.document.fileName

    if (editor.selections.length === 0) {
        vscode.window.showInformationMessage('No selection!');
        return;
    }

    updateInstructions()

    const selection = editor.selections[0];
    const selectContent = editor.document.getText(selection);

    const run = await assistant.createThreadAndRun(filePath, selectContent);
    if (!run) {
        vscode.window.showInformationMessage('スレッドの作成に失敗しました');
        return;
    }

    const ok = await assistant.checkRunStatus(run.thread_id, run.id, 3_000, 120_000);
    if (!ok) {
        vscode.window.showInformationMessage('スレッドの実行に失敗しました');
        await assistant.deleteThread(filePath);
        return;
    }

    const response = await assistant.getLastMessage(filePath);
    await insertBlockComment(editor, 0, response)
    await assistant.deleteThread(filePath);
}
