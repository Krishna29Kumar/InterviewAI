import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
}

export function Card({ children, className, hover, glow }: CardProps) {
  return (
    <div
      className={cn(
        "glass rounded-2xl p-6",
        hover && "hover:border-brand-500/30 transition-all duration-300 cursor-pointer",
        glow && "glow-brand",
        className
      )}
    >
      {children}
    </div>
  );
}

export function StatCard({ label, value, sub, icon, color = "brand" }: {
  label: string; value: string | number; sub?: string; icon?: React.ReactNode; color?: string;
}) {
  return (
    <Card className="flex items-start gap-4">
      {icon && (
        <div className={cn("p-3 rounded-xl", `bg-${color}-500/10 text-${color}-400`)}>
          {icon}
        </div>
      )}
      <div>
        <p className="text-2xl font-display font-bold text-slate-100">{value}</p>
        <p className="text-sm text-slate-400 mt-0.5">{label}</p>
        {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
      </div>
    </Card>
  );
}
