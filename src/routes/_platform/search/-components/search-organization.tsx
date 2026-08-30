import { useEffect, useState } from "react";
import { toast } from "sonner";

import LoadingSpinner from "#/components/loading-spinner";
import useBackend from "#/lib/backend/client";
import { Organization } from "#/lib/backend/schema";
import { useSearchParams } from "#/lib/router";
import OrganizationCard from "#/routes/_platform/-components/organization-card";

export default function SearchOrganizations() {
  const backend = useBackend();
  const searchParams = useSearchParams();

  const query = searchParams.get("query") as string;

  const [loading, setLoading] = useState<boolean>(true);
  const [organizations, setOrganizations] = useState<Organization[]>([]);

  useEffect(() => {
    if (!query) {
      setLoading(false);
      return;
    }

    backend.organization
      .searchOrganizations(query)
      .then((data) => {
        setOrganizations(data);
      })
      .catch((error: Error) => {
        console.error(error);
        toast.error(error.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [query]);

  if (loading) {
    return (
      <div className={"my-10 text-center"}>
        <LoadingSpinner />
      </div>
    );
  }

  if (!query) {
    return <div className={"text-muted-foreground my-10 text-center"}>Search something to get started!</div>;
  }

  if (!organizations.length) {
    return <div className={"text-muted-foreground my-10 text-center"}>No organizations found.</div>;
  }

  return (
    <div className={"grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"}>
      {organizations.map((organization) => (
        <OrganizationCard key={organization.id} data={organization} />
      ))}
    </div>
  );
}
