import OpenAI from 'openai';
import * as vscode from 'vscode';

const apiKey = process.env['OPENAI_API_KEY'];
const ai = new OpenAI({
    apiKey: apiKey,
});
// const defaultInstruction = `変数、定数、関数の命名チェックと改善提案
// 目的: コードの可読性と保守性を高めるために、変数、定数、関数の命名が適切で意味が明確かどうかをチェックし、必要に応じて改善案を提案する。`
const assistantID = 'asst_9rbZ3yXnZJhXH6Eatsxdz2RS';

const listMessages = async (threadID: string) => {
    const threadMessages = await ai.beta.threads.messages.list(threadID);
    console.log('---------- メッセージ一覧 ----------');
    console.log(threadMessages);
    console.log();
    return threadMessages;
}
const createThreadAndRun = async (message: string) => {
    const run = await ai.beta.threads.createAndRun({
        assistant_id: assistantID,
        thread: {
            messages: [
                {
                    role: "user",
                    content: message,
                },
            ],
        },
    });
    console.log(`New Thread ID: ${run.thread_id}, Run ID: ${run.id}`);
    return run;
}
const deleteThread = async (threadID: string) => {
    const result = await ai.beta.threads.del(threadID);
    if (result.deleted) {
        console.log(`Thread ${threadID} deleted.`);
    } else {
        console.error(`Failed to delete thread ${threadID}.`);
    }
}

export default async function (context: vscode.ExtensionContext) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        console.log('No editor!');
        return;
    }

    const filePath = editor.document.fileName
    console.log(`File path: ${filePath}`)

    const { document, selections } = editor;
    if (selections.length === 0) {
        vscode.window.showInformationMessage('No selection!');
        return;
    }

    const code = document.getText(selections[0])
    console.log(`Code:\n${code}`)

    const newRun = await createThreadAndRun(code);

    while(true) {
        await new Promise(resolve => setTimeout(resolve, 5000));

        const run = await ai.beta.threads.runs.retrieve(newRun.thread_id, newRun.id);
        console.log(`Run's status = ${run.status}`)
        if (run.status == 'completed') {
            console.log(`Total token usage = ${run.usage?.total_tokens ?? -1}`)
            break
        }
    }

    const messages = await listMessages(newRun.thread_id);
    await deleteThread(newRun.thread_id);
    console.log('---------- ---------- ----------');
    messages.data[0].content.forEach((content) => {
        const message = content as OpenAI.Beta.Threads.Messages.MessageContentText
        console.log(`=> ${message.text.value}`)
    })

/* ToDo
- API Keyの保存の仕方を考える
- instructionを考え直す
- 取得するコードの範囲を変える
- スレッドを削除するタイミング
*/

    // await editor.edit(async (editBuilder) => {
    //     if (selections.length === 0) {
    //         vscode.window.showWarningMessage('No selection!');
    //         return;
    //     }
    //     await vscode.commands.executeCommand('editor.action.insertLineAfter')

    //     selections.forEach(async (selection) => {
    //         const response = '以下はレビュー結果です:\nhello world!'
    //         response.split('\n').forEach(async (line) => {
    //             await editBuilder.insert(selection.end, `${line}\n`)
    //         })
    //     })

        // const response = '以下はレビュー結果です:\nhello world!'
        // const insertPos = new vscode.Position(selection.end.line + 1, 0);
        // const content = `\n${response}\n\n`;
        // await editBuilder.insert(insertPos, content);

        // const lineCount = response.split('\n').length;
        // const range = new vscode.Range(
        //     new vscode.Position(selection.end.line + 1, 0),
        //     new vscode.Position(selection.end.line + 1 + lineCount, 0),
        // );
        // console.log(range)
        // await vscode.commands.executeCommand('editor.action.blockComment', range)
    // })

}
