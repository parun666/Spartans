import { Skeleton } from "@/components/ui/card";
export default function Loading() { return <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>; }
