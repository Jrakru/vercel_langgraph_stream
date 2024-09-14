"use server"; // there is an issues with react 4.3.9 where they did some optimizations that broke AI.

import { createAI, getMutableAIState, streamUI } from "ai/rsc";
import type { ReactNode } from "react";
import type { CoreMessage, ToolInvocation } from "ai";
import { openai } from "@ai-sdk/openai";
import { BotCard, BotMessage } from "@/components/llm/message";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import dotenv from "dotenv";
import { sleep } from "@/lib/utils";
import { graph } from "@/lib/langgraph/weatherTool";
dotenv.config();

export type AIState = Array<{
	id?: number;
	name?: "get_crypto_price" | "get_crypto_stats";
	role: "user" | "assistant" | "system";
	content: string;
}>;

// this is the initial message we send to the LLM to instantiate it
// this give the LLM context on what it can do
const content = `\
You are a weather bot that helps users get the current weather conditions and forecast for specific locations.

Messages inside [] mean that it's a UI element or a user event. For example:

    [Weather in San Francisco] means that the interface showing the weather for San Francisco is displayed to the user.
	[Weather Forecast in San Francisco for the next 3 days] means that the interface showing the weather forecast for San Francisco for the next 3 days is displayed to the user.

If the user wants the weather in a location, call the LangChain weather tool via the get_weather function with the location name (e.g., "San Francisco", "New York"). The result will return the current temperature and weather conditions.

If the user asks for a weather forecast, call the get_weather_forecast function with the location name and number of days for the forecast.

If the user asks for anything unrelated to weather, you should respond that you are a weather bot and cannot provide that information.
`;

export const sendMessage = async (
	message: string
): Promise<{
	id: number;
	role: "user" | "assistant";
	display: ReactNode;
}> => {
	const history = getMutableAIState<typeof AI>();

	history.update([...history.get(), { role: "user", content: message }]);

	const reply = await streamUI({
		model: openai("gpt-4o"),
		messages: [{ role: "system", content, toolInvocation: [] }, ...history.get()] as CoreMessage[],
		initial: (
			<BotMessage className="items-center flex shrink-0 select-none justify-center">
				<Loader2 className="h-5 w-5 animate-spin stroke-zinc-900" />
			</BotMessage>
		),
		text: ({ content, done }) => {
			if (done) history.done([...history.get(), { role: "assistant", content }]); //syncing up state
			return <BotMessage>{content}</BotMessage>; //send message to output to screen
		},
		temperature: 0,

		//Record<string, tool> where string
		tools: {
			get_weather: {
				description:
					"Get the current weather conditions for a given location. Use this when the user asks for the current weather.",
				parameters: z.object({
					location: z
						.string()
						.describe("The location to get the weather for, e.g., 'San Francisco', 'New York'."),
				}),
				generate: async function* ({ location }: { location: string }) {
					yield (
						<BotCard>
							<Loader2 className="h-5 w-5 animate-spin stroke-zinc-900" />
						</BotCard>
					);

					// Use the weatherTool to get the weather
					const result = await graph.invoke({
						messages: [
							{
								role: "user",
								content: [{ type: "text", text: `What's the weather in ${location}?` }],
							},
						],
					});

					console.log("result", result);
					const weatherResult = result.messages[result.messages.length - 1].content;

					// Simulate API delay
					await new Promise((resolve) => setTimeout(resolve, 1000));

					return (
						<BotCard>
							<p>{weatherResult}</p>
						</BotCard>
					);
				},
			},
			get_weather_forecast: {
				description:
					"Get the weather forecast for a given location and number of days. Use this when the user asks for a weather forecast.",
				parameters: z.object({
					location: z.string().describe("The location to get the weather forecast for."),
					days: z.number().describe("The number of days for the forecast."),
				}),
				generate: async function* ({ location, days }: { location: string; days: number }) {
					yield (
						<BotCard>
							<Loader2 className="h-5 w-5 animate-spin stroke-zinc-900" />
						</BotCard>
					);

					// Mock data for the weather forecast
					const mockForecast = Array.from({ length: days }, (_, i) => ({
						day: i + 1,
						temperature: Math.floor(Math.random() * 30) + 10,
						condition: ["Sunny", "Cloudy", "Rainy", "Windy"][Math.floor(Math.random() * 4)],
					}));

					// Simulate API delay
					await new Promise((resolve) => setTimeout(resolve, 1500));

					const forecastHtml = mockForecast
						.map((day) => `<p>Day ${day.day}: ${day.temperature}°C, ${day.condition}</p>`)
						.join("");

					return (
						<BotCard>
							<div
								dangerouslySetInnerHTML={{
									__html: `<h3>Weather Forecast for ${location} (${days} days):</h3>${forecastHtml}`,
								}}
							/>
						</BotCard>
					);
				},
			},
		},
	});

	return {
		id: Date.now(),
		role: "assistant" as const,
		display: reply.value,
	};
};

export type UIState = Array<{
	id: number;
	role: "user" | "assistant";
	display: ReactNode;
	toolInvocation?: ToolInvocation[];
}>;

export const AI = createAI({
	initialAIState: [] as AIState,
	initialUIState: [] as UIState,
	actions: { sendMessage },
});
