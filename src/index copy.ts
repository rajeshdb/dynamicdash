//import  {ChatOpenAI}  from "@langchain/openai";

//const model = new ChatOpenAI({ 
//    apiKey:"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"
// });

//await model.invoke("Hello, world!")

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage } from "@langchain/core/messages";
import { AgentExecutor, OpenApiToolkit } from "langchain/agents";
import { createReactAgent } from "@langchain/langgraph/prebuilt";

import { JsonSpec } from "langchain/tools";
import { pull } from "langchain/hub";
import { PromptTemplate } from "@langchain/core/prompts";

const model = new ChatGoogleGenerativeAI({
  model: "gemini-2.0-flash",
  maxOutputTokens: 2048,
  apiKey:"AIzaSyAXUrfB6900pKHdkwavIGytiKn5ZQc8PBA"
});
//const response = await model.invoke("what is 4+4");
//console.log(response);
async function loadToolkitFromUrl(specUrl: string) {
    const response = await fetch(specUrl);
    const specJson = await response.json();
  console.log(specJson);
    const toolkit = new OpenApiToolkit(
      new JsonSpec(specJson),
      model,
      {} // Optional HTTP headers for API calls
    );
  
    return toolkit;
  }
  
  // Example usage:
  const toolkit = await loadToolkitFromUrl("https://petstore.swagger.io/v2/swagger.json");
  //toolkit.invoke({input: "What are the required query parameters for GET request to the /pets endpoint??"});

  const prompt = await pull<PromptTemplate>("hwchase17/react");
 const tools =toolkit.getTools();
 console.log(
    tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
    }))
  );
  const agent = createReactAgent({ llm:model,  tools});


  const exampleQuery =
  "query json_explorer and then use the result to  construct the request for  store/inventory ";
 //"execute a requests_get call on /store/inventory endpoint and return result ";

const events = await agent.stream(
  { messages: [["user", exampleQuery],["user", exampleQuery]] },
  { streamMode: "values" }
);

for await (const event of events) {
  const lastMsg = event.messages[event.messages.length - 1];
  console.log(lastMsg);
 /* if (lastMsg?.tool_calls?.length) {
    console.dir(lastMsg.tool_calls, { depth: null });
  } else if (lastMsg?.content) {
    console.log(lastMsg.content);
  }*/
}



