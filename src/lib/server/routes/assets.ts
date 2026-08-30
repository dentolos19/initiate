import { Hono } from "hono";
import { z } from "zod";

const assets = new Hono<{ Bindings: Env }>();

// Upload file
assets.post("/", async (c) => {
  const { auth } = c.var;
  const { bucket } = c.var.integrations;

  if (!auth?.userId) {
    return c.json({ message: "Please login." }, 401);
  }

  const form = await c.req.formData();
  const formData = Object.fromEntries(form.entries());

  const { success, data } = z
    .object({
      file: z.instanceof(File),
      unique: z.boolean().default(false),
    })
    .safeParse(formData);

  if (!success) {
    return c.json({ message: "Invalid form data." }, 400);
  }

  const file = data.file;

  if (!file) {
    return c.json({ message: "File not provided." }, 400);
  }

  const result = await bucket.uploadFile(file, data.unique);
  return c.json(result);
});

// Get file
assets.get("/:id", async (c) => {
  const { bucket } = c.var.integrations;

  const id = c.req.param("id");
  const name = c.req.query("name");

  const result = await bucket.getFile(id, name);
  return c.json(result);
});

export default assets;
