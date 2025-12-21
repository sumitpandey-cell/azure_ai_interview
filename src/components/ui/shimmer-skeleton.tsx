import { cn } from "@/lib/utils";

interface ShimmerSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
    className?: string;
}

export function ShimmerSkeleton({ className, ...props }: ShimmerSkeletonProps) {
    return (
        <div
            className={cn("shimmer rounded-md", className)}
            {...props}
        />
    );
}
