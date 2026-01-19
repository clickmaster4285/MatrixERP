'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Building } from 'lucide-react';
import { RELOCATION_TYPES, STATUS_OPTIONS } from '../utils/options';

export const BasicInfoSection = ({
  formData,
  errors,
  sites = [],
  onChange,
  getSelectValue,
}) => {
  return (
    <Card className="border-border/60 shadow-sm rounded-2xl">
      <CardHeader className="pb-3 border-b border-border/60  rounded-t-2xl">
        <div className="flex items-center gap-3">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Building className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold">
              Basic Information
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Select the site, relocation type, and current overall status.
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Site */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="siteId"
                className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
              >
                Site <span className="text-red-500">*</span>
              </Label>

            </div>
            <Select
              value={getSelectValue(formData.siteId)}
              onValueChange={(value) => onChange('siteId', value)}
            >
              <SelectTrigger
                className={`h-12 text-sm rounded-lg ${errors.siteId
                    ? 'border-red-500 focus-visible:ring-red-500'
                    : ''
                  }`}
              >
                <SelectValue placeholder="Select a site" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Select a site</SelectItem>
                {sites.map((site) => (
                  <SelectItem key={site._id} value={site._id}>
                    {site.name || `Site ${site._id?.slice(-6) || 'Unknown'}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.siteId && (
              <p className="text-xs text-red-500 mt-1">{errors.siteId}</p>
            )}
          </div>

          {/* Relocation Type */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="relocationType"
                className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
              >
                Relocation Type <span className="text-red-500">*</span>
              </Label>

            </div>
            <Select
              value={getSelectValue(formData.relocationType)}
              onValueChange={(value) => onChange('relocationType', value)}
            >
              <SelectTrigger
                className={`h-12 text-sm rounded-lg ${errors.relocationType
                    ? 'border-red-500 focus-visible:ring-red-500'
                    : ''
                  }`}
              >
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {RELOCATION_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.relocationType && (
              <p className="text-xs text-red-500 mt-1">
                {errors.relocationType}
              </p>
            )}
          </div>
        </div>

        {/* Overall Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="overallStatus"
              className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
            >
              Overall Status
            </Label>

          </div>
          <Select
            value={getSelectValue(formData.overallStatus)}
            onValueChange={(value) => onChange('overallStatus', value)}
          >
            <SelectTrigger className="h-12 text-sm rounded-lg">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator className="mt-4" />
      </CardContent>
    </Card>
  );
};
