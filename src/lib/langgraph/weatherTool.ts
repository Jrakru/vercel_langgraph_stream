import { ToolNode } from "@langchain/langgraph/prebuilt";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { END, MemorySaver, MessagesAnnotation, START, StateGraph } from "@langchain/langgraph";
import { AIMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import { tool } from "@langchain/core/tools";
import { z } from "zod";

import { config } from "dotenv";
config(); // Load environment variables from the .env file

// Define the getWeather tool

const getWeather = tool(
	async ({ city }: { city: string }) => {
		console.log("\x1b[32m%s\x1b[0m", `getWeather function started for ${city}`);
		const startTime = Date.now();

		// Add a 2-second delay
		await new Promise((resolve) => setTimeout(resolve, 2000));

		const endTime = Date.now();
		const duration = (endTime - startTime) / 1000; // Convert to seconds
		console.log(
			"\x1b[32m%s\x1b[0m",
			`getWeather function completed for ${city}. Duration: ${duration} seconds`
		);

		return `The weather in ${city} is rainy and perfect!!!`;
	},
	{
		name: "get_weather",
		description: "Call to get the current weather for a specific city.",
		schema: z.object({
			city: z.string().describe("The city to get the weather for."),
		}),
	}
);

const llm = new ChatOpenAI({
	model: "gpt-4o",
	temperature: 0,
});

// Use the getWeather tool
const tools = [getWeather];
const toolNode = new ToolNode(tools);

const callModel = async (state: typeof MessagesAnnotation.State) => {
	const { messages } = state;

	const llmWithTools = llm.bindTools(tools);
	const result = await llmWithTools.invoke(messages);
	return { messages: [result] };
};

const shouldContinue = (state: typeof MessagesAnnotation.State) => {
	const { messages } = state;

	const lastMessage = messages[messages.length - 1];
	if (lastMessage._getType() !== "ai" || !(lastMessage as AIMessage).tool_calls?.length) {
		// LLM did not call any tools, or it's not an AI message, so we should end.
		return END;
	}
	return "tools";
};

/**
 * MessagesAnnotation is a pre-built state annotation imported from @langchain/langgraph.
 * It is the same as the following annotation:
 *
 * ```typescript
 * const MessagesAnnotation = Annotation.Root({
 *   messages: Annotation<BaseMessage[]>({
 *     reducer: messagesStateReducer,
 *     default: () => [systemMessage],
 *   }),
 * });
 * ```
 */
const workflow = new StateGraph(MessagesAnnotation)
	.addNode("agent", callModel)
	.addEdge(START, "agent")
	.addNode("tools", toolNode)
	.addEdge("tools", "agent")
	.addConditionalEdges("agent", shouldContinue, ["tools", END]);

export const graph = workflow.compile({
	// Uncomment the following if running locally
	// checkpointer: new MemorySaver(),
});
