import { WorkflowEntrypoint, WorkflowStep, type WorkflowEvent } from "cloudflare:workers";

import { createDatabase, insertEmbedding } from "#/lib/server/integrations/database.js";
import { generateEmbeddings, aggregateEmbeddings } from "#/lib/server/lib/embeddings.js";
import { forceSerializable } from "#/lib/server/lib/utils.js";

export class SynchronizeWorkflow extends WorkflowEntrypoint<Env, unknown> {
  async run(event: Readonly<WorkflowEvent<unknown>>, step: WorkflowStep) {
    const database = createDatabase(this.env.HYPERDRIVE);

    const services = await step.do("Get Services", async () => {
      const result = await database.query.service.findMany({
        columns: { description: true, id: true, name: true, tagline: true },
      });
      return forceSerializable(result);
    });

    for (const service of services) {
      await step.do(`Synchronize Service Embedding: ${service.id}`, async () => {
        const embeddings = await generateEmbeddings(service.name, service.tagline, service.description);
        const aggregated = await aggregateEmbeddings(embeddings);
        await insertEmbedding("service", service.id, aggregated.vector, this.env.VECTORIZE);
      });
    }

    const users = await step.do("Get Users", async () => {
      const result = await database.query.user.findMany({
        columns: { description: true, firstName: true, id: true, lastName: true, tagline: true },
      });
      return forceSerializable(result);
    });

    for (const user of users) {
      await step.do(`Synchronize User Embedding: ${user.id}`, async () => {
        const embeddings = await generateEmbeddings(
          `${user.firstName} ${user.lastName ?? ""}`.trim(),
          user.tagline,
          user.description,
        );
        const aggregated = await aggregateEmbeddings(embeddings);
        await insertEmbedding("user", user.id, aggregated.vector, this.env.VECTORIZE);
      });
    }

    const organizations = await step.do("Get Organizations", async () => {
      const organizations = await database.query.organization.findMany({
        columns: { description: true, id: true, name: true, tagline: true },
      });
      return forceSerializable(organizations);
    });

    for (const organization of organizations) {
      await step.do(`Synchronize Organization Embedding: ${organization.id}`, async () => {
        const embeddings = await generateEmbeddings(organization.name, organization.tagline, organization.description);
        const aggregated = await aggregateEmbeddings(embeddings);
        await insertEmbedding("organization", organization.id, aggregated.vector, this.env.VECTORIZE);
      });
    }
  }
}
