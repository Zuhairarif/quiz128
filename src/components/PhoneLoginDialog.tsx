import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";
import { useStudent } from "@/hooks/useStudent";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

export default function PhoneLoginDialog({ open, onOpenChange, onSuccess }: Props) {
  const { loginWithPhone } = useStudent();
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isValid = phone.replace(/\D/g, "").length >= 10;

  const handleSubmit = async () => {
    if (!isValid) return;
    setSubmitting(true);
    try {
      const cleanPhone = phone.replace(/\D/g, "").slice(-10);
      await loginWithPhone(cleanPhone);
      toast.success("Welcome! Your quiz history will be saved.");
      onOpenChange(false);
      onSuccess?.();
    } catch (e: any) {
      toast.error(e.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Enter Phone Number to Continue</DialogTitle>
          <DialogDescription>Your phone number is used only to save your test history</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-card-foreground">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="10-digit phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="pl-10"
                type="tel"
                maxLength={15}
                onKeyDown={(e) => { if (e.key === "Enter" && isValid) handleSubmit(); }}
              />
            </div>
          </div>
          <Button className="w-full" size="lg" disabled={!isValid || submitting} onClick={handleSubmit}>
            {submitting ? "Please wait..." : "Continue"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
