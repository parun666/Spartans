"use client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return <Card><p className="text-red-600 mb-2">Something went wrong: {error.message}</p><Button onClick={reset}>Retry</Button></Card>;
}
