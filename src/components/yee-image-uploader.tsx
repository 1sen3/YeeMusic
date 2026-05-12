import { Edit24Filled } from "@fluentui/react-icons";
import { useRef, useState } from "react";
import Cropper, { Area } from "react-easy-crop";
import {
  YeeDialog,
  YeeDialogCloseButton,
  YeeDialogPrimaryButton,
} from "./yee-dialog";
import { getCropppedImg } from "@/lib/utils";
export function YeeImageUploader({
  src,
  alt,
  onChange,
}: {
  src: string;
  alt: string;
  onChange: (file: File) => void;
}) {
  const [previewUrl, setPreviewUrl] = useState(src);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageToCrop(URL.createObjectURL(file));
    }
  };

  return (
    <>
      <div
        className="size-48 relative rounded-lg overflow-hidden shrink-0 drop-shadow-xl group cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <img
          className="group-hover:brightness-50 transition-all duration-300 object-cover"
          src={previewUrl}
          alt={alt}
        />
        <Edit24Filled className="size-8 absolute right-1/2 bottom-1/2 translate-1/2 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      <YeeCropperDialog
        image={imageToCrop}
        onClose={() => setImageToCrop(null)}
        onConfirm={(url, file) => {
          setPreviewUrl(url);
          setImageToCrop(null);
          onChange(file);
        }}
      />
    </>
  );
}

function YeeCropperDialog({
  image,
  onClose,
  onConfirm,
}: {
  image: string | null;
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
    <YeeDialog
      title="裁剪图片"
      asForm={false}
      open={!!image}
      onOpenChange={(val) => {
        if (!val) onClose();
      }}
      contentClassName="sm:max-w-xl"
      footer={
        <div className="w-full flex gap-4">
          <YeeDialogCloseButton onClick={onClose}>取消</YeeDialogCloseButton>
          <YeeDialogPrimaryButton onClick={handleConfirm}>
            确定
          </YeeDialogPrimaryButton>
        </div>
      }
    >
      <div className="flex flex-col gap-8 p-4 pt-6">
        <div className="relative w-full h-100 bg-card/5 rounded-lg overflow-hidden">
          {image && (
            <Cropper
              image={image}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              objectFit="contain"
            />
          )}
        </div>
        <p className="text-center text-sm text-foreground/50">
          拖拽、缩放图片以进行裁剪
        </p>
      </div>
    </YeeDialog>
  );
}
