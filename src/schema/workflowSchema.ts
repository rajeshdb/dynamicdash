import z from "zod";
import { filterSchema } from "./filterStepSchema.js";
import { httpStepSchema } from "./httpStepSchema.js";
import { displayStepSchema } from "./displayStepSchema.js";

export  const workflowSchema = z.object({
    steps: z.array(z.union([filterSchema, httpStepSchema, displayStepSchema]))
  });  