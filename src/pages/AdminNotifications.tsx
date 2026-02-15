import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { adminApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { ChevronLeft, Plus, Trash2, Bell, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

type Notification = {
  id: string;
  title: string;
  message: string;
  is_active: boolean;
  created_at: string;
};

export default function AdminNotifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [creating, setCreating] = useState(false);

  const loadData = async () => {
    try {
      const res = await adminApi.quizAction("list_notifications");
      setNotifications(res.notifications || []);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = async () => {
    if (!title.trim() || !message.trim()) return;
    setCreating(true);
    try {
      await adminApi.quizAction("create_notification", { title: title.trim(), message: message.trim() });
      toast.success("Notification published");
      setTitle("");
      setMessage("");
      loadData();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (n: Notification) => {
    try {
      await adminApi.quizAction("toggle_notification", { id: n.id, is_active: !n.is_active });
      toast.success(n.is_active ? "Notification hidden" : "Notification shown");
      loadData();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this notification?")) return;
    try {
      await adminApi.quizAction("delete_notification", { id });
      toast.success("Notification deleted");
      loadData();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-4 py-4">
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin")}>
            <ChevronLeft className="mr-1 h-4 w-4" /> Back
          </Button>
          <Bell className="h-5 w-5 text-primary" />
          <h1 className="font-display text-xl font-bold text-card-foreground">Notifications</h1>
        </div>
      </header>

      <main className="mx-auto max-w-4xl p-4 py-8">
        {/* Create notification */}
        <div className="mb-8 rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 font-display text-lg font-semibold text-card-foreground flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" /> New Notification
          </h2>
          <div className="space-y-3">
            <Input
              placeholder="Notification title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Textarea
              placeholder="Notification message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
            <Button onClick={handleCreate} disabled={!title.trim() || !message.trim() || creating}>
              {creating ? "Publishing..." : "Publish Notification"}
            </Button>
          </div>
        </div>

        {/* Notification list */}
        <h2 className="mb-4 font-display text-lg font-semibold text-foreground">All Notifications</h2>
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />)}
          </div>
        ) : notifications.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No notifications yet</p>
        ) : (
          <div className="space-y-3">
            {notifications.map((n, i) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`rounded-xl border p-4 ${n.is_active ? "border-border bg-card" : "border-border/50 bg-muted/50 opacity-60"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-card-foreground">{n.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{n.message}</p>
                    <p className="mt-1.5 text-xs text-muted-foreground/60">
                      {new Date(n.created_at).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button variant="outline" size="sm" onClick={() => handleToggle(n)}>
                      {n.is_active ? <><EyeOff className="mr-1 h-3.5 w-3.5" /> Hide</> : <><Eye className="mr-1 h-3.5 w-3.5" /> Show</>}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(n.id)} className="text-destructive hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
