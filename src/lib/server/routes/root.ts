import { Hono } from "hono";

const root = new Hono();

root.get("/", (c) => {
  return c.text("Initiate!");
});

export default root;
