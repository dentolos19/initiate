import { ServiceStatus } from "#/lib/backend/schema";

const serviceStatus = [
  {
    label: "Draft",
    value: "draft",
  },
  {
    label: "Unlisted",
    value: "unlisted",
  },
  {
    label: "Published",
    value: "published",
  },
] satisfies {
  label: string;
  value: ServiceStatus;
}[];

export default serviceStatus;
