import { SearchIcon, XIcon } from "lucide-react";
import { useState, useEffect } from "react";

import LoadingSpinner from "#/components/loading-spinner";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#/components/ui/select";
import useBackend from "#/lib/backend/client";
import { ResourceGrant } from "#/lib/backend/schema";

import GrantCard from "./grant-card";

export default function GrantsTab() {
  const backend = useBackend();
  const [grants, setGrants] = useState<ResourceGrant[]>([]);
  const [filteredGrants, setFilteredGrants] = useState<ResourceGrant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");

  // Get unique locations for filter
  const uniqueLocations = [...new Set(grants.map((g) => g.location).filter(Boolean))].sort();

  useEffect(() => {
    const fetchGrants = async () => {
      try {
        const data = await backend.resources.getGrants();
        setGrants(data);
        setFilteredGrants(data);
      } catch (error) {
        console.error("Failed to fetch grants:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGrants();
  }, []);

  // Filter and search logic
  useEffect(() => {
    let filtered = grants;

    // Search filter (includes location in search)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (grant) =>
          grant.name.toLowerCase().includes(query) ||
          grant.provider.toLowerCase().includes(query) ||
          grant.description?.toLowerCase().includes(query) ||
          grant.location?.toLowerCase().includes(query) ||
          grant.grant?.toLowerCase().includes(query),
      );
    }

    // Location filter
    if (locationFilter !== "all") {
      filtered = filtered.filter((grant) => grant.location === locationFilter);
    }

    setFilteredGrants(filtered);
  }, [grants, searchQuery, locationFilter]);

  const clearFilters = () => {
    setSearchQuery("");
    setLocationFilter("all");
  };

  const hasActiveFilters = searchQuery.trim() || locationFilter !== "all";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Simple Search and Filter Bar */}
      <div className="flex flex-col gap-4 sm:flex-row">
        {/* Search Input */}
        <div className="relative flex-1">
          <SearchIcon className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
          <Input
            placeholder="Search grants by name, provider, location, description, or funding…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Location Filter */}
        <div className="min-w-[200px]">
          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All locations</SelectItem>
              {uniqueLocations.map((location) => (
                <SelectItem key={location} value={location!}>
                  {location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button variant="outline" onClick={clearFilters}>
            <XIcon className="mr-1 h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {/* Results Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold">
            {filteredGrants.length} grant{filteredGrants.length !== 1 ? "s" : ""}
            {hasActiveFilters ? " found" : " available"}
          </h2>

          {/* Active Filter Badges */}
          <div className="flex gap-2">
            {searchQuery.trim() && <Badge variant="secondary">Search: "{searchQuery}"</Badge>}
            {locationFilter !== "all" && <Badge variant="secondary">{locationFilter}</Badge>}
          </div>
        </div>
      </div>

      {/* FULL WIDTH Grants List */}
      <div className="space-y-4">
        {filteredGrants.map((grant: ResourceGrant) => (
          <div key={grant.id} className="w-full">
            <GrantCard grant={grant} />
          </div>
        ))}
      </div>

      {/* No Results */}
      {filteredGrants.length === 0 && !loading && (
        <div className="py-16 text-center">
          {hasActiveFilters ? (
            <div className="space-y-3">
              <p className="text-muted-foreground text-lg">No grants match your search</p>
              <Button variant="outline" onClick={clearFilters}>
                <XIcon className="mr-2 h-4 w-4" />
                Clear filters
              </Button>
            </div>
          ) : (
            <p className="text-muted-foreground text-lg">No grants available yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
