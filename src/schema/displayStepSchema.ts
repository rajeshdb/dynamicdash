import { z } from "zod";

 export const displayTypes = z.enum([
    "TABLE",
    "BAR_CHART",
    "LINE_CHART",
    "PIE_CHART",
    "SCATTER_PLOT",
    "AREA_CHART"
  ]);
  
  export const displayStepSchema = z.object({
    step: z.number(),
    description: z.string(),
    action: z.literal("DISPLAY"),
    displayType: displayTypes,
    xField: z.string().optional(), // For charts
    yField: z.union([z.string(), z.array(z.string())]).optional(), // Can be multiple series
    groupBy: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
    limit: z.number().optional(), // Max rows for tables
    options: z.record(z.any()).optional() // Extra visualization library-specific options
  });