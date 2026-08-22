import { Inngest } from "inngest";

// Define the shape of our events
export type Events = {
  "task/started": {
    data: {
      taskId: string;
      telegramId: string;
      title: string;
      estimatedMinutes: number;
    };
  };
  "task/paused": {
    data: {
      taskId: string;
    };
  };
  "task/completed": {
    data: {
      taskId: string;
    };
  };
  "user/settings.updated": {
    data: {
      username: string;
    };
  };
};

// Create a client to send and receive events
export const inngest = new Inngest({ id: "goal-tracker", schemas: { events: {} as Events } });
