'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const SiteConfiguration = ({
  siteData = {},
  siteType,
  onChange,
}) => {
  return (
    <div className="border p-4 shadow-sm rounded-lg">
      {/* Address Section */}
      <div className="space-y-4">
        <h5 className="font-medium">Site Address</h5>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Street */}
          <div className="space-y-2">
            <Label>
              Street <span className="text-red-500">*</span>
            </Label>
            <Input
              required
              className="border border-border rounded-md"
              value={siteData.address?.street || ''}
              onChange={(e) =>
                onChange(
                  `${siteType}Site.address.street`,
                  e.target.value
                )
              }
              placeholder="Street address"
            />
          </div>

          {/* City */}
          <div className="space-y-2">
            <Label>
              City <span className="text-red-500">*</span>
            </Label>
            <Input
              required
              className="border border-border rounded-md"
              value={siteData.address?.city || ''}
              onChange={(e) =>
                onChange(`${siteType}Site.address.city`, e.target.value)
              }
              placeholder="City"
            />
          </div>

          {/* State */}
          <div className="space-y-2">
            <Label>
              State <span className="text-red-500">*</span>
            </Label>
            <Input
              required
              className="border border-border rounded-md"
              value={siteData.address?.state || ''}
              onChange={(e) =>
                onChange(
                  `${siteType}Site.address.state`,
                  e.target.value
                )
              }
              placeholder="State"
            />
          </div>
        </div>
      </div>
    </div>
  );
};