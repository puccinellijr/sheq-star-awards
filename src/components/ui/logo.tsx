import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Logo({ className, size = "md" }: LogoProps) {
  const sizeClasses = {
    sm: "h-8",
    md: "h-12",
    lg: "h-16"
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <img 
        src="/lovable-uploads/69239e6b-598a-4828-8a9b-2f5f17031fda.png" 
        alt="Odfjell Terminals" 
        className={cn(sizeClasses[size], "object-contain")}
      />
      <div className="flex flex-col">
        <span className="font-bold text-primary text-sm md:text-lg">DESTAQUE SHEQ</span>
        <span className="text-xs md:text-sm text-muted-foreground">Odfjell Terminals</span>
      </div>
    </div>
  );
}