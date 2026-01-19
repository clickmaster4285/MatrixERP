// components/shared-components/dismantlingActivities/dismantlingActivityPageComponents/DismantlingCreateDialog.jsx
'use client';

import { MapPin, Users, Loader2 } from 'lucide-react'; // Add Loader2
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const DismantlingCreateDialog = ({
  isOpen,
  onOpenChange,
  formData,
  setFormData,
  sites,
  users,
  onSubmit,
  isSubmitting = false, // Add this prop
}) => {
  // define what "empty" looks like
  const resetForm = () => {
    setFormData({
      siteId: '',
      dismantlingType: 'B2S', // Set default value
      state: '',
      city: '',
      address: '',
      assignedTo: [],
      surveyAssignedTo: '',
      dismantlingAssignedTo: '',
      storeAssignedTo: '',
    });
  };

  const handleDialogOpenChange = (open) => {
    if (!open) {
      // dialog is closing → clear all fields
      resetForm();
    }
    onOpenChange(open);
  };

  // Disable the form when submitting
  const isDisabled = isSubmitting;

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Create Dismantling Activity
          </DialogTitle>
          <DialogDescription>
            {sites.length === 1
              ? `Create dismantling activity for ${sites[0]?.name || 'this site'}`
              : 'Create Dismantling Activity'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Site - Disabled if only one site is passed */}
            <div className="space-y-2">
              <Label>Site *</Label>
              <Select
                value={formData.siteId}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, siteId: value }))
                }
                // disabled={sites.length === 1 || isDisabled}
              >
                <SelectTrigger className="border-border">
                  <SelectValue placeholder="Select site" />
                </SelectTrigger>
                <SelectContent>
                  {sites.map((site) => (
                    <SelectItem key={site._id} value={site._id}>
                      {site.name} {site.siteId ? `(${site.siteId})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {sites.length === 1 && (
                <p className="text-xs text-muted-foreground">
                  Pre-filled for {sites[0]?.name}
                </p>
              )}
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label>Dismantling Type *</Label>
              <Select
                value={formData.dismantlingType}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    dismantlingType: value,
                  }))
                }
                disabled={isDisabled}
              >
                <SelectTrigger className="border-border">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="B2S">B2S</SelectItem>
                  <SelectItem value="StandAlone">StandAlone</SelectItem>
                  <SelectItem value="OMO">OMO</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              Location
            </Label>
            <div className="grid grid-cols-3 gap-3">
              <Input
                placeholder="State *"
                value={formData.state}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, state: e.target.value }))
                }
                className="border-border"
                disabled={isDisabled}
              />
              <Input
                placeholder="City *"
                value={formData.city}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, city: e.target.value }))
                }
                className="border-border"
                disabled={isDisabled}
              />
              <Input
                placeholder="Address"
                value={formData.address}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, address: e.target.value }))
                }
                className="border-border"
                disabled={isDisabled}
              />
            </div>
          </div>

          {/* Assignment */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              Assign Activity
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Assigned To *
                </Label>
                <Select
                  value={formData.assignedTo[0] || ''}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      assignedTo: [value],
                    }))
                  }
                  disabled={isDisabled}
                >
                  <SelectTrigger className="border-border">
                    <SelectValue placeholder="Select team member" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem
                        key={user._id}
                        value={user._id}
                        className="py-2"
                      >
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-medium">
                            {user.name}
                          </span>
                          <span className="text-muted-foreground">-</span>
                          <span className="text-xs text-muted-foreground">
                            {user.role}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Assign Tasks */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Survey */}
            <div className="space-y-1.5 w-full">
              <Label className="text-xs text-muted-foreground">Survey</Label>
              <Select
                value={formData.surveyAssignedTo || ''}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, surveyAssignedTo: value }))
                }
                disabled={isDisabled}
              >
                <SelectTrigger className="border-border w-full">
                  <SelectValue placeholder="Select member" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem
                      key={user._id}
                      value={user._id}
                      className="py-2"
                    >
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium">{user.name}</span>
                        <span className="text-muted-foreground">-</span>
                        <span className="text-xs text-muted-foreground">
                          {user.role}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dismantling */}
            <div className="space-y-1.5 w-full">
              <Label className="text-xs text-muted-foreground">
                Dismantling
              </Label>
              <Select
                value={formData.dismantlingAssignedTo || ''}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    dismantlingAssignedTo: value,
                  }))
                }
                disabled={isDisabled}
              >
                <SelectTrigger className="border-border w-full">
                  <SelectValue placeholder="Select member" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem
                      key={user._id}
                      value={user._id}
                      className="py-2"
                    >
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium">{user.name}</span>
                        <span className="text-muted-foreground">-</span>
                        <span className="text-xs text-muted-foreground">
                          {user.role}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Store */}
            <div className="space-y-1.5 w-full">
              <Label className="text-xs text-muted-foreground">Store</Label>
              <Select
                value={formData.storeAssignedTo || ''}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, storeAssignedTo: value }))
                }
                disabled={isDisabled}
              >
                <SelectTrigger className="border-border w-full">
                  <SelectValue placeholder="Select member" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem
                      key={user._id}
                      value={user._id}
                      className="py-2"
                    >
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium">{user.name}</span>
                        <span className="text-muted-foreground">-</span>
                        <span className="text-xs text-muted-foreground">
                          {user.role}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={onSubmit}
            className="w-full bg-primary hover:bg-primary/90"
            disabled={isDisabled}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating Activity...
              </>
            ) : (
              'Create Activity'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DismantlingCreateDialog;