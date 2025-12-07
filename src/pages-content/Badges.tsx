"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Medal } from "lucide-react";

export default function Badges() {
  return (
    <DashboardLayout>
      <div className="space-y-6 pb-8">
        <div>
          <h2 className="mb-2 text-2xl sm:text-3xl font-bold text-foreground">
            Badges & Achievements
          </h2>
          <p className="text-muted-foreground text-sm">
            Earn badges as you progress through your interview journey
          </p>
        </div>

        <Card className="border-none shadow-md bg-card">
          <CardContent className="p-12 text-center">
            <Medal className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-foreground">No Badges Yet</h3>
            <p className="text-muted-foreground mb-6">
              Complete interviews to unlock achievements!
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
