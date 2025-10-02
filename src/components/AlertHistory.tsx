import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface EmergencyAlert {
  id: string;
  emergency_type: string;
  situation: string;
  latitude: number;
  longitude: number;
  status: string;
  created_at: string;
  resolved_at: string | null;
}

interface AlertHistoryProps {
  userId: string;
}

const AlertHistory = ({ userId }: AlertHistoryProps) => {
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlerts();
  }, [userId]);

  const loadAlerts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('emergency_alerts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      toast.error("Failed to load alert history");
    } else {
      setAlerts(data || []);
    }
    setLoading(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getEmergencyTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      fire: "Fire Emergency",
      medical: "Medical Emergency",
      police: "Police / Crime",
      accident: "Road Accident",
      disaster: "Natural Disaster",
      other: "Other Emergency",
    };
    return types[type] || type;
  };

  if (loading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Loading history...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Emergency Alert History</h2>
        <p className="text-sm text-muted-foreground">
          Your past emergency alerts and their status
        </p>
      </div>

      {/* Alerts List */}
      {alerts.length === 0 ? (
        <Card className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">
            No emergency alerts in your history
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <Card key={alert.id} className="p-4">
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">
                        {getEmergencyTypeLabel(alert.emergency_type)}
                      </h3>
                      <Badge 
                        variant={alert.status === 'active' ? 'destructive' : 'secondary'}
                      >
                        {alert.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {alert.situation}
                    </p>
                  </div>
                </div>

                {/* Meta Info */}
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatDate(alert.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span>
                      {alert.latitude.toFixed(4)}, {alert.longitude.toFixed(4)}
                    </span>
                  </div>
                  {alert.resolved_at && (
                    <div className="flex items-center gap-1 text-success">
                      <span>Resolved: {formatDate(alert.resolved_at)}</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {alerts.length > 0 && (
        <p className="text-xs text-center text-muted-foreground">
          Showing up to 20 most recent alerts
        </p>
      )}
    </div>
  );
};

export default AlertHistory;
