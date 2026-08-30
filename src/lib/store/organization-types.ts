import { OrganizationType } from "#/lib/backend/schema";

const organizationTypes = [
  {
    label: "Startup",
    value: "startup",
  },
  {
    label: "Business",
    value: "business",
  },
] satisfies {
  label: string;
  value: OrganizationType;
}[];

export default organizationTypes;
