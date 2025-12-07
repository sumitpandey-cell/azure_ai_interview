"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function Reports() {
  return (
    <DashboardLayout>
      <div className="space-y-6 pb-8">
        <div>
          <h2 className="mb-2 text-2xl sm:text-3xl font-bold text-foreground">
            Interview Reports
          </h2>
          <p className="text-muted-foreground text-sm">
            View insights and analysis from your completed interviews
          </p>
        </div>

        <Card className="border-none shadow-md bg-card">
          <CardContent className="p-12 text-center">
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-foreground">No Interview Reports Yet</h3>
            <p className="text-muted-foreground mb-6">
              Complete your first interview to see detailed reports and analytics here.
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
