import { AsyncLocalStorage } from "node:async_hooks";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { relations } from "#/lib/database/relations";
import { generateEmbedding } from "#/lib/server/lib/embeddings";

type DatabaseContext = {
  database: AppDatabase;
  vectorIndex?: VectorizeIndex;
};

const databaseStorage = new AsyncLocalStorage<DatabaseContext>();

export function createDatabase(connection?: string | Hyperdrive) {
  const connectionString = typeof connection === "string" ? connection : connection?.connectionString;
  const url = connectionString ?? process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL or a Hyperdrive binding is required.");

  const client = postgres(url, { max: 5, prepare: false });
  return drizzle({ client, relations });
}

export const createDrizzleDatabase = createDatabase;
export type AppDatabase = ReturnType<typeof createDatabase>;

export function runWithDatabase<T>(database: AppDatabase, vectorIndex: VectorizeIndex | undefined, callback: () => T) {
  return databaseStorage.run({ database, vectorIndex }, callback);
}

function currentContext() {
  const context = databaseStorage.getStore();
  if (context) return context;

  return { database: createDatabase(), vectorIndex: undefined };
}

export const database = new Proxy({} as AppDatabase, {
  get: (_target, property) => currentContext().database[property as keyof AppDatabase],
});

function requireVectorIndex() {
  const vectorIndex = currentContext().vectorIndex;
  if (!vectorIndex) throw new Error("The VECTORIZE binding is required for semantic search.");
  return vectorIndex;
}

export async function insertEmbedding(tableName: string, id: string, vector: number[], vectorIndex?: VectorizeIndex) {
  try {
    await (vectorIndex ?? requireVectorIndex()).upsert([{ id, namespace: tableName, values: vector }]);
  } catch (error) {
    console.warn(`Could not index ${tableName} record ${id}.`, error);
  }
}

export async function searchEmbeddings(tableName: string, vector: number[], page = 1, limit = 10) {
  const offset = Math.max(0, page - 1) * limit;
  const topK = Math.min(offset + limit, 100);
  const result = await requireVectorIndex().query(vector, { namespace: tableName, topK });

  return result.matches.slice(offset, offset + limit).map((item) => ({ id: item.id, similarity: item.score }));
}

export async function searchRecords(tableName: string, query: string, page = 1, limit = 10) {
  const embedding = await generateEmbedding(query);
  return searchEmbeddings(tableName, embedding.vector, page, limit);
}
