import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-slate-300">{label}</label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">{icon}</div>
        )}
        <input
          ref={ref}
          className={cn(
            "w-full glass rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500",
            "focus:outline-none focus:ring-1 focus:ring-brand-500/50 focus:border-brand-500/40",
            "transition-all duration-200 text-sm",
            icon && "pl-10",
            error && "border-red-500/40 focus:ring-red-500/30",
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
);
Input.displayName = "Input";
