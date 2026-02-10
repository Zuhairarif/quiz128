import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, User } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function AdminLoginPage() {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, isAdmin } = useAdmin();
  const navigate = useNavigate();

  if (isAdmin) {
    navigate("/admin", { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await login(userId, password);
    setLoading(false);
    if (res.success) {
      navigate("/admin", { replace: true });
    } else {
      toast.error(res.error || "Invalid credentials");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <motion.form
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-lg"
      >
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full gradient-primary">
            <Lock className="h-5 w-5 text-primary-foreground" />
          </div>
          <h1 className="font-display text-2xl font-bold text-card-foreground">Admin Login</h1>
          <p className="mt-1 text-sm text-muted-foreground">QuizHub Administration</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-card-foreground">User ID</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Enter user ID"
                className="pl-10"
                required
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-card-foreground">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="pl-10"
                required
              />
            </div>
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </div>
      </motion.form>
    </div>
  );
}
