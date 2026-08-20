import { z } from "zod";

export const projectInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000),
  visibility: z.enum(["private", "public"]),
});
