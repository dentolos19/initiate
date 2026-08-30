import { ServiceType } from "#/lib/backend/schema";

const serviceTypes = [
  {
    label: "API Service",
    value: "api",
  },
  {
    label: "MCP Server",
    value: "mcp",
  },
  {
    label: "Software-as-a-Service (SaaS)",
    value: "saas",
  },
  {
    label: "Other",
    value: "other",
  },
] satisfies {
  label: string;
  value: ServiceType;
}[];

export default serviceTypes;
