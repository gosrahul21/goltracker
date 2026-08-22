import { serve } from "inngest/next";
import { inngest } from "../../../inngest/client";
import { taskTimer } from "../../../inngest/functions/taskTimer";
import { scheduleDailyBriefs } from "../../../inngest/functions/dailyBriefs";
import { scheduleEveningBriefs } from "../../../inngest/functions/eveningBriefs";

// Create an API that serves zero-downtime background jobs
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    taskTimer,
    scheduleDailyBriefs,
    scheduleEveningBriefs,
  ],
});
