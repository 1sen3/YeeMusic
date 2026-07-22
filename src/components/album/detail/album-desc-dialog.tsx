import {
	Dialog,
	DialogBody,
	DialogContent,
	DialogTitle,
} from "../../ui/dialog";

export function AlbumDescDialog({
	open,
	onOpenChange,
	title,
	desc,
}: {
	open: boolean;
	onOpenChange?: (open: boolean) => void;
	title?: string;
	desc: string;
}) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg" showCloseButton>
				<DialogTitle>{title ?? "专辑简介"}</DialogTitle>
				<DialogBody className="max-h-[60vh] overflow-y-auto">
					<p className="whitespace-pre-wrap text-foreground/80 text-sm leading-relaxed select-text">
						{desc}
					</p>
				</DialogBody>
			</DialogContent>
		</Dialog>
	);
}
