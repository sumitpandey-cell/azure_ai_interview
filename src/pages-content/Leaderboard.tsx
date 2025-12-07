"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy } from "lucide-react";

export default function Leaderboard() {
  return (
    <DashboardLayout>
      <div className="space-y-6 pb-8">
        <div>
          <h2 className="mb-2 text-2xl sm:text-3xl font-bold text-foreground">
            Leaderboard
          </h2>
          <p className="text-muted-foreground text-sm">
            Compete with others and track your ranking
          </p>
        </div>

        <Card className="border-none shadow-md bg-card">
          <CardContent className="p-12 text-center">
            <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-foreground">Leaderboard Coming Soon</h3>
            <p className="text-muted-foreground mb-6">
              Start practicing to climb the ranks!
            </p>
            <p className="text-sm text-muted-foreground">
              Backend removed - Ready for fresh implementation
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
