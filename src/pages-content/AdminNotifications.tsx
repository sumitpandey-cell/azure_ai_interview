"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Send, Users, User, AlertCircle } from "lucide-react";
import { useNotifications } from "@/hooks/use-notifications";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function AdminNotifications() {
  const { user } = useAuth();
  const { sendNotification, sendNotificationToAll } = useNotifications();

  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info' as 'info' | 'success' | 'warning' | 'error',
    targetUserId: '',
    targetType: 'all' as 'all' | 'single',
  });

  const [isSending, setIsSending] = useState(false);

  // Check if user is admin
  const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',') || [];
  const isAdmin = adminEmails.includes(user?.email || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.message.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSending(true);

    try {
      if (formData.targetType === 'all') {
        await sendNotificationToAll(formData.title, formData.message, formData.type);
      } else {
        if (!formData.targetUserId.trim()) {
          toast.error('Please enter a user ID');
          return;
        }
        await sendNotification(formData.targetUserId, formData.title, formData.message, formData.type);
      }

      // Reset form
      setFormData({
        title: '',
        message: '',
        type: 'info',
        targetUserId: '',
        targetType: 'all',
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md">
            <CardContent className="p-6 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
              <p className="text-muted-foreground">
                You don't have permission to access this page.
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Notifications</h1>
          <p className="text-muted-foreground mt-2">
            Send notifications to users of the AI Interview platform
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Send Notification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Target Selection */}
              <div className="space-y-4">
                <Label className="text-base font-medium">Send to:</Label>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      id="all"
                      name="targetType"
                      value="all"
                      checked={formData.targetType === 'all'}
                      onChange={(e) => handleInputChange('targetType', e.target.value)}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="all" className="flex items-center gap-2 cursor-pointer">
                      <Users className="h-4 w-4" />
                      All Users
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      id="single"
                      name="targetType"
                      value="single"
                      checked={formData.targetType === 'single'}
                      onChange={(e) => handleInputChange('targetType', e.target.value)}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="single" className="flex items-center gap-2 cursor-pointer">
                      <User className="h-4 w-4" />
                      Specific User
                    </Label>
                  </div>
                </div>

                {formData.targetType === 'single' && (
                  <div>
                    <Label htmlFor="targetUserId">User ID</Label>
                    <Input
                      id="targetUserId"
                      placeholder="Enter user ID (UUID)"
                      value={formData.targetUserId}
                      onChange={(e) => handleInputChange('targetUserId', e.target.value)}
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      You can find user IDs in your Supabase dashboard under Authentication &gt; Users
                    </p>
                  </div>
                )}
              </div>

              {/* Notification Type */}
              <div>
                <Label htmlFor="type">Notification Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: 'info' | 'success' | 'warning' | 'error') =>
                    handleInputChange('type', value)
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">ℹ️ Info</Badge>
                        General information
                      </div>
                    </SelectItem>
                    <SelectItem value="success">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">✅ Success</Badge>
                        Positive updates
                      </div>
                    </SelectItem>
                    <SelectItem value="warning">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">⚠️ Warning</Badge>
                        Important notices
                      </div>
                    </SelectItem>
                    <SelectItem value="error">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">❌ Error</Badge>
                        Critical alerts
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Title */}
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Notification title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="mt-1"
                  required
                />
              </div>

              {/* Message */}
              <div>
                <Label htmlFor="message">Message *</Label>
                <Textarea
                  id="message"
                  placeholder="Notification message"
                  value={formData.message}
                  onChange={(e) => handleInputChange('message', e.target.value)}
                  className="mt-1 min-h-[100px]"
                  required
                />
              </div>

              {/* Preview */}
              <div>
                <Label className="text-base font-medium">Preview:</Label>
                <Card className="mt-2 border-dashed">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-lg">
                        {formData.type === 'success' ? '✅' :
                         formData.type === 'warning' ? '⚠️' :
                         formData.type === 'error' ? '❌' : 'ℹ️'}
                      </span>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">
                          {formData.title || 'Notification title'}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formData.message || 'Notification message will appear here...'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSending}
                className="w-full"
              >
                {isSending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Notification
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Usage Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How to use</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Sending to All Users:</h4>
              <p className="text-sm text-muted-foreground">
                Select "All Users" to broadcast notifications to everyone using the platform.
                This is useful for system announcements, feature updates, or important news.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Sending to Specific User:</h4>
              <p className="text-sm text-muted-foreground">
                Select "Specific User" and enter their User ID to send a targeted notification.
                You can find User IDs in your Supabase dashboard under Authentication → Users.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Notification Types:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li><strong>Info:</strong> General information and updates</li>
                <li><strong>Success:</strong> Positive achievements or confirmations</li>
                <li><strong>Warning:</strong> Important notices that require attention</li>
                <li><strong>Error:</strong> Critical issues or urgent alerts</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}