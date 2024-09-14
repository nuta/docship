import { format, styleText } from "util";

export function progress(...args: any[]) {
	console.log(
		styleText(["blue", "bold"], "==>"),
		styleText(["bold"], format(...args)),
	);
}
