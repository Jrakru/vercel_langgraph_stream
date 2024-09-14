import type { UIState } from "@/app/action";

interface ChatlistProps {
	messages: UIState;
}

const Chatlist = ({ messages }: ChatlistProps) => {
	if (!messages.length) return null;
	return (
		<div className="relative mx-auto max-w-2xl">
			{messages.map((message) => (
				<div key={message.id} className="pb-4">
					{message.display}
				</div>
			))}
		</div>
	);
};

export default Chatlist;
