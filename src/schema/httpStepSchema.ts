import { z } from "zod";

export const httpActions = z.enum([
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "FILTER" // FILTER is not HTTP but part of workflow logic
  ]);
  
  // Filter operators

  export  const httpStepSchema = z.object({
    step: z.number(),
    description: z.string(),
    action: httpActions,
    endpoint: z.string().url(),
    params: z.record(z.string()),
    body: z.record(z.any()).optional()     // request body (only for POST, PUT, PATCH)

  });
  