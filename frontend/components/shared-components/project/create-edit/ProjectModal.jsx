// components/shared-components/project/ProjectModal.jsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Target, MapPin, User, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

// SAFE date formatting function
const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  } catch (error) {
    return '';
  }
};

const ProjectModal = ({ modalState, onClose, managers, onCreateProject, onUpdateProject }) => {
  const { open, mode, project } = modalState;
  const isCreate = mode === 'create';
  const isEdit = mode === 'edit';
  const isProgress = mode === 'progress';

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    manager: '',
    timeline: {
      startDate: '',
      endDate: ''
    },
    status: 'planning'
  });

  const [milestoneUpdates, setMilestoneUpdates] = useState({});
  const [errors, setErrors] = useState({});

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      setErrors({});

      if (isEdit && project) {
        setFormData({
          name: project.name || '',
          description: project.description || '',
          manager: project.manager?._id || project.manager || '',
          timeline: {
            startDate: formatDateForInput(project.timeline?.startDate),
            endDate: formatDateForInput(project.timeline?.endDate)
          },
          status: project.status || 'planning'
        });
      } else if (isCreate) {
        setFormData({
          name: '',
          description: '',
          manager: '',
          timeline: { startDate: '', endDate: '' },
          status: 'planning'
        });
      }
    }
  }, [open, mode, project, isEdit, isCreate]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Project name is required';
    }

    if (!formData.manager) {
      newErrors.manager = 'Manager is required';
    }

    if (!formData.timeline.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.timeline.endDate) {
      newErrors.endDate = 'End date is required';
    } else if (formData.timeline.startDate && formData.timeline.endDate) {
      try {
        const start = new Date(formData.timeline.startDate);
        const end = new Date(formData.timeline.endDate);
        if (end <= start) {
          newErrors.endDate = 'End date must be after start date';
        }
      } catch (error) {
        newErrors.endDate = 'Invalid date format';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if ((isCreate || isEdit) && !validateForm()) {
      return;
    }

    try {
      if (isCreate) {
        await onCreateProject({
          ...formData,
          timeline: {
            startDate: new Date(formData.timeline.startDate).toISOString(),
            endDate: new Date(formData.timeline.endDate).toISOString()
          }
        });
      } else if (isEdit) {
        await onUpdateProject(project._id, {
          ...formData,
          timeline: {
            startDate: new Date(formData.timeline.startDate).toISOString(),
            endDate: new Date(formData.timeline.endDate).toISOString()
          }
        });
      } else if (isProgress) {
        const updates = {
          milestones: project.milestones?.map(milestone => ({
            ...milestone,
            ...milestoneUpdates[milestone._id]
          })) || []
        };
        await onUpdateProject(project._id, updates);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'create': return 'Create New Project';
      case 'edit': return 'Edit Project';
      case 'progress': return 'Update Project Progress';
      default: return 'Project';
    }
  };

  const getDescription = () => {
    switch (mode) {
      case 'create': return 'Add a new tower construction project to the management system.';
      case 'edit': return 'Update project details, timeline, and team assignments.';
      case 'progress': return `Update milestones for ${project?.name}.`;
      default: return '';
    }
  };

  const calculateProgress = (milestones = []) => {
    if (!milestones.length) return 0;
    const completed = milestones.filter(m => m.status === 'completed').length;
    return Math.round((completed / milestones.length) * 100);
  };

  const progress = calculateProgress(project?.milestones);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-900">
            {getTitle()}
          </DialogTitle>
          <DialogDescription className="text-slate-600 text-base">
            {getDescription()}
          </DialogDescription>
        </DialogHeader>

        {(isCreate || isEdit) && (
          <form onSubmit={handleSubmit} className="space-y-6 py-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Basic Info */}
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Project Name *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Tower Construction Project"
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.name}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="description" className="text-sm font-medium">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Add project description..."
                    rows={4}
                    className="resize-none"
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium">Assign Manager *</Label>
                  <Select
                    value={formData.manager}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, manager: value }))}
                  >
                    <SelectTrigger className={errors.manager ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select a manager" />
                    </SelectTrigger>
                    <SelectContent>
                      {managers.map((manager) => (
                        <SelectItem key={manager._id} value={manager._id}>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>{manager.name}</span>
                            <Badge variant="outline" className="ml-2">
                              {manager.role}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.manager && (
                    <p className="text-red-500 text-sm flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.manager}
                    </p>
                  )}
                </div>
              </div>

              {/* Right Column - Timeline */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <Label className="text-sm font-medium">Project Timeline *</Label>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate" className="text-xs">
                        Start Date *
                      </Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={formData.timeline.startDate}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          timeline: { ...prev.timeline, startDate: e.target.value }
                        }))}
                        className={errors.startDate ? 'border-red-500' : ''}
                      />
                      {errors.startDate && (
                        <p className="text-red-500 text-sm flex items-center gap-1">
                          <AlertCircle className="h-4 w-4" />
                          {errors.startDate}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endDate" className="text-xs">
                        End Date *
                      </Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={formData.timeline.endDate}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          timeline: { ...prev.timeline, endDate: e.target.value }
                        }))}
                        className={errors.endDate ? 'border-red-500' : ''}
                      />
                      {errors.endDate && (
                        <p className="text-red-500 text-sm flex items-center gap-1">
                          <AlertCircle className="h-4 w-4" />
                          {errors.endDate}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Progress Preview */}
                {isEdit && project?.milestones && (
                  <div className="space-y-3 p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Project Progress
                      </Label>
                      <Badge variant="outline">
                        {progress}%
                      </Badge>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <p className="text-xs text-slate-500">
                      {project.milestones.filter(m => m.status === 'completed').length} of {project.milestones.length} milestones completed
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">
                {isCreate ? 'Create Project' : 'Save Changes'}
              </Button>
            </div>
          </form>
        )}

        {isProgress && project && (
          <div className="space-y-6 py-4">
            {/* Project Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-slate-500">Project</Label>
                <p className="font-semibold text-slate-900">{project.name}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-slate-500">Current Progress</Label>
                <div className="flex items-center gap-2">
                  <Progress value={progress} className="h-2 flex-1" />
                  <span className="text-sm font-semibold">{progress}%</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-slate-500">Timeline</Label>
                <p className="text-sm text-slate-600 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {project.timeline?.startDate ? new Date(project.timeline.startDate).toLocaleDateString() : 'N/A'} - {' '}
                  {project.timeline?.endDate ? new Date(project.timeline.endDate).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                Update Progress
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProjectModal;