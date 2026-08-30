import { env } from "cloudflare:workers";

import {
  OPENROUTER_API_KEY,
  OPENROUTER_EMBEDDING_DIMENSIONS,
  OPENROUTER_EMBEDDING_MODEL,
  PLATFORM_URL,
} from "#/lib/server/environment.js";

type Embedding = {
  content: string;
  vector: number[];
};

async function createEmbeddings(inputs: string[]): Promise<number[][]> {
  const response = await fetch("https://openrouter.ai/api/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": PLATFORM_URL,
      "X-OpenRouter-Title": "Initiate",
    },
    body: JSON.stringify({
      input: inputs,
      model: OPENROUTER_EMBEDDING_MODEL,
      dimensions: OPENROUTER_EMBEDDING_DIMENSIONS,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter embeddings request failed (${response.status}): ${await response.text()}`);
  }

  const result = (await response.json()) as { data: Array<{ embedding: number[]; index: number }> };
  return result.data.toSorted((left, right) => left.index - right.index).map((item) => item.embedding);
}

export async function generateEmbedding(text: string): Promise<Embedding> {
  const input = text.replace(/\n/g, " ");

  const [embedding] = await createEmbeddings([input]);

  return {
    content: input,
    vector: embedding,
  };
}

export async function generateEmbeddings(...texts: any[]): Promise<Embedding[]> {
  const inputs = texts
    .filter((text): text is string => typeof text === "string")
    .map((text) => text.replace(/\n/g, " "))
    .filter((text) => !!text.trim());

  if (inputs.length === 0) return [];
  const embeddings = await createEmbeddings(inputs);

  return embeddings.map((embedding, index) => {
    return {
      content: inputs[index],
      vector: embedding,
    };
  });
}

export async function aggregateEmbeddings(embeddings: Embedding[]): Promise<Embedding> {
  const averageVector = embeddings[0].vector.map(
    (_, i) => embeddings.reduce((sum, embedding) => sum + embedding.vector[i], 0) / embeddings.length,
  );

  return {
    content: embeddings.map((e) => e.content).join(" "),
    vector: averageVector,
  };
}

export async function indexEmbeddings(index: (vector: number[]) => Promise<void>, ...texts: any[]) {
  try {
    const embeddings = await generateEmbeddings(...texts);
    if (!embeddings.length) return;
    const aggregate = await aggregateEmbeddings(embeddings);
    await index(aggregate.vector);
  } catch (error) {
    console.warn("Could not generate or store embeddings.", error);
  }
}

export async function storeEmbeddings(
  id: string,
  embeddings: Embedding[],
  options?: { aggregate?: boolean; namespace?: string },
) {
  const chunks = embeddings.map((embedding, index) => ({
    id: `${id}_${index}`,
    vector: embedding.vector,
    metadata: {
      id: id,
      content: embedding.content,
      aggregated: false,
    },
  }));

  if (options?.aggregate) {
    const averageEmbedding = await aggregateEmbeddings(embeddings);
    chunks.unshift({
      id: id,
      vector: averageEmbedding.vector,
      metadata: {
        id: id,
        content: averageEmbedding.content,
        aggregated: true,
      },
    });
  }

  await env.VECTORIZE.upsert(
    chunks.map((chunk) => ({
      id: chunk.id,
      namespace: options?.namespace,
      values: chunk.vector,
      metadata: chunk.metadata,
    })),
  );
}

export async function deleteEmbeddings(id: string) {
  await env.VECTORIZE.deleteByIds([id]);
}

export async function queryEmbedding(
  embedding: Embedding,
  options?: {
    aggregate?: boolean;
    namespace?: string;
    amount?: number;
  },
) {
  const result = await env.VECTORIZE.query(embedding.vector, {
    topK: options?.amount ?? 100,
    namespace: options?.namespace,
    returnMetadata: "all",
    filter: { aggregated: options?.aggregate ?? false },
  });

  return result.matches.map((item) => ({
    id: item.metadata?.id as string,
    content: item.metadata?.content as string,
    score: item.score,
  }));
}
