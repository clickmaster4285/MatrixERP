// components/dismantling/tabs/DocumentsTab.jsx
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Upload, FileText } from 'lucide-react';
import { toast } from 'sonner';

import { useDismantlingManagement } from '@/hooks/useDismantlingManagement';

export function DocumentsTab({ activity, setActivity }) {
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [documentFormData, setDocumentFormData] = useState({
    documentType: '',
    documentName: '',
    fileUrl: '',
  });

  const { updateDismantling, isUpdating } = useDismantlingManagement();

  const handleDocumentSubmit = async () => {
    if (!activity?._id) {
      toast.error('No activity selected');
      return;
    }

    if (!documentFormData.documentType || !documentFormData.documentName) {
      toast.error('Document type and name are required');
      return;
    }

    const today = new Date().toISOString().slice(0, 10);

    // Build new document object
    const newDoc = {
      documentType: documentFormData.documentType,
      documentName: documentFormData.documentName.trim(),
      fileUrl: documentFormData.fileUrl.trim() || '',
      uploadDate: today,
      // backend can store this as object or just name; adjust later if needed
      uploadedBy:
        activity.createdBy && typeof activity.createdBy === 'object'
          ? activity.createdBy
          : activity.createdBy
          ? { name: activity.createdBy?.name || 'Unknown' }
          : { name: 'Unknown' },
    };

    const updatedDocuments = [...(activity.documents || []), newDoc];

    const payload = {
      documents: updatedDocuments,
      // optional: keep some trace in notes
      notes: activity.notes || 'Documents updated from Documents tab UI.',
    };

    try {
      await updateDismantling(activity._id, payload);

      // Update local state only after success
      setActivity((prev) => ({
        ...prev,
        documents: updatedDocuments,
        notes: payload.notes,
      }));

      setDocumentFormData({
        documentType: '',
        documentName: '',
        fileUrl: '',
      });
      setIsDocumentModalOpen(false);
      toast.success('Document added successfully');
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to add document';
      toast.error(msg);
    }
  };

  const documentsCount = activity?.documents?.length || 0;

  return (
    <div className="bg-card rounded-xl border border-border/50 p-6 shadow-card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Documents</h3>
          <p className="text-sm text-muted-foreground">
            {documentsCount} document{documentsCount !== 1 ? 's' : ''} uploaded
          </p>
        </div>
        <Dialog
          open={isDocumentModalOpen}
          onOpenChange={(open) => {
            if (!isUpdating) setIsDocumentModalOpen(open);
          }}
        >
          <DialogTrigger asChild>
            <Button className="gap-2 bg-primary" disabled={isUpdating}>
              <Upload className="w-4 h-4" />
              {isUpdating ? 'Saving...' : 'Upload Document'}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] bg-card border-border">
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Document Type *</Label>
                <select
                  value={documentFormData.documentType}
                  onChange={(e) =>
                    setDocumentFormData((prev) => ({
                      ...prev,
                      documentType: e.target.value,
                    }))
                  }
                  className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm"
                >
                  <option value="">Select type</option>
                  <option value="survey-report">Survey Report</option>
                  <option value="dismantling-report">Dismantling Report</option>
                  <option value="dispatch-note">Dispatch Note</option>
                  <option value="receipt">Receipt</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Document Name *</Label>
                <Input
                  value={documentFormData.documentName}
                  onChange={(e) =>
                    setDocumentFormData((prev) => ({
                      ...prev,
                      documentName: e.target.value,
                    }))
                  }
                  placeholder="Enter document name"
                  className="bg-input border-border"
                />
              </div>
              <div className="space-y-2">
                <Label>File URL</Label>
                <Input
                  value={documentFormData.fileUrl}
                  onChange={(e) =>
                    setDocumentFormData((prev) => ({
                      ...prev,
                      fileUrl: e.target.value,
                    }))
                  }
                  placeholder="Enter file URL or upload path"
                  className="bg-input border-border"
                />
              </div>
              <Button
                onClick={handleDocumentSubmit}
                className="w-full"
                disabled={isUpdating}
              >
                {isUpdating ? 'Saving...' : 'Add Document'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {documentsCount > 0 ? (
        <Table>
          <TableHeader>
            <TableRow className="border-border/50">
              <TableHead>Type</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Uploaded By</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activity.documents.map((doc, index) => (
              <TableRow key={index} className="border-border/50">
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {doc.documentType?.replace('-', ' ') || 'unknown'}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">
                  {doc.documentName || '—'}
                </TableCell>
                <TableCell>{doc.uploadedBy?.name || '—'}</TableCell>
                <TableCell>{doc.uploadDate || '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No documents uploaded yet</p>
          <p className="text-sm text-muted-foreground">
            Click &quot;Upload Document&quot; to add files
          </p>
        </div>
      )}
    </div>
  );
}
