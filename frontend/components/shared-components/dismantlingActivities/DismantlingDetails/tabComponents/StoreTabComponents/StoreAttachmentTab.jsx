// components/dismantling/tabs/StoreAttachmentTab.jsx
'use client';

import { useRef, useMemo, useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Paperclip, X } from 'lucide-react';
import { toast } from 'sonner';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useDismantlingManagement } from '@/hooks/useDismantlingManagement';

export function StoreAttachmentTab({ activity, setActivity }) {
  const { updateDismantling, isUpdating } = useDismantlingManagement();
  const fileInputRef = useRef(null);
  const [hasFiles, setHasFiles] = useState(false);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  const [selectedFiles, setSelectedFiles] = useState([]); // [{id,file,previewUrl}]

  const existingDispatchAttachments = useMemo(
    () => activity?.dispatch?.addAttachments || [],
    [activity?.dispatch?.addAttachments]
  );

  const resolveUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;

    const base = process.env.NEXT_PUBLIC_API_URL || '';
    return `${base}${path}`;
  };

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      selectedFiles.forEach((item) => {
        URL.revokeObjectURL(item.previewUrl);
      });
    };
  }, [selectedFiles]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);

    if (!files.length) {
      selectedFiles.forEach((item) => URL.revokeObjectURL(item.previewUrl));
      setSelectedFiles([]);
      setHasFiles(false);
      return;
    }

    selectedFiles.forEach((item) => URL.revokeObjectURL(item.previewUrl));

    const mapped = files.map((file, index) => ({
      id: `${file.name}-${file.lastModified}-${index}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setSelectedFiles(mapped);
    setHasFiles(files.length > 0 && files[0].size > 0);
  };

  const handleRemoveSelected = (id) => {
    setSelectedFiles((prev) => {
      const remaining = prev.filter((item) => item.id !== id);
      const removed = prev.find((item) => item.id === id);

      if (removed) {
        URL.revokeObjectURL(removed.previewUrl);
      }

      if (fileInputRef.current) {
        const dt = new DataTransfer();
        remaining.forEach((item) => dt.items.add(item.file));
        fileInputRef.current.files = dt.files;
      }

      if (!remaining.length) {
        setHasFiles(false);
      }

      return remaining;
    });
  };

  const handleAttachmentsUpload = async (e) => {
    e.preventDefault();

    if (!activity?._id) return;

    if (!fileInputRef.current || !fileInputRef.current.files) {
      toast.error('Please select at least one image');
      return;
    }

    const files = fileInputRef.current.files;

    if (!files.length || (files.length === 1 && files[0].size === 0)) {
      toast.error('Please select at least one image');
      return;
    }

    const formData = new FormData();
    // IMPORTANT: dispatch target
    formData.append('attachmentTarget', 'dispatch');

    Array.from(files).forEach((file) => {
      formData.append('attachments', file);
    });

    try {
      const updated = await updateDismantling(activity._id, formData);
      const updatedActivity = updated?.data || updated;
      const updatedDispatch =
        updatedActivity?.dispatch || activity.dispatch || {};

      setActivity((prev) => ({
        ...prev,
        dispatch: updatedDispatch,
      }));

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      selectedFiles.forEach((item) => URL.revokeObjectURL(item.previewUrl));
      setSelectedFiles([]);
      setHasFiles(false);

      toast.success('Dispatch attachments uploaded');
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to upload dispatch attachments';
      toast.error(msg);
    }
  };

  return (
    <>
      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Paperclip className="w-4 h-4" />
              Store Attachments
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Upload store-related photos and view existing attachments.
            </p>
          </div>
          {existingDispatchAttachments.length > 0 && (
            <Badge variant="outline" className="text-xs">
              {existingDispatchAttachments.length} file
              {existingDispatchAttachments.length > 1 ? 's' : ''}
            </Badge>
          )}
        </CardHeader>

        <CardContent className="space-y-4 text-sm">
          {/* Upload form */}
          <form className="space-y-3" onSubmit={handleAttachmentsUpload}>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                Upload Images
              </Label>

              <input
                ref={fileInputRef}
                name="attachments"
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />

              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  variant="default"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer"
                >
                  Select Files
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  type="submit"
                  disabled={isUpdating || !hasFiles}
                >
                  {isUpdating ? 'Uploading...' : 'Upload'}
                </Button>
              </div>

              <p className="text-[11px] text-muted-foreground">
                Images will be stored as store-level attachments.
              </p>
            </div>
          </form>

          {/* Selected (NOT YET UPLOADED) previews */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
                Selected files (not uploaded yet)
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {selectedFiles.map((item) => (
                  <div
                    key={item.id}
                    className="relative border border-border rounded-md overflow-hidden bg-muted group"
                  >
                    <img
                      src={item.previewUrl}
                      alt={item.file.name}
                      className="w-full h-24 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveSelected(item.id)}
                      className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground">
                These images will be uploaded once you click &quot;Upload&quot;.
              </p>
            </div>
          )}

          {/* Existing attachments from server */}
          {existingDispatchAttachments.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
                Existing Attachments
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {existingDispatchAttachments.map((url, idx) => {
                  const fullUrl = resolveUrl(url);
                  return (
                    <button
                      type="button"
                      key={`${url}-${idx}`}
                      className="border border-border rounded-md overflow-hidden bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
                      onClick={() => {
                        setPreviewUrl(fullUrl);
                        setPreviewOpen(true);
                      }}
                    >
                      <img
                        src={fullUrl}
                        alt={`Dispatch attachment ${idx + 1}`}
                        className="w-full h-24 object-cover"
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl">
          {previewUrl && (
            <img
              src={previewUrl}
              alt="Dispatch attachment preview"
              className="w-full h-auto object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
