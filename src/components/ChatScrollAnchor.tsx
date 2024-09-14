"use client";

import { useAtBottom } from "@/lib/use-at-bottom";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";

const ChatScrollAnchor = () => {
	const trackVisibility = true;

	const isAtBottom = useAtBottom();
	const { ref, entry, inView } = useInView({
		trackVisibility: true,
		delay: 100,
		rootMargin: "0px 0px -50px 0px",
	});

	useEffect(() => {
		if (isAtBottom && trackVisibility && !inView) {
			entry?.target.scrollIntoView({
				block: "start",
			});
		}
	}, [isAtBottom, inView, entry, trackVisibility]);

	return <div ref={ref} className="h-px w-full" />;
};

export default ChatScrollAnchor;
