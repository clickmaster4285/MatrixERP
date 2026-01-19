// components/shared-components/sites/SitesPage.jsx - UPDATED
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, MapPin, TowerControl } from 'lucide-react';
import { useGetSites } from '@/features/siteApi';
import SiteCard from './get_all/SiteCard';
import CreateSiteDialog from './create/CreateSiteDialog';
import EditSiteDialog from './create/EditSiteDialog';
import SiteFilters from './get_all/SiteFilters';

const SitesPage = () => {
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    region: '',
  });
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedSite, setSelectedSite] = useState(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const { data: sitesResponse = {}, isLoading, error } = useGetSites(filters);

  const sites = useMemo(() => {
    if (!sitesResponse || !sitesResponse.data) return [];
    return Array.isArray(sitesResponse.data) ? sitesResponse.data : [];
  }, [sitesResponse]);

 

  // Calculate statistics - FIXED to use region instead of siteType
  const stats = useMemo(() => {
    if (!sites || sites.length === 0) {
      return {
        total: 0,
        source: 0,
        destination: 0,
        commissioned: 0,
        inProgress: 0
      };
    }

    return {
      total: sites.length,
      source: sites.filter(site => site.region === 'Source').length,
      destination: sites.filter(site => site.region === 'Destination').length,
      commissioned: sites.filter(site => site.overallStatus === 'commissioned').length,
      inProgress: sites.filter(site => site.overallStatus === 'in-progress').length,
    };
  }, [sites]);

  const handleEditSite = (site) => {
    setSelectedSite(site);
    setEditDialogOpen(true);
  };

  const handleDeleteSite = (siteId) => {
    // Site will be automatically removed from list via query invalidation
  };

  if (!isClient) {
    return <div className="min-h-screen bg-gray-50 p-6">Loading...</div>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-red-800 mb-4">
              Error Loading Sites
            </h2>
            <p className="text-red-600">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="">
      <div className="">
        {/* Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold">Sites Management</h1>
            <p className="text-gray-600 mt-2">
              Manage source and destination sites with material tracking
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add New Site
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: 'Total Sites',
              value: stats.total,
              icon: MapPin,
              color: 'blue',
            },
            {
              label: 'Source Sites',
              value: stats.source,
              icon: TowerControl,
              color: 'orange',
            },
            {
              label: 'Destination',
              value: stats.destination,
              icon: TowerControl,
              color: 'green',
            },
            {
              label: 'In Progress',
              value: stats.inProgress,
              icon: MapPin,
              color: 'cyan',
            },
          ].map((stat, index) => (
            <Card
              key={index}
              className={`border-l-4 border-l-${stat.color}-500`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium uppercase text-slate-600">
                      {stat.label}
                    </div>
                    <div className="text-2xl font-bold text-slate-900 mt-1">
                      {stat.value}
                    </div>
                  </div>
                  <stat.icon className={`h-6 w-6 text-${stat.color}-700`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <SiteFilters filters={filters} onFiltersChange={setFilters} />

        {/* Sites Grid */}
        {sites.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <TowerControl className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No sites found
              </h3>
              <p className="text-gray-600 mb-4">
                {Object.values(filters).some((f) => f)
                  ? 'No sites match your current filters.'
                  : 'Get started by creating your first site.'}
              </p>
              {!Object.values(filters).some((f) => f) && (
                <Button onClick={() => setCreateDialogOpen(true)}>
                  Create Your First Site
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
            {sites.map((site) => (
              <SiteCard
                key={site._id}
                site={site}
                onEdit={handleEditSite}
                onDelete={handleDeleteSite}
              />
            ))}
          </div>
        )}

        {/* Dialogs */}
        <CreateSiteDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
        />

        {selectedSite && (
          <EditSiteDialog
            site={selectedSite}
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
          />
        )}
      </div>
    </div>
  );
};

export default SitesPage;