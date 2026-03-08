import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("bg-muted rounded-md motion-safe:animate-pulse", className)}
      {...props}
    />
  )
}

export { Skeleton }
