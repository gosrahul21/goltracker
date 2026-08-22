import { Inngest } from "inngest";
const inngest = new Inngest({ id: "test" });
inngest.createFunction(
  { id: "test", triggers: [{ event: "test" }] },
  async ({ event, step }) => {}
);
