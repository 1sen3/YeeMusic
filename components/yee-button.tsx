import React from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

interface PlayerBarButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "outline" | "ghost";
  icon: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

const YeeButtonVariants = cva("cursor-pointer", {
  variants: {
    variant: {
      outline: "rounded-full cursor-pointer border-0 drop-shadow-md",
      ghost: "",
    },
  },
});

export const YeeButton = React.forwardRef<
  HTMLButtonElement,
  PlayerBarButtonProps
>(({ variant = "ghost", icon, disabled, className, ...props }, ref) => {
  return (
    <motion.div
      whileTap={!disabled ? { scale: 0.85 } : {}}
      whileHover={!disabled ? { scale: 1.1 } : {}}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      <Button
        ref={ref}
        variant={variant}
        size="icon"
        className={cn(YeeButtonVariants({ variant }), className)}
        disabled={disabled}
        {...props}
      >
        {icon}
      </Button>
    </motion.div>
  );
});

YeeButton.displayName = "PlayerBarButton";
