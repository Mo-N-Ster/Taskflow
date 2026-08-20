import { z } from "zod";

export const loginInputSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export const registerInputSchema = loginInputSchema.extend({
  displayName: z.string().trim().min(1).max(100),
  password: z.string().min(8).max(128),
  passwordConfirmation: z.string().min(1),
}).refine(({ password, passwordConfirmation }) => password === passwordConfirmation, {
  message: "PASSWORD_CONFIRMATION_MISMATCH",
  path: ["passwordConfirmation"],
});
