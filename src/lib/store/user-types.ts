import { UserType } from "#/lib/backend/schema";

const userTypes = [
  {
    label: "Customer",
    value: "customer",
  },
  {
    label: "Investor",
    value: "investor",
  },
  {
    label: "Company Representative",
    value: "company",
  },
  {
    label: "Administrator",
    value: "admin",
  },
] satisfies {
  label: string;
  value: UserType;
}[];

export default userTypes;
