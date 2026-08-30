import {
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  ExternalLink,
  Globe,
  Mail,
  MapPin,
  PhoneCall,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { useState } from "react";
import Markdown from "react-markdown";
import { toast } from "sonner";

import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "#/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "#/components/ui/dialog";
import { ScrollArea } from "#/components/ui/scroll-area";
import { Separator } from "#/components/ui/separator";
import useBackend from "#/lib/backend/client";
import { ResourceGrant } from "#/lib/backend/schema";
import { useSession } from "#/lib/providers/session";

export default function GrantCard({ grant }: { grant: ResourceGrant }) {
  const backend = useBackend();
  const session = useSession();

  // State management
  const [loading, setLoading] = useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(false);
  const [summaryText, setSummaryText] = useState<string>();
  const [similarityScore, setSimilarityScore] = useState<number>(0);

  // Helper function to get urgency status based on deadline
  function getDeadlineStatus(deadline: string | null | undefined) {
    if (!deadline) return null;

    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        status: "expired",
        color: "text-red-600",
        bg: "bg-red-50 border-red-200",
      };
    }
    if (diffDays <= 7) {
      return {
        status: "urgent",
        color: "text-orange-600",
        bg: "bg-orange-50 border-orange-200",
      };
    }
    if (diffDays <= 30) {
      return {
        status: "soon",
        color: "text-yellow-600",
        bg: "bg-yellow-50 border-yellow-200",
      };
    }
    return {
      status: "normal",
      color: "text-green-600",
      bg: "bg-green-50 border-green-200",
    };
  }

  function formatFunding(funding: string | null | undefined) {
    if (!funding) return "Not specified";

    // Add some basic formatting for common patterns
    const cleanFunding = funding.replace(/\$|,/g, "");
    const num = parseFloat(cleanFunding);

    if (!isNaN(num)) {
      if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
      if (num >= 1000) return `$${(num / 1000).toFixed(0)}K`;
      return `$${num.toLocaleString()}`;
    }

    return funding;
  }

  // Computed values
  const deadlineStatus = getDeadlineStatus(grant.deadlineAt);

  // Event handlers
  const handleAskAi = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);
    setSummaryText(undefined);

    try {
      console.log("Asking AI for grant suitability", grant);
      const { result, similarityScore } = await backend.ai.getGrantSuitability(grant);
      setSummaryText(result);
      setSimilarityScore(similarityScore || 0);
    } catch (err: any) {
      console.error("Error getting AI result:", err);
      toast.error("Failed to analyze grant suitability. Please try again.");
      setSummaryText("Failed to get AI analysis. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Helper functions for styling
  const getCardClassName = () => {
    const baseClasses = [
      "group relative overflow-hidden border cursor-pointer w-full",
      "border-border/50 bg-gradient-to-br from-background to-background/80",
      "transition-[border-color,opacity] duration-300",
      "hover:border-primary/20",
    ];

    if (deadlineStatus?.status === "urgent") {
      baseClasses.push("ring-2 ring-orange-200");
    } else if (deadlineStatus?.status === "expired") {
      baseClasses.push("opacity-75 ring-2 ring-red-200");
    }

    return baseClasses.join(" ");
  };

  const getDeadlineText = () => {
    if (deadlineStatus?.status === "expired") return "Expired";
    if (deadlineStatus?.status === "urgent") return "Urgent";
    return "Due Soon";
  };

  const getSimilarityBadgeColor = (score: number) => {
    if (score < 30) return "bg-red-500/90";
    if (score < 60) return "bg-orange-500/90";
    if (score < 80) return "bg-yellow-500/90";
    return "bg-emerald-600/90";
  };

  return (
    <div>
      <Card
        key={grant.id}
        aria-label={`View ${grant.name}`}
        className={getCardClassName()}
        role="button"
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          setOpen(true);
        }}
      >
        {/* Deadline indicator */}
        {deadlineStatus && deadlineStatus.status !== "normal" && (
          <div
            className={`absolute top-0 right-0 px-3 py-1 text-xs font-semibold ${deadlineStatus.color} ${deadlineStatus.bg} rounded-bl-lg border-b border-l`}
          >
            {getDeadlineText()}
          </div>
        )}

        <CardHeader className={"pb-4"}>
          {/* FULL WIDTH LAYOUT */}
          <div className={"flex items-start justify-between gap-6"}>
            {/* Left side - Grant info (takes most space) */}
            <div className={"min-w-0 flex-1"}>
              <CardTitle
                className={
                  "text-primary group-hover:text-primary/80 mb-3 text-2xl leading-tight break-words transition-colors"
                }
              >
                {grant.name}
              </CardTitle>

              <div className={"flex flex-wrap items-center gap-4"}>
                <div className={"flex items-center gap-2"}>
                  <Building2 className={"text-muted-foreground h-4 w-4"} />
                  <span className={"text-muted-foreground text-sm font-medium"}>{grant.provider}</span>
                </div>

                {grant.location && (
                  <div className={"flex items-center gap-2"}>
                    <MapPin className={"text-muted-foreground h-4 w-4"} />
                    <span className={"text-muted-foreground text-sm font-medium"}>{grant.location}</span>
                  </div>
                )}

                <Badge
                  variant={"secondary"}
                  className={"bg-primary/10 text-primary border-primary/20 px-3 py-1 text-xs font-semibold"}
                >
                  Grant
                </Badge>
              </div>
            </div>

            {/* Right side - Funding and deadline */}
            <div className={"flex min-w-fit flex-col items-end gap-3"}>
              <div className={"bg-primary/5 border-primary/20 flex items-center gap-2 rounded-lg border px-4 py-3"}>
                <DollarSign className={"text-primary h-5 w-5"} />
                <span className={"text-primary text-lg font-bold"}>{formatFunding(grant.grant)}</span>
              </div>

              {grant.deadlineAt && (
                <div className={`flex items-center gap-2 text-sm ${deadlineStatus?.color || "text-muted-foreground"}`}>
                  <Clock className={"h-4 w-4"} />
                  <span className={"font-medium"}>{new Date(grant.deadlineAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className={"pt-0"}>
          {/* Grant description */}
          <CardDescription className={"text-foreground mb-6 line-clamp-3 text-base leading-relaxed"}>
            {grant.description}
          </CardDescription>

          {/* Quick stats - Full width row */}
          <div className={"mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4"}>
            {grant.criteria && grant.criteria.length > 0 && (
              <div className={"bg-muted/30 flex items-center gap-2 rounded-lg p-3"}>
                <Users className={"text-primary h-4 w-4"} />
                <div>
                  <p className={"text-muted-foreground text-xs"}>Requirements</p>
                  <p className={"text-sm font-medium"}>{grant.criteria.length} criteria</p>
                </div>
              </div>
            )}

            {grant.process && grant.process.length > 0 && (
              <div className={"bg-muted/30 flex items-center gap-2 rounded-lg p-3"}>
                <CheckCircle className={"text-primary h-4 w-4"} />
                <div>
                  <p className={"text-muted-foreground text-xs"}>Process</p>
                  <p className={"text-sm font-medium"}>{grant.process.length} steps</p>
                </div>
              </div>
            )}

            {grant.deadlineAt && (
              <div className={"bg-muted/30 flex items-center gap-2 rounded-lg p-3"}>
                <Calendar className={"text-primary h-4 w-4"} />
                <div>
                  <p className={"text-muted-foreground text-xs"}>Deadline</p>
                  <p className={"text-sm font-medium"}>{new Date(grant.deadlineAt).toLocaleDateString()}</p>
                </div>
              </div>
            )}

            {grant.location && (
              <div className={"bg-muted/30 flex items-center gap-2 rounded-lg p-3"}>
                <MapPin className={"text-primary h-4 w-4"} />
                <div>
                  <p className={"text-muted-foreground text-xs"}>Location</p>
                  <p className={"text-sm font-medium"}>{grant.location}</p>
                </div>
              </div>
            )}
          </div>

          {/* Action buttons - Full width */}
          <div className={"flex flex-col gap-3 sm:flex-row sm:justify-between"}>
            <div className={"flex gap-3"}>
              <Button asChild className={"group"}>
                <a
                  href={grant.applyUrl || grant.websiteUrl || "#"}
                  target={"_blank"}
                  rel={"noopener noreferrer"}
                  className={"flex items-center gap-2"}
                  onClick={(e) => e.stopPropagation()}
                >
                  Apply Now
                  <ExternalLink className={"h-4 w-4 transition-transform group-hover:translate-x-1"} />
                </a>
              </Button>

              {session.organization && (
                <Button
                  onClick={handleAskAi}
                  disabled={loading}
                  variant={"outline"}
                  className={"group relative overflow-hidden"}
                >
                  <Sparkles className={"mr-2 h-4 w-4"} />
                  {loading ? "Analyzing…" : "Ask AI"}
                  {!loading && (
                    <div
                      className={
                        "absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-[100%]"
                      }
                    />
                  )}
                </Button>
              )}
            </div>

            <Button
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(true);
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              View Full Details →
            </Button>
          </div>

          {/* AI Analysis Results */}
          {summaryText && (
            <Card className={"from-primary/5 my-6 border bg-gradient-to-br to-transparent"}>
              <CardHeader className={"pb-3"}>
                <div className={"flex items-center justify-between"}>
                  <CardTitle className={"flex items-center gap-2 text-lg"}>
                    <div className={"bg-primary/10 rounded-full p-1"}>
                      <TrendingUp className={"text-primary h-4 w-4"} />
                    </div>
                    AI Analysis
                  </CardTitle>

                  {similarityScore > 0 && (
                    <Badge className={`${getSimilarityBadgeColor(similarityScore)} text-xs font-bold text-white`}>
                      {similarityScore}% match
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                <div className={"prose prose-sm dark:prose-invert max-w-none"}>
                  <Markdown>{summaryText}</Markdown>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Grant Details Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className={"max-h-[85vh] max-w-[90vw] overflow-hidden p-0 sm:max-w-[80vw] md:max-w-[75vw] lg:max-w-[70vw]"}
        >
          <ScrollArea className={"max-h-[85vh] p-6"}>
            {/* Dialog Header */}
            <DialogHeader className={"mb-4"}>
              <DialogTitle className={"text-primary text-2xl font-bold"}>{grant.name}</DialogTitle>
              <div className={"mt-2 flex flex-wrap items-center gap-4"}>
                <div className={"flex items-center gap-2"}>
                  <Building2 className={"text-muted-foreground h-5 w-5"} />
                  <span className={"text-muted-foreground text-base"}>{grant.provider}</span>
                </div>
                {grant.location && (
                  <div className={"flex items-center gap-2"}>
                    <MapPin className={"text-muted-foreground h-5 w-5"} />
                    <span className={"text-muted-foreground text-base"}>{grant.location}</span>
                  </div>
                )}
                <Badge variant={"outline"} className={"ml-auto"}>
                  Grant
                </Badge>
              </div>
            </DialogHeader>

            {/* Key Information Cards */}
            <div className={"mb-6 grid grid-cols-1 gap-6 md:grid-cols-2"}>
              <div className={"bg-muted/30 flex items-center gap-3 rounded-md p-4"}>
                <div className={"bg-primary/10 rounded-full p-2"}>
                  <DollarSign className={"text-primary h-5 w-5"} />
                </div>
                <div>
                  <p className={"text-muted-foreground text-sm"}>Funding</p>
                  <p className={"font-semibold"}>{formatFunding(grant.grant)}</p>
                </div>
              </div>

              <div className={"bg-muted/30 flex items-center gap-3 rounded-md p-4"}>
                <div className={"bg-primary/10 rounded-full p-2"}>
                  <Calendar className={"text-primary h-5 w-5"} />
                </div>
                <div>
                  <p className={"text-muted-foreground text-sm"}>Deadline</p>
                  <p className={"font-semibold"}>
                    {grant.deadlineAt ? new Date(grant.deadlineAt).toLocaleDateString() : "No deadline specified"}
                  </p>
                </div>
              </div>
            </div>

            {/* Detailed Information Sections */}
            <div className={"space-y-6"}>
              {/* Description */}
              <div>
                <h3 className={"mb-2 text-lg font-medium"}>Description</h3>
                <p className={"text-muted-foreground"}>{grant.description}</p>
              </div>

              <Separator />

              {/* Eligibility Criteria */}
              <div>
                <h3 className={"mb-2 text-lg font-medium"}>Eligibility Criteria</h3>
                {grant.criteria && grant.criteria.length > 0 ? (
                  <ul className={"list-none space-y-2"}>
                    {grant.criteria.map((criteria, index) => (
                      <li key={index} className={"flex items-start gap-2"}>
                        <CheckCircle className={"text-primary mt-0.5 h-5 w-5 shrink-0"} />
                        <span>{criteria}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className={"text-muted-foreground"}>No eligibility criteria specified.</p>
                )}
              </div>

              <Separator />

              {/* Application Process */}
              <div>
                <h3 className={"mb-2 text-lg font-medium"}>Application Process</h3>
                {grant.process && grant.process.length > 0 ? (
                  <ol className={"ml-5 list-decimal space-y-2"}>
                    {grant.process.map((step, index) => (
                      <li key={index} className={"text-muted-foreground"}>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className={"text-muted-foreground"}>No application process details provided.</p>
                )}
              </div>

              <Separator />

              {/* Contact Information */}
              <div>
                <h3 className={"mb-2 text-lg font-medium"}>Contact Information</h3>
                <div className={"grid grid-cols-1 gap-4 md:grid-cols-3"}>
                  {grant.websiteUrl && (
                    <div className={"flex items-center gap-2"}>
                      <Globe className={"text-muted-foreground h-4 w-4"} />
                      <a
                        href={grant.websiteUrl.startsWith("http") ? grant.websiteUrl : `https://${grant.websiteUrl}`}
                        target={"_blank"}
                        rel={"noopener noreferrer"}
                        className={"text-primary truncate hover:underline"}
                      >
                        Website
                      </a>
                    </div>
                  )}

                  {grant.providerEmail && (
                    <div className={"flex items-center gap-2"}>
                      <Mail className={"text-muted-foreground h-4 w-4"} />
                      <a href={`mailto:${grant.providerEmail}`} className={"text-primary truncate hover:underline"}>
                        {grant.providerEmail}
                      </a>
                    </div>
                  )}

                  {grant.providerPhone && (
                    <div className={"flex items-center gap-2"}>
                      <PhoneCall className={"text-muted-foreground h-4 w-4"} />
                      <a href={`tel:${grant.providerPhone}`} className={"text-primary hover:underline"}>
                        {grant.providerPhone}
                      </a>
                    </div>
                  )}

                  {!grant.websiteUrl && !grant.providerEmail && !grant.providerPhone && (
                    <p className={"text-muted-foreground col-span-3"}>No contact information provided.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Dialog Footer with Actions */}
            <DialogFooter className={"mt-8 flex gap-2"}>
              {summaryText && (
                <Button
                  variant={"outline"}
                  onClick={(e) => {
                    e.preventDefault();
                    const aiSection = document.getElementById("ai-analysis");
                    if (aiSection) {
                      aiSection.scrollIntoView({ behavior: "smooth" });
                    }
                  }}
                >
                  View AI Analysis
                </Button>
              )}

              {session.organization && (
                <Button onClick={handleAskAi} disabled={loading} variant={"outline"}>
                  <Sparkles />
                  {loading ? "Thinking…" : summaryText ? "Update AI Analysis" : "Ask AI"}
                </Button>
              )}

              <Button asChild>
                <a href={grant.applyUrl || grant.websiteUrl || "#"} target={"_blank"} rel={"noopener noreferrer"}>
                  Apply Now
                  <ExternalLink className={"ml-2 h-4 w-4"} />
                </a>
              </Button>
            </DialogFooter>

            {/* AI Analysis Section in Dialog */}
            {summaryText && (
              <div className={"mt-6"} id={"ai-analysis"}>
                <Separator className={"my-6"} />
                <Card className={"from-primary/5 border bg-gradient-to-br to-transparent"}>
                  <CardHeader className={"pb-3"}>
                    <div className={"flex items-center justify-between"}>
                      <CardTitle className={"flex items-center gap-2 text-lg"}>
                        <div className={"bg-primary/10 rounded-full p-1"}>
                          <TrendingUp className={"text-primary h-4 w-4"} />
                        </div>
                        AI Grant Analysis
                      </CardTitle>

                      {similarityScore > 0 && (
                        <Badge className={`${getSimilarityBadgeColor(similarityScore)} text-xs font-bold text-white`}>
                          {similarityScore}% match
                        </Badge>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className={"prose prose-sm dark:prose-invert max-w-none"}>
                      <Markdown>{summaryText}</Markdown>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
