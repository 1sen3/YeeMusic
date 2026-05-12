import { ReactNode } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import React from "react";

interface YeeDialogProps {
  asForm?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string;
  showTitle?: boolean;
  trigger?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
  contentClassName?: string;
}

export function YeeDialog({
  asForm = true,
  open,
  onOpenChange,
  title,
  showTitle = false,
  trigger,
  footer,
  children,
  contentClassName,
}: YeeDialogProps) {
  const Wrapper = asForm ? "form" : React.Fragment;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Wrapper>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent
          className={cn(
            "sm:max-w-sm overflow-hidden border-none select-none p-4",
            "bg-white/80 dark:bg-[#2c2c2c]/80 backdrop-blur-xl",
            "shadow-[0_8px_32px_rgba(0,0,0,0.12)]",
            "ring-1 ring-black/5 dark:ring-white/10",
            contentClassName,
          )}
          showCloseButton={false}
        >
          <DialogTitle className={cn("p-4", !showTitle ? "sr-only" : "")}>
            {title}
          </DialogTitle>
          <div className="p-4 pt-0">{children}</div>
          <DialogFooter className="p-6 bg-black/3 dark:bg-white/3 border-t border-black/5 dark:border-white/5 flex">
            {footer}
          </DialogFooter>
        </DialogContent>
      </Wrapper>
    </Dialog>
  );
}

export function YeeDialogPrimaryButton({
  variant,
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "dark" | "light";
}) {
  return (
    <Button
      className={cn(
        "flex-1 h-10 py-2 rounded-md cursor-pointer bg-primary border border-border text-white hover:bg-primary/80",
        className,
      )}
      {...props}
    >
      {children}
    </Button>
  );
}
export function YeeDialogCloseButton({
  variant,
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "dark" | "light";
}) {
  return (
    <DialogClose asChild>
      <Button
        className={cn(
          "flex-1 h-10 py-2 rounded-md cursor-pointer bg-card border border-border text-foreground hover:bg-card/60 ",
          className,
        )}
        {...props}
      >
        {children}
      </Button>
    </DialogClose>
  );
}
