import { cn } from "@/lib/utils";
import { LoaderCircle } from "lucide-react";

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
	return (
		<LoaderCircle
			role="status"
			aria-label="Loading"
			className={cn("size-4 animate-spin", className)}
			{...props}
		/>
	);
}

export { Spinner };
