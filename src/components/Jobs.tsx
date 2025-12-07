"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase } from "lucide-react";

export default function Jobs() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="mb-2 text-3xl font-bold text-foreground">Recommended Jobs</h2>
          <p className="text-muted-foreground">
            Find jobs that match your interview practice and skills
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-6 w-6 text-primary" />
              Coming Soon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Job recommendations based on your interview performance will be available here soon.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}