import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage } from "@langchain/core/messages";
import { AgentExecutor, OpenApiToolkit } from "langchain/agents";
import { createReactAgent } from "@langchain/langgraph/prebuilt";

import { JsonSpec } from "langchain/tools";
import { pull } from "langchain/hub";
import { PromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";
import { StructuredOutputParser } from "langchain/output_parsers";
import { workflowSchema } from "./schema/workflowSchema.js";
import express from "express";
import { run } from "node:test";
import fs from "fs";
import { RunnableSequence } from "@langchain/core/runnables";


const answerSchema = z.object({
  answer: z.string()
});

export const apiResponseSchema = z.union([answerSchema, workflowSchema]);

async function runPlan(userprompt: string): Promise<any> {
  const model = new ChatGoogleGenerativeAI({
    model: "gemini-2.0-flash",
    maxOutputTokens: 2048,
    apiKey: "",
  });

  // 2️⃣ Combine into one workflow schema

  const parser: StructuredOutputParser<any> =
    StructuredOutputParser.fromZodSchema(apiResponseSchema as any);

  const response = await fetch("https://petstore.swagger.io/v2/swagger.json");
  //const specJson = await response.json();
  
 const specJson= JSON.parse(fs.readFileSync("../swagger.json", "utf-8")); // For testing, replace with actual JSON spec

  const jsonSpec = new JsonSpec(specJson);
  const template = `
First, determine if fulfilling the User Request requires making at least one HTTP API call to the provided API spec.
- If it requires an HTTP API call, generate a plan with a step-by-step workflow to fulfill the user's request.
- If it does NOT require an HTTP API call, do NOT generate a workflow. Instead, return a direct JSON response with the answer.
When generating a workflow:
- use  the following format {{variable_name}} to refer to variables in the plan.
- when the request says use a variable for a parameter then use it like "parameter":"{{variable_name}}" in the plan.
- if a conditionGroup has just one condition then do not use logicalOperator.
- Do NOT execute the requests. 
- Return ONLY valid JSON.
- Follow the JSON schema exactly:
{format_instructions}

API Spec:
{spec}

User Request:
{request}


`;

  const prompt = new PromptTemplate({
    template,
    inputVariables: ["spec", "request", "format_instructions"],
  });
  const debugPrompt = {
    invoke: async (input:any) => {
      console.log("Prompt being sent:\n", input);
      fs.writeFileSync("debugPrompt.json", JSON.stringify(input, null, 2), "utf-8");

      return input;
    }
  }
  // 4. Format the prompt (for debug)
const formattedPrompt = await prompt.format({
  format_instructions: parser.getFormatInstructions(),
  spec: JSON.stringify(specJson, null, 2),
  request: userprompt,
});

console.log("=== Prompt Sent to LLM ===\n");
fs.writeFileSync("formattedPrompt.json", formattedPrompt, "utf-8");

  // 4. Run the planning process
 // const chain = prompt.pipe(debugPrompt).pipe(model);
  const chain = RunnableSequence.from([
    prompt,
    model
    // You can add more steps here, like a parser
]);
  //const userRequest = "call  pet findbyStatus  as available and then filter on photoUrls attribute not equal to literal 'string' and then display that in table UI.";
  const plan = await chain.invoke({
    format_instructions: parser.getFormatInstructions(),

    spec: JSON.stringify(specJson),
    request: userprompt,
  });

  console.log(plan.content);
  return plan.content as any; // Return the plan content
}



function extractJsonFromText(input: string): any {
  // Match content inside ```json ... ```
  const match = input.match(/```json\s*([\s\S]*?)\s*```/i);
  if (!match) {
    throw new Error("No JSON code block found");
  }
  console.log("Extracted JSON:", match[1]);
  // Parse and return JSON
  try {
    return JSON.parse(match[1] as string);
  } catch (err: any) {
    throw new Error("Invalid JSON: " + err.message);
  }
}


const app = express();
const port = 3000;
app.use(express.json());
app.post("/plan", async (req: any, res: any) => {
  const userRequest = req.body.request; // Assuming the request body has a 'request' field with the user's request
  try {
    const plan = await runPlan(userRequest);
    console.log("Generated plan:", plan);
    const match = plan.match(/```json\s*([\s\S]*?)\s*```/i);
    if (match) {
      res.json(extractJsonFromText(plan));
    }
    else{
      res.send(plan);
    }
  } catch (error) {
    console.error("Error generating plan:", error);
    res.status(500).json({ error: "Failed to generate plan" });
  }
});
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
// Export the model for use in other modules
