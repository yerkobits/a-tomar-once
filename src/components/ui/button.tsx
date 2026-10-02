import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline";
  size?: "default" | "sm" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-medium rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
          variant === "default" && "bg-[#F59E0B] text-black hover:bg-[#D97706]",
          variant === "outline" && "border border-[#2C2824] bg-transparent text-[#FEF3C7] hover:bg-[#2C2824]",
          size === "sm" && "px-3 py-1.5 text-xs",
          size === "default" && "px-4 py-2 text-sm",
          size === "lg" && "px-6 py-3 text-base font-semibold",
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
