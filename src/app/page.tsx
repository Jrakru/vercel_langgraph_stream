"use client";

import Chatlist from "@/components/ChatList";
import ChatScrollAnchor from "@/components/ChatScrollAnchor";
import { Button } from "@/components/ui/button";
import { useEnterSubmit } from "@/lib/use-enter-submit";
import { SubmitHandler } from "react-hook-form";
import { useForm } from "@/lib/use-form";
import TextareaAutosize from "react-textarea-autosize";
import { ArrowDownIcon, PlusIcon } from "lucide-react";
import { z } from "zod";
import { useActions, useUIState } from "ai/rsc";
import type { AI } from "./action";
import { AssistantMessage, UserMessage } from "@/components/llm/message";

const chatSchema = z.object({
	message: z.string().min(1, "Message is required"),
});

export type ChatInput = z.infer<typeof chatSchema>;

export default function Home() {
	const form = useForm<ChatInput>();
	const { formRef, onKeyDown } = useEnterSubmit();
	const [messages, setMessages] = useUIState<typeof AI>();
	const { sendMessage } = useActions<typeof AI>();

	const onSubmit: SubmitHandler<ChatInput> = async (data) => {
		const value = data.message.trim();
		formRef.current?.reset(); //reset the form on submit i.e. clear the input field
		if (!value) return;

		setMessages((currentMessages) => [
			...currentMessages,
			{ id: Date.now(), role: "user", display: <UserMessage>{value}</UserMessage> },
		]);
		try {
			const responseMessage = await sendMessage(value);
			setMessages((currentMessages) => [
				...currentMessages,
				{
					id: Date.now(),
					role: "assistant",
					display: <AssistantMessage>{responseMessage.display}</AssistantMessage>,
				},
			]);
		} catch (error) {
			console.error(error);
		}
	};

	return (
		<main>
			<div className="pb-[200px] pt-4 md:pt-10 ">
				<Chatlist messages={messages}></Chatlist>
				<ChatScrollAnchor />
			</div>
			<div className="fixed inset-x-0 bottom-0 w-full bg-gradient-to-b from-muted/30 from-0% to-muted/30 to-50% duration-300 ease-in-out animate-in dark:from-background/10 dark:from-10% dark:to-background/80 peer-[[data-state=open]]:group-[]:lg:pl-[250px] peer-[[data-state=open]]:group-[]:xl:pl-[300px]">
				<div className="mx-auto sm:max-w-2xl sm-px-4">
					<div className="px-3 flex justify-center flex-col py-2 space-y-4 border-t shadow-lg sm:rounded-t-xl sm:border md:py-4 bg-white ">
						<form ref={formRef} onSubmit={form.handleSubmit(onSubmit)} action="">
							<div className="relative flex flex-col w-full overflow-hidden bg-background max-h-60 grow sm:rounded-md sm:border">
								<TextareaAutosize
									tabIndex={0}
									className="min-h-[40px] w-full resize-none bg-transparent pl-4 pr-16 py-[1.3rem] focus-within:outline-none sm:text-sm"
									autoFocus
									spellCheck={false}
									autoCorrect="off"
									autoComplete="off"
									rows={1}
									onKeyDown={onKeyDown}
									placeholder="Send a message"
									{...form.register("message")}
								/>
								<div className="absolute right-0 top-4 sm:right-4">
									<Button type="submit" size="icon" disabled={!form.watch("message")}>
										<ArrowDownIcon className="w-5 h-5" />
										<span className="sr-only">Send message</span>
									</Button>
								</div>
							</div>
						</form>

						<Button
							variant="outline"
							size="lg"
							className="p-4 mt-4 rounded-full bg-background"
							onClick={(e) => {
								e.preventDefault();
								window.location.reload();
							}}>
							<PlusIcon className="w-5 h-5" />
							<span>New Chat</span>
						</Button>
					</div>
				</div>
			</div>
		</main>
	);
}
