import {
  CalendarIcon,
  ExternalLinkIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  BuildingIcon,
  DollarSignIcon,
} from "lucide-react";

import LoadingSpinner from "#/components/loading-spinner";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "#/components/ui/dialog";
import { Separator } from "#/components/ui/separator";
import { ResourceGrant } from "#/lib/backend/schema";

interface GrantModalProps {
  grant: ResourceGrant;
  onClose: () => void;
  loading?: boolean;
}

export default function GrantModal({ grant, onClose, loading }: GrantModalProps) {
  if (loading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-h-[80vh] max-w-4xl overflow-y-auto">
          <div className="flex items-center justify-center py-16">
            <LoadingSpinner />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const formatDeadline = (dateString: string | null) => {
    if (!dateString) return "No deadline specified";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-h-[80vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-2">
              <DialogTitle className="text-2xl">{grant.name}</DialogTitle>
              <div className="text-muted-foreground flex items-center gap-2 text-lg">
                <BuildingIcon className="h-5 w-5" />
                <span>{grant.provider}</span>
              </div>
            </div>
            <Badge variant="secondary">Grant</Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info Cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {grant.location && (
              <div className="bg-muted/30 rounded-lg p-4">
                <div className="text-muted-foreground mb-1 flex items-center gap-2 text-sm font-medium">
                  <MapPinIcon className="h-4 w-4" />
                  Location
                </div>
                <p className="font-medium">{grant.location}</p>
              </div>
            )}

            {grant.grant && (
              <div className="bg-primary/10 rounded-lg p-4">
                <div className="text-muted-foreground mb-1 flex items-center gap-2 text-sm font-medium">
                  <DollarSignIcon className="h-4 w-4" />
                  Funding
                </div>
                <p className="text-primary font-medium">{grant.grant}</p>
              </div>
            )}

            {grant.deadlineAt && (
              <div className="rounded-lg bg-orange-50 p-4 dark:bg-orange-950">
                <div className="text-muted-foreground mb-1 flex items-center gap-2 text-sm font-medium">
                  <CalendarIcon className="h-4 w-4" />
                  Deadline
                </div>
                <p className="font-medium text-orange-700 dark:text-orange-300">{formatDeadline(grant.deadlineAt)}</p>
              </div>
            )}
          </div>

          {/* Description */}
          {grant.description && (
            <div>
              <h3 className="mb-2 font-semibold">Description</h3>
              <p className="text-muted-foreground">{grant.description}</p>
            </div>
          )}

          <Separator />

          {/* Eligibility Criteria */}
          {grant.criteria && grant.criteria.length > 0 && (
            <div>
              <h3 className="mb-3 font-semibold">Eligibility Criteria</h3>
              <ul className="space-y-2">
                {grant.criteria.map((criterion: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="bg-primary mt-2 h-2 w-2 flex-shrink-0 rounded-full"></span>
                    <span className="text-muted-foreground">{criterion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Application Process */}
          {grant.process && grant.process.length > 0 && (
            <div>
              <h3 className="mb-3 font-semibold">Application Process</h3>
              <ol className="space-y-2">
                {grant.process.map((step: string, index: number) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="bg-primary text-primary-foreground flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-sm font-medium">
                      {index + 1}
                    </span>
                    <span className="text-muted-foreground">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          <Separator />

          {/* Contact Information */}
          <div>
            <h3 className="mb-3 font-semibold">Contact Information</h3>
            <div className="space-y-2">
              {grant.providerEmail && (
                <div className="flex items-center gap-2">
                  <MailIcon className="text-muted-foreground h-4 w-4" />
                  <a href={`mailto:${grant.providerEmail}`} className="text-primary hover:underline">
                    {grant.providerEmail}
                  </a>
                </div>
              )}

              {grant.providerPhone && (
                <div className="flex items-center gap-2">
                  <PhoneIcon className="text-muted-foreground h-4 w-4" />
                  <a href={`tel:${grant.providerPhone}`} className="text-primary hover:underline">
                    {grant.providerPhone}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            {grant.applyUrl && (
              <Button asChild>
                <a href={grant.applyUrl} target="_blank" rel="noopener noreferrer">
                  Apply Now
                  <ExternalLinkIcon className="ml-2 h-4 w-4" />
                </a>
              </Button>
            )}

            {grant.websiteUrl && (
              <Button variant="outline" asChild>
                <a href={grant.websiteUrl} target="_blank" rel="noopener noreferrer">
                  Learn More
                  <ExternalLinkIcon className="ml-2 h-4 w-4" />
                </a>
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
