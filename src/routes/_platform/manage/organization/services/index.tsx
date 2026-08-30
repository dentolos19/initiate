import { createFileRoute } from "@tanstack/react-router";
import { EditIcon, EyeIcon, PlusIcon, SearchIcon, TrashIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "#/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "#/components/ui/table";
import useBackend from "#/lib/backend/client";
import { Service } from "#/lib/backend/schema";
import { useSession } from "#/lib/providers/session";
import Link from "#/lib/router";
import serviceStatus from "#/lib/store/service-status";
import serviceTypes from "#/lib/store/service-types";
import { getLabel } from "#/lib/utils";
import Loading from "#/routes/-components/loading";

export const Route = createFileRoute("/_platform/manage/organization/services/")({ component: Page });

export default function Page() {
  const backend = useBackend();
  const { organization } = useSession();

  const [loading, setLoading] = useState<boolean>(true);
  const [services, setServices] = useState<Service[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");

  function loadServices() {
    if (!organization) return;
    setLoading(true);
    backend.organization
      .getOrganizationServices(organization!.id)
      .then((services) => {
        setServices(services);
      })
      .catch((error: Error) => {
        console.error(error);
        toast.error(error.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }

  function deleteService(id: string) {
    backend.service
      .deleteService(id)
      .then(() => {
        toast.success("Service deleted.");
      })
      .catch((error: Error) => {
        console.error(error);
        toast.error(error.message);
      })
      .finally(() => {
        loadServices();
      });
  }

  useEffect(loadServices, [organization]);

  const filteredServices = services.filter((service) => {
    const searchLower = searchTerm.toLowerCase();
    const serviceType = getLabel(serviceTypes, service.type, "Unknown");
    const serviceStatusLabel = getLabel(serviceStatus, service.status, "Unknown");

    return (
      service.name.toLowerCase().includes(searchLower) ||
      (service.tagline && service.tagline.toLowerCase().includes(searchLower)) ||
      (serviceType && serviceType.toLowerCase().includes(searchLower)) ||
      (serviceStatusLabel && serviceStatusLabel.toLowerCase().includes(searchLower))
    );
  });

  if (loading) {
    return <Loading />;
  }

  return (
    <div>
      <div className={"flex gap-2 border-b p-2"}>
        <div className={"relative flex-1"}>
          <Input
            className={"pl-9"}
            placeholder={"Search services…"}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className={"text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"}>
            <SearchIcon className={"size-4"} aria-hidden="true" />
          </div>
        </div>
        <Button variant={"default"} asChild>
          <Link className={"flex items-center"} href={"/manage/organization/services/create"}>
            <PlusIcon />
            <span>Create Service</span>
          </Link>
        </Button>
      </div>

      <div className="overflow-x-auto border-b">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Plans</TableHead>
              <TableHead>Likes</TableHead>
              <TableHead>Orders</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredServices.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} className={"text-muted-foreground py-4 text-center"}>
                  {searchTerm ? "No services match your search." : "No services found."}
                </TableCell>
              </TableRow>
            )}

            {filteredServices.map((service) => (
              <TableRow key={service.id}>
                <TableCell>
                  <h3 className={"font-medium"}>{service.name}</h3>
                  <p className={"text-muted-foreground text-xs"}>{service.tagline || "No tagline available."}</p>
                </TableCell>
                <TableCell>{getLabel(serviceTypes, service.type, "Unknown")}</TableCell>
                <TableCell>{getLabel(serviceStatus, service.status, "Unknown")}</TableCell>
                <TableCell>{service.plan?.name ?? "No default plan"}</TableCell>
                <TableCell>{service.likes}</TableCell>
                <TableCell>{service.orders}</TableCell>
                <TableCell className={"flex gap-2"}>
                  <Button variant={"outline"} size={"sm"} asChild>
                    <Link href={`/services/${service.id}`}>
                      <EyeIcon />
                      <span>Preview</span>
                    </Link>
                  </Button>
                  <Button variant={"outline"} size={"sm"} asChild>
                    <Link href={`/manage/organization/services/${service.id}`}>
                      <EditIcon />
                      <span>Edit</span>
                    </Link>
                  </Button>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant={"destructive"} size={"sm"}>
                        <TrashIcon />
                        <span>Delete</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className={"w-60"}>
                      <h3 className={"mb-1 font-semibold"}>Delete Service?</h3>
                      <p className={"text-muted-foreground mb-3 text-sm"}>This action cannot be undone.</p>
                      <Button variant={"destructive"} size={"sm"} onClick={() => deleteService(service.id)}>
                        Delete Service
                      </Button>
                    </PopoverContent>
                  </Popover>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
