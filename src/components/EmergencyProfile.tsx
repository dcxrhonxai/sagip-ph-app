import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface EmergencyProfileProps {
  userId: string;
}

const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export const EmergencyProfile = ({ userId }: EmergencyProfileProps) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bloodType, setBloodType] = useState("");
  const [allergies, setAllergies] = useState("");
  const [medicalConditions, setMedicalConditions] = useState("");
  const [emergencyNotes, setEmergencyNotes] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("blood_type, allergies, medical_conditions, emergency_notes")
        .eq("id", userId)
        .single();

      if (error) throw error;

      if (data) {
        setBloodType(data.blood_type || "");
        setAllergies(data.allergies || "");
        setMedicalConditions(data.medical_conditions || "");
        setEmergencyNotes(data.emergency_notes || "");
      }
    } catch (error: any) {
      console.error("Error loading emergency profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          blood_type: bloodType,
          allergies: allergies,
          medical_conditions: medicalConditions,
          emergency_notes: emergencyNotes,
        })
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Emergency profile updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Emergency Medical Information</CardTitle>
        <CardDescription>
          This information will be shared with emergency contacts during alerts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="blood-type">Blood Type</Label>
          <Select value={bloodType} onValueChange={setBloodType}>
            <SelectTrigger id="blood-type">
              <SelectValue placeholder="Select blood type" />
            </SelectTrigger>
            <SelectContent>
              {bloodTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="allergies">Allergies</Label>
          <Textarea
            id="allergies"
            placeholder="e.g., Penicillin, Peanuts, Latex"
            value={allergies}
            onChange={(e) => setAllergies(e.target.value)}
            className="min-h-[80px]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="medical-conditions">Medical Conditions</Label>
          <Textarea
            id="medical-conditions"
            placeholder="e.g., Diabetes, Asthma, Heart condition"
            value={medicalConditions}
            onChange={(e) => setMedicalConditions(e.target.value)}
            className="min-h-[80px]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="emergency-notes">Additional Emergency Notes</Label>
          <Textarea
            id="emergency-notes"
            placeholder="Any other important information for first responders"
            value={emergencyNotes}
            onChange={(e) => setEmergencyNotes(e.target.value)}
            className="min-h-[80px]"
          />
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Emergency Profile
        </Button>
      </CardContent>
    </Card>
  );
};
