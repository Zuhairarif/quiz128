import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useStudent } from "@/hooks/useStudent";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

type Notification = {
  id: string;
  title: string;
  message: string;
  created_at: string;
};

export default function NotificationBell() {
  const { student, isLoggedIn } = useStudent();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Fetch active notifications
    supabase
      .from("notifications")
      .select("id, title, message, created_at")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setNotifications((data as Notification[]) || []);
      });
  }, []);

  useEffect(() => {
    if (!student) return;
    // Fetch read status
    supabase
      .from("notification_reads")
      .select("notification_id")
      .eq("student_profile_id", student.id)
      .then(({ data }) => {
        setReadIds(new Set((data || []).map((r: any) => r.notification_id)));
      });
  }, [student]);

  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length;

  const markAsRead = async (notificationId: string) => {
    if (!student || readIds.has(notificationId)) return;
    setReadIds((prev) => new Set(prev).add(notificationId));
    await supabase.from("notification_reads").insert({
      notification_id: notificationId,
      student_profile_id: student.id,
    });
  };

  const markAllRead = async () => {
    if (!student) return;
    const unread = notifications.filter((n) => !readIds.has(n.id));
    if (unread.length === 0) return;
    const newReadIds = new Set(readIds);
    const inserts = unread.map((n) => ({
      notification_id: n.id,
      student_profile_id: student.id,
    }));
    unread.forEach((n) => newReadIds.add(n.id));
    setReadIds(newReadIds);
    await supabase.from("notification_reads").insert(inserts);
  };

  const handleOpen = () => {
    setOpen(true);
  };

  if (notifications.length === 0) return null;

  return (
    <>
      <button
        onClick={handleOpen}
        className="relative p-1.5 rounded-lg text-primary-foreground/60 hover:text-primary-foreground transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="font-display text-lg">Notifications</DialogTitle>
              {isLoggedIn && unreadCount > 0 && (
                <Button variant="ghost" size="sm" className="text-xs h-7" onClick={markAllRead}>
                  Mark all read
                </Button>
              )}
            </div>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-3 pr-2">
              {notifications.map((n) => {
                const isRead = readIds.has(n.id);
                return (
                  <div
                    key={n.id}
                    className={`rounded-lg border p-3 transition-colors ${
                      isRead ? "border-border bg-card" : "border-primary/30 bg-primary/5"
                    }`}
                    onClick={() => markAsRead(n.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className={`text-sm ${isRead ? "font-medium text-card-foreground" : "font-bold text-foreground"}`}>
                        {n.title}
                      </h4>
                      {!isRead && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{n.message}</p>
                    <p className="mt-1.5 text-xs text-muted-foreground/60">
                      {new Date(n.created_at).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
