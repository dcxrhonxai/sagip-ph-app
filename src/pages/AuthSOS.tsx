import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import type { Session } from "@supabase/supabase-js";
import { authSchema } from "@/lib/validation";

const AuthSOS = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup form state
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupFullName, setSignupFullName] = useState("");
  const [signupPhone, setSignupPhone] = useState("");

  // SOS alert form
  const [emergencyType, setEmergencyType] = useState("");
  const [situation, setSituation] = useState("");
  const [submittingSOS, setSubmittingSOS] = useState(false);

  // ----------------------
  // AUTH EFFECTS
  // ----------------------
  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) navigate("/home");
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) navigate("/home");
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // ----------------------
  // LOGIN & SIGNUP
  // ----------------------
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = authSchema.safeParse({ email: loginEmail, password: loginPassword });
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: result.data.email,
      password: result.data.password,
    });
    if (error) toast.error("Invalid email or password");
    else toast.success("Logged in successfully!");
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = authSchema.safeParse({
      email: signupEmail,
      password: signupPassword,
      fullName: signupFullName,
      phoneNumber: signupPhone || undefined,
    });
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }
    setLoading(true);
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email: result.data.email,
      password: result.data.password,
      options: { emailRedirectTo: redirectUrl, data: { full_name: result.data.fullName } },
    });
    if (error) {
      toast.error(error.message.includes("already registered")
        ? "This email is already registered. Please login."
        : "Failed to create account. Please try again.");
    } else {
      toast.success("Account created successfully!");
      // Update profile with phone number
      if (result.data.phoneNumber) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("profiles").update({ phone_number: result.data.phoneNumber }).eq("id", user.id);
        }
      }
    }
    setLoading(false);
  };

  // ----------------------
  // SOS ALERT SUBMISSION
  // ----------------------
  const handleSOSSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      toast.error("You must be logged in to send an emergency alert.");
      return;
    }
    if (!emergencyType || !situation) {
      toast.error("Please fill in all fields.");
      return;
    }
    setSubmittingSOS(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        const { data: user } = await supabase.auth.getUser();
        const { error } = await supabase.from("emergency_alerts").insert([{
          user_id: user?.id,
          emergency_type: emergencyType,
          situation,
          latitude,
          longitude,
          status: "active",
          created_at: new Date().toISOString(),
        }]);

        if (error) toast.error("Failed to send SOS alert: " + error.message);
        else toast.success("Emergency alert sent!");

        setEmergencyType("");
        setSituation("");
        setSubmittingSOS(false);
      },
      (err) => {
        toast.error("Failed to get GPS coordinates: " + err.message);
        setSubmittingSOS(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // ----------------------
  // RENDER
  // ----------------------
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-primary p-4 rounded-full">
              <Shield className="w-12 h-12 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Emergency Response PH</h1>
          <p className="text-muted-foreground">
            Login or create an account to send emergency alerts.
          </p>
        </div>

        {/* Auth Tabs */}
        <div className="bg-card rounded-lg shadow-lg p-6">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <Label>Email</Label>
                <Input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required />
                <Label>Password</Label>
                <Input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required />
                <Button type="submit" className="w-full" disabled={loading}>{loading ? "Logging in..." : "Login"}</Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <Label>Full Name *</Label>
                <Input type="text" value={signupFullName} onChange={e => setSignupFullName(e.target.value)} required />
                <Label>Email *</Label>
                <Input type="email" value={signupEmail} onChange={e => setSignupEmail(e.target.value)} required />
                <Label>Phone Number</Label>
                <Input type="tel" value={signupPhone} onChange={e => setSignupPhone(e.target.value)} />
                <Label>Password *</Label>
                <Input type="password" value={signupPassword} onChange={e => setSignupPassword(e.target.value)} required />
                <Button type="submit" className="w-full" disabled={loading}>{loading ? "Creating account..." : "Sign Up"}</Button>
              </form>
            </TabsContent>
          </Tabs>

          {/* SOS Alert Form */}
          {session && (
            <div className="mt-6 border-t border-muted-foreground pt-4">
              <h2 className="text-lg font-semibold mb-2">Send SOS Alert</h2>
              <form onSubmit={handleSOSSubmit} className="space-y-4">
                <Label>Emergency Type</Label>
                <Input value={emergencyType} onChange={e => setEmergencyType(e.target.value)} placeholder="Fire, Accident, Medical..." required />
                <Label>Situation</Label>
                <Input value={situation} onChange={e => setSituation(e.target.value)} placeholder="Describe your emergency..." required />
                <Button type="submit" className="w-full" disabled={submittingSOS}>{submittingSOS ? "Sending..." : "Send SOS"}</Button>
              </form>
            </div>
          )}
        </div>

        {/* Quick Info */}
        <div className="mt-6 bg-accent/10 border border-accent/20 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <p className="font-semibold text-foreground mb-1">Quick Access</p>
            <p>Create an account to save your emergency history and personal contacts for faster emergency response.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthSOS;
