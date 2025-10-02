import { z } from "zod";

// Phone number validation - supports various formats
const phoneRegex = /^[\d\s+()-]+$/;

export const emergencyFormSchema = z.object({
  situation: z.string()
    .trim()
    .min(10, { message: "Please provide at least 10 characters describing your situation" })
    .max(500, { message: "Description must be less than 500 characters" }),
  emergencyType: z.string()
    .min(1, { message: "Please select an emergency type" })
});

export const personalContactSchema = z.object({
  name: z.string()
    .trim()
    .min(2, { message: "Name must be at least 2 characters" })
    .max(100, { message: "Name must be less than 100 characters" }),
  phone: z.string()
    .trim()
    .min(7, { message: "Phone number must be at least 7 digits" })
    .max(20, { message: "Phone number must be less than 20 characters" })
    .regex(phoneRegex, { message: "Phone number contains invalid characters" }),
  relationship: z.string()
    .trim()
    .max(50, { message: "Relationship must be less than 50 characters" })
    .optional()
});

export const authSchema = z.object({
  email: z.string()
    .trim()
    .email({ message: "Please enter a valid email address" })
    .max(255, { message: "Email must be less than 255 characters" }),
  password: z.string()
    .min(6, { message: "Password must be at least 6 characters" })
    .max(72, { message: "Password must be less than 72 characters" }),
  fullName: z.string()
    .trim()
    .min(2, { message: "Full name must be at least 2 characters" })
    .max(100, { message: "Full name must be less than 100 characters" })
    .optional(),
  phoneNumber: z.string()
    .trim()
    .min(7, { message: "Phone number must be at least 7 digits" })
    .max(20, { message: "Phone number must be less than 20 characters" })
    .regex(phoneRegex, { message: "Phone number contains invalid characters" })
    .optional()
});
