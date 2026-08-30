import { useEffect, useState } from "react";
import { toast } from "sonner";

import LoadingSpinner from "#/components/loading-spinner";
import useBackend from "#/lib/backend/client";
import { User } from "#/lib/backend/schema";
import { useSearchParams } from "#/lib/router";
import UserCard from "#/routes/_platform/-components/user-card";

export default function SearchUsers() {
  const backend = useBackend();
  const searchParams = useSearchParams();

  const query = searchParams.get("query") as string;

  const [loading, setLoading] = useState<boolean>(true);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    if (!query) {
      setLoading(false);
      return;
    }

    backend.user
      .searchUsers(query)
      .then((data) => {
        setUsers(data);
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

  if (!users.length) {
    return <div className={"text-muted-foreground my-10 text-center"}>No users found.</div>;
  }

  return (
    <div className={"grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"}>
      {users.map((user) => (
        <UserCard key={user.id} data={user} />
      ))}
    </div>
  );
}
