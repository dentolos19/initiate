import { z } from "zod";

import { priceSchema } from "#/lib/backend/schema/prices";

export const currencySchema = z.enum(["sgd", "myr", "usd", "eur", "krw", "cny", "vnd"]);

export type Currency = z.infer<typeof currencySchema>;

export const userTypeSchema = z.enum(["user", "customer", "investor", "company", "admin"]);
export const organizationTypeSchema = z.enum(["startup", "business"]);
export const serviceTypeSchema = z.enum(["api", "mcp", "saas", "other"]);
export const serviceStatusSchema = z.enum(["draft", "unlisted", "published"]);
export const servicePlanStatusSchema = z.enum(["draft", "active", "inactive", "archived"]);
export const orderStatusSchema = z.enum(["draft", "pending", "confirmed", "completed", "cancelled"]);

export type UserType = z.infer<typeof userTypeSchema>;
export type OrganizationType = z.infer<typeof organizationTypeSchema>;
export type ServiceType = z.infer<typeof serviceTypeSchema>;
export type ServiceStatus = z.infer<typeof serviceStatusSchema>;
export type ServicePlanStatus = z.infer<typeof servicePlanStatusSchema>;
export type OrderStatus = z.infer<typeof orderStatusSchema>;

const stringArraySchema = z
  .string()
  .array()
  .nullish()
  .transform((value) => value ?? []);

const emailArraySchema = z
  .string()
  .email()
  .array()
  .nullish()
  .transform((value) => value ?? []);

export const organizationSchema = z.object({
  id: z.string(),
  imageUrl: z.string().nullish(),
  bannerUrl: z.string().nullish(),
  name: z.string(),
  tagline: z.string().nullish(),
  description: z.string().nullish(),
  type: organizationTypeSchema.default("startup"),
  verified: z.boolean().default(false),
  tags: stringArraySchema,
  likes: z.number().default(0),
  isLiked: z.boolean().default(false),

  // Optional
  similarity: z.number().default(0),
});

export const userSchema = z
  .object({
    id: z.string(),
    imageUrl: z.string().nullish(),
    bannerUrl: z.string().nullish(),
    firstName: z.string(),
    lastName: z.string().nullish(),
    email: z.string().email().nullish(),
    emails: emailArraySchema,
    type: userTypeSchema.nullish(),
    location: z.string().nullish(),
    tagline: z.string().nullish(),
    description: z.string().nullish(),
    prompt: z.string().nullish(),
    followers: z.number().default(0),
    following: z.number().default(0),
    isFollowing: z.boolean().default(false),

    // Optional
    similarity: z.number().default(0),
  })
  .transform((user) => {
    const lastName = user.lastName ?? "";
    const emails = user.emails.length > 0 ? user.emails : user.email ? [user.email] : [];

    return {
      ...user,
      emails,
      fullName: `${user.firstName} ${lastName}`.trim(),
      lastName,
    };
  });

export type Organization = z.infer<typeof organizationSchema>;
export type User = z.infer<typeof userSchema>;

export const servicePlanSchema = z.object({
  id: z.string(),
  serviceId: z.string(),
  name: z.string(),
  description: z.string().nullish(),
  status: z.string().default("active"),
  default: z.boolean().default(false),

  priceReference: z.string().nullish(),
  priceData: priceSchema.nullish(),
});

export const serviceSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  imageUrl: z.string().nullish(),
  bannerUrl: z.string().nullish(),
  name: z.string(),
  tagline: z.string().nullish(),
  description: z.string().nullish(),
  type: serviceTypeSchema.default("other"),
  status: serviceStatusSchema.default("draft"),
  tags: stringArraySchema,
  verified: z.boolean().default(false),
  plan: servicePlanSchema.nullish(),
  orders: z.number().default(0),
  likes: z.number().default(0),
  isLiked: z.boolean().default(false),

  // Optional
  summary: z.string().nullish(),
  similarity: z.number().default(0),
});

export type ServicePlan = z.infer<typeof servicePlanSchema>;
export type Service = z.infer<typeof serviceSchema>;

export const organizationReviewSchema = z.object({
  id: z.string(),
  userId: z.string(),
  organizationId: z.string(),
  title: z.string(),
  message: z.string(),
  stars: z.number().min(1).max(5),
  createdAt: z.string().datetime(),

  // Relationships
  user: userSchema,
});

export const serviceReviewSchema = z.object({
  id: z.string(),
  userId: z.string(),
  serviceId: z.string(),
  title: z.string(),
  message: z.string(),
  stars: z.number().min(1).max(5),
  updatedAt: z.string().datetime(),
  createdAt: z.string().datetime(),

  // Relationships
  user: userSchema,
});

export type OrganizationReview = z.infer<typeof organizationReviewSchema>;
export type ServiceReview = z.infer<typeof serviceReviewSchema>;

export const resourceDocumentationSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullish(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const resourceGrantSchema = z.object({
  id: z.string(),
  name: z.string(),
  provider: z.string(),
  location: z.string().nullish(),
  description: z.string().nullish(),
  grant: z.string().nullish(),
  criteria: stringArraySchema,
  process: stringArraySchema,
  websiteUrl: z.string().nullish(),
  applyUrl: z.string().nullish(),
  providerEmail: z.string().nullish(),
  providerPhone: z.string().nullish(),
  deadlineAt: z.string().nullish(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ResourceDocumentation = z.infer<typeof resourceDocumentationSchema>;
export type ResourceGrant = z.infer<typeof resourceGrantSchema>;
