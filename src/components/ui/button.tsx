import * as React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "ghost" | "destructive";
    size?: "sm" | "md" | "lg";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "primary", size = "md", disabled, ...props }, ref) => {
        return (
            <button
                ref={ref}
                disabled={disabled}
                className={cn(
                    "inline-flex items-center justify-center rounded-[3px] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-[#313338] disabled:opacity-50 disabled:pointer-events-none",
                    {
                        "bg-indigo-500 text-white hover:bg-indigo-600": variant === "primary",
                        "bg-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50": variant === "ghost",
                        "bg-red-600 text-white hover:bg-red-700": variant === "destructive",
                    },
                    {
                        "h-8 px-3 text-xs": size === "sm",
                        "h-10 px-4 text-sm": size === "md",
                        "h-11 px-6 text-base": size === "lg",
                    },
                    className
                )}
                {...props}
            />
        );
    }
);
Button.displayName = "Button";

export { Button };
