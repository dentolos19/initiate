import { eq } from "drizzle-orm";

import { asset } from "#/lib/database/schema.js";
import type { AppContext } from "#/lib/server/types.js";

function toHex(value: ArrayBuffer) {
  return Array.from(new Uint8Array(value), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function toUrl(id: string, name?: string) {
  const search = name ? `?name=${encodeURIComponent(name)}` : "";
  return `/assets/${encodeURIComponent(id)}${search}`;
}

export function createBucketClient(context: AppContext) {
  return {
    uploadFile: async (file: File, unique: boolean = false) => {
      const { database } = context.var.integrations;

      const fileName = file.name;
      const fileType = file.type || "application/octet-stream";
      const fileSize = file.size;

      const fileBuffer = await file.arrayBuffer();
      const checksum = await crypto.subtle.digest("SHA-256", fileBuffer);
      const fileHash = toHex(checksum);

      let fileRecord;

      if (unique) {
        fileRecord = await database.query.asset.findFirst({
          where: {
            hash: fileHash,
          },
        });
      }

      if (!fileRecord) {
        const id = crypto.randomUUID();
        const object = await context.env.BUCKET.put(id, fileBuffer, {
          customMetadata: {
            hash: fileHash,
            name: fileName,
            type: fileType,
          },
          httpMetadata: { contentType: fileType },
          sha256: checksum,
        });

        if (!object) throw new Error(`Failed to upload asset ${id} to R2.`);

        [fileRecord] = await database
          .insert(asset)
          .values({
            hash: fileHash,
            id,
            name: fileName,
            size: fileSize,
            type: fileType,
          })
          .returning();
      }

      return {
        ...fileRecord,
        url: toUrl(fileRecord.id, fileName),
      };
    },

    getFile: async (id: string, name?: string) => {
      const { database } = context.var.integrations;

      let fileRecord = await database.query.asset.findFirst({
        where: {
          id: id,
        },
      });

      if (!fileRecord) {
        const object = await context.env.BUCKET.head(id);
        if (!object) throw new Error(`Asset ${id} was not found in R2.`);

        const fileName = object.customMetadata?.name ?? id;
        const fileType = object.httpMetadata?.contentType ?? object.customMetadata?.type ?? "application/octet-stream";
        const fileHash = object.customMetadata?.hash ?? object.etag;

        [fileRecord] = await database
          .insert(asset)
          .values({
            hash: fileHash,
            id,
            name: fileName,
            size: object.size,
            type: fileType,
          })
          .returning();
      }

      const fileName = name || fileRecord.name;

      [fileRecord] = await database
        .update(asset)
        .set({ accessedAt: new Date() })
        .where(eq(asset.id, fileRecord.id))
        .returning();

      return {
        ...fileRecord,
        url: toUrl(fileRecord.id, fileName),
      };
    },
  };
}
