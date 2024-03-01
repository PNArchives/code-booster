import OpenAI from 'openai';

const apiKey = process.env['OPENAI_API_KEY'];
const assistantID = 'asst_9rbZ3yXnZJhXH6Eatsxdz2RS';

const openai = new OpenAI({
    apiKey: apiKey,
});

const threadMap = new Map();

const updateInstructions = async (instructions: string, model: string = "gpt-3.5-turbo-0125") => {
  const myUpdatedAssistant = await openai.beta.assistants.update(
    assistantID,
    {
      model: model,
      name: "Code Booster",
      description: "コードレビューのアシスタントです",
      instructions: instructions,
      tools: [],
      file_ids: [],
    }
  );
  console.log(myUpdatedAssistant);
  console.log('---------- 更新後のアシスタント ----------');
  console.log(`モデル: ${myUpdatedAssistant.model}`);
  console.log(`指示: ${myUpdatedAssistant.instructions?.substring(0, 60)} ...`);
  console.log('---------- ------------ ----------');
}

const createThreadAndRun = async (filePath: string, message: string) => {
  const threadID = threadMap.get(filePath);
  if (threadID) {
    console.error(`このファイル用のスレッドはすでに作成されました: ${threadID}`);
    return;
  }
  const run = await openai.beta.threads.createAndRun({
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
  console.log(`【スレッド作成】Thread ID: ${run.thread_id}, Run ID: ${run.id}`);
  threadMap.set(filePath, run.thread_id);
  return run;
}

const listMessages = async (filePath: string) => {
  const threadID = threadMap.get(filePath);
  if (!threadID) {
    console.error(`Thread ID not found for ${filePath}.`);
    return;
  }
  const threadMessages = await openai.beta.threads.messages.list(threadID);
  console.log('---------- メッセージ一覧 ----------');
  console.log(threadMessages);
  console.log('---------- ------------ ----------');
  return threadMessages;
}

const getLastMessage = async (filePath: string): Promise<string> => {
  const messages = await listMessages(filePath);
  if (!messages) {
    console.error(`メッセージの取得に失敗しました`);
    return "";
  }
  const contents = messages.data[0].content;
  const lastMessage = contents[contents.length-1] as OpenAI.Beta.Threads.Messages.MessageContentText;
  return lastMessage.text.value;
}

const deleteThread = async (filePath: string) => {
  const threadID = threadMap.get(filePath);
  if (!threadID) {
    console.error(`Thread ID not found for ${filePath}.`);
    return;
  }
  const result = await openai.beta.threads.del(threadID);
  if (result.deleted) {
    console.log(`【スレッド削除】Thread ID: ${threadID}`);
    threadMap.delete(filePath);
  } else {
    console.error(`Failed to delete thread ${threadID}.`);
  }
}

const isRunCompleted = async (threadID: string, runID: string): Promise<boolean> => {
  const run = await openai.beta.threads.runs.retrieve(threadID, runID);
  console.log(`Run's status = ${run.status}`);
  if (run.status == 'completed') {
    console.log(`Total token usage = ${run.usage?.total_tokens ?? -1}`);
    return true;
  }
  return false;
}

const checkRunStatus = async (threadID: string, runID: string, interval: number, timeout: number): Promise<boolean> => {
  let time = 0;
  while (true) {
    time += interval;
    await new Promise(resolve => setTimeout(resolve, interval));
    const isCompleted = await isRunCompleted(threadID, runID);
    if (isCompleted) {
      return true;
    }
    if (time > timeout) {
      console.error(`Run timed out after ${timeout} seconds.`);
      return false;
    }
  }
}

export default {
  updateInstructions,
  createThreadAndRun,
  checkRunStatus,
  listMessages,
  getLastMessage,
  deleteThread,
}
