import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Phone, UserPlus, LogIn } from "lucide-react";
import { useStudent } from "@/hooks/useStudent";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  defaultTab?: "login" | "register";
};

export default function PhoneLoginDialog({ open, onOpenChange, onSuccess, defaultTab = "register" }: Props) {
  const { loginWithPhone, registerWithPhone } = useStudent();

  // Register fields
  const [regPhone, setRegPhone] = useState("");
  const [regName, setRegName] = useState("");
  const [regAddress, setRegAddress] = useState("");
  const [regSubmitting, setRegSubmitting] = useState(false);

  // Login fields
  const [loginPhone, setLoginPhone] = useState("");
  const [loginSubmitting, setLoginSubmitting] = useState(false);

  const isRegValid = regPhone.replace(/\D/g, "").length >= 10 && regName.trim().length > 0 && regAddress.trim().length > 0;
  const isLoginValid = loginPhone.replace(/\D/g, "").length >= 10;

  const handleRegister = async () => {
    if (!isRegValid) return;
    setRegSubmitting(true);
    try {
      const cleanPhone = regPhone.replace(/\D/g, "").slice(-10);
      await registerWithPhone(cleanPhone, regName.trim(), regAddress.trim());
      toast.success("Registered successfully! Welcome.");
      onOpenChange(false);
      onSuccess?.();
    } catch (e: any) {
      toast.error(e.message || "Registration failed");
    } finally {
      setRegSubmitting(false);
    }
  };

  const handleLogin = async () => {
    if (!isLoginValid) return;
    setLoginSubmitting(true);
    try {
      const cleanPhone = loginPhone.replace(/\D/g, "").slice(-10);
      await loginWithPhone(cleanPhone);
      toast.success("Welcome back!");
      onOpenChange(false);
      onSuccess?.();
    } catch (e: any) {
      toast.error(e.message || "Login failed");
    } finally {
      setLoginSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Welcome to SSN</DialogTitle>
          <DialogDescription>Your phone number is used only to save your test history</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue={defaultTab} className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="register"><UserPlus className="mr-1.5 h-4 w-4" /> Register</TabsTrigger>
            <TabsTrigger value="login"><LogIn className="mr-1.5 h-4 w-4" /> Login</TabsTrigger>
          </TabsList>

          {/* REGISTER TAB */}
          <TabsContent value="register" className="space-y-4 pt-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-card-foreground">Full Name *</label>
              <Input
                placeholder="Your full name"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-card-foreground">Phone Number *</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="10-digit phone number"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  className="pl-10"
                  type="tel"
                  maxLength={15}
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-card-foreground">Address *</label>
              <Input
                placeholder="Your address"
                value={regAddress}
                onChange={(e) => setRegAddress(e.target.value)}
              />
            </div>
            <Button className="w-full" size="lg" disabled={!isRegValid || regSubmitting} onClick={handleRegister}>
              {regSubmitting ? "Please wait..." : "Register & Continue"}
            </Button>
          </TabsContent>

          {/* LOGIN TAB */}
          <TabsContent value="login" className="space-y-4 pt-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-card-foreground">Registered Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="10-digit phone number"
                  value={loginPhone}
                  onChange={(e) => setLoginPhone(e.target.value)}
                  className="pl-10"
                  type="tel"
                  maxLength={15}
                  onKeyDown={(e) => { if (e.key === "Enter" && isLoginValid) handleLogin(); }}
                />
              </div>
            </div>
            <Button className="w-full" size="lg" disabled={!isLoginValid || loginSubmitting} onClick={handleLogin}>
              {loginSubmitting ? "Please wait..." : "Login"}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
