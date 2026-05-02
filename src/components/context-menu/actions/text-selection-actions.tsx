import { useContextMenuStore } from "@/lib/store/contextMenuStore";
import { ActionProps } from "./action";
import { ContextMenuButton } from "../context-menu-button";
import { DocumentCopyRegular } from "@fluentui/react-icons";

export function TextSelectionActions({ type, data }: ActionProps) {
  const { closeMenu } = useContextMenuStore();

  if (type !== "text-selection") return null;

  const selectedText = data?.selectedText as string;

  return (
    <ContextMenuButton
      id="copy-text"
      icon={<DocumentCopyRegular className="size-4" />}
      content="复制"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(selectedText);
        } catch {
          // Fallback for older browsers
          const textarea = document.createElement("textarea");
          textarea.value = selectedText;
          textarea.style.position = "fixed";
          textarea.style.opacity = "0";
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand("copy");
          document.body.removeChild(textarea);
        }
        closeMenu();
      }}
    />
  );
}
