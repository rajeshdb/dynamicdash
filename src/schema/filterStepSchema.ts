import { z } from "zod";
export const filterOperators = z.enum([
    "eq", "neq", "lt", "lte", "gt", "gte", "contains", "not_contains", "in", "not_in"
  ]);
  
  export  const conditionSchema: z.ZodType<any> = z.lazy(() =>
    z.object({
      logicalOperator: z.enum(["AND", "OR"]).optional(),
      conditions: z.array(z.union([
        // Simple condition
        z.object({
          field: z.string(),
          operator: filterOperators,
          value: z.any()
        }),
        // Nested group condition
        conditionSchema
      ])).min(1)
    })
  );

  export const filterSchema = z.object({
    step: z.number(),
    description: z.string(),
    action: z.literal("FILTER"),
    conditionGroup: conditionSchema
});
