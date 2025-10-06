-- Add emergency medical information fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN blood_type text,
ADD COLUMN allergies text,
ADD COLUMN medical_conditions text,
ADD COLUMN emergency_notes text;