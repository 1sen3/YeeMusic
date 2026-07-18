import { Edit24Filled } from "@fluentui/react-icons";
import { useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { cn, getCropppedImg } from "@/lib/utils";
import {
	Dialog,
	DialogAction,
	DialogBody,
	DialogCancel,
	DialogContent,
	DialogFooter,
	DialogTitle,
} from "./ui/dialog";
export function YeeImageUploader({
	src,
	alt,
	onChange,
	className,
	cropShape = "rect",
}: {
	src: string;
	alt: string;
	onChange: (file: File) => void;
	className?: string;
	cropShape?: "rect" | "round";
}) {
	const [previewUrl, setPreviewUrl] = useState(src);
	const [imageToCrop, setImageToCrop] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			setImageToCrop(URL.createObjectURL(file));
		}
		e.target.value = "";
	};
	return (
		<>
			{" "}
			<div
				className={cn(
					"size-48 relative rounded-lg overflow-hidden shrink-0 drop-shadow-xl group",
					className,
				)}
				onClick={() => fileInputRef.current?.click()}
			>
				{" "}
				<img
					className="size-full group-hover:brightness-50 transition-all duration-300 object-cover"
					src={previewUrl}
					alt={alt}
				/>{" "}
				<Edit24Filled className="size-8 absolute right-1/2 bottom-1/2 translate-1/2 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />{" "}
				<input
					type="file"
					ref={fileInputRef}
					accept="image/*"
					className="hidden"
					onChange={handleFileChange}
				/>{" "}
			</div>{" "}
			<YeeCropperDialog
				image={imageToCrop}
				cropShape={cropShape}
				onClose={() => setImageToCrop(null)}
				onConfirm={(url, file) => {
					setPreviewUrl(url);
					setImageToCrop(null);
					onChange(file);
				}}
			/>{" "}
		</>
	);
}
function YeeCropperDialog({
	image,
	cropShape = "rect",
	onClose,
	onConfirm,
}: {
	image: string | null;
	cropShape?: "rect" | "round";
	onClose: () => void;
	onConfirm: (url: string, file: File) => void;
}) {
	const [crop, setCrop] = useState({ x: 0, y: 0 });
	const [zoom, setZoom] = useState(1);
	const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
	const onCropComplete = (_: Area, croppedAreaPixels: Area) => {
		setCroppedAreaPixels(croppedAreaPixels);
	};
	const handleConfirm = async () => {
		if (!image) return;
		try {
			const croppedBlob = await getCropppedImg(image, croppedAreaPixels!);
			const croppedImgUrl = URL.createObjectURL(croppedBlob as Blob);
			const croppedFile = new File(
				[croppedBlob as Blob],
				"playlist_cover_cropped.jpg",
				{ type: "image/jpeg" },
			);
			onConfirm(croppedImgUrl, croppedFile);
		} catch (error) {
			console.error(error);
		}
	};
	return (
		<Dialog
			open={!!image}
			onOpenChange={(val) => {
				if (!val) onClose();
			}}
		>
			{" "}
			<DialogContent className="sm:max-w-xl">
				{" "}
				<DialogTitle className="sr-only">裁剪图片</DialogTitle>{" "}
				<DialogBody>
					{" "}
					<div className="flex flex-col gap-8 p-4 pt-6">
						{" "}
						<div className="relative w-full h-100 bg-card/5 rounded-lg overflow-hidden">
							{" "}
							{image && (
								<Cropper
									image={image}
									crop={crop}
									zoom={zoom}
									aspect={1}
									cropShape={cropShape}
									onCropChange={setCrop}
									onZoomChange={setZoom}
									onCropComplete={onCropComplete}
									objectFit="contain"
								/>
							)}{" "}
						</div>{" "}
						<p className="text-center text-sm text-foreground/50">
							{" "}
							拖拽、缩放图片以进行裁剪{" "}
						</p>{" "}
					</div>{" "}
				</DialogBody>{" "}
				<DialogFooter>
					{" "}
					<DialogCancel onClick={onClose}>取消</DialogCancel>{" "}
					<DialogAction onClick={handleConfirm}>确定</DialogAction>{" "}
				</DialogFooter>{" "}
			</DialogContent>{" "}
		</Dialog>
	);
}
