-- Enable realtime for emergency_alerts table
ALTER TABLE public.emergency_alerts REPLICA IDENTITY FULL;

-- Add the table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.emergency_alerts;

-- Create a table to track alert shares with contacts
CREATE TABLE public.alert_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_id UUID NOT NULL REFERENCES public.emergency_alerts(id) ON DELETE CASCADE,
  contact_phone TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  notified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  viewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.alert_notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view notifications for their alerts
CREATE POLICY "Users can view notifications for their alerts"
ON public.alert_notifications
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.emergency_alerts
    WHERE emergency_alerts.id = alert_notifications.alert_id
    AND emergency_alerts.user_id = auth.uid()
  )
);

-- Policy: Users can insert notifications for their alerts
CREATE POLICY "Users can insert notifications for their alerts"
ON public.alert_notifications
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.emergency_alerts
    WHERE emergency_alerts.id = alert_notifications.alert_id
    AND emergency_alerts.user_id = auth.uid()
  )
);

-- Create index for faster queries
CREATE INDEX idx_alert_notifications_alert_id ON public.alert_notifications(alert_id);
CREATE INDEX idx_alert_notifications_phone ON public.alert_notifications(contact_phone);