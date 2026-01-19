'use client';

import { useRef, useMemo, useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Paperclip, X, Image as ImageIcon, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';

export function TaskAttachmentsCard({
  title = 'Attachments',
  description = 'Upload photos and view existing attachments.',
  attachments = [],
  activityId,
  activityType, // "dismantling" | "relocation"
  uploadFn, // (activityId, formData) => Promise
  attachmentTarget = 'dismantling',
  // dismantling: "survey" | "dismantling" | "dispatch"
  // relocation: "surveyWork" | OR "sourceSite.surveyWork" (both supported)
  phase, // ✅ ONLY for relocation (sourceSite | destinationSite). Optional but recommended.
  onUploaded,
}) {
  const fileInputRef = useRef(null);

  const [hasFiles, setHasFiles] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [activePreviewUrl, setActivePreviewUrl] = useState(null);

  const existing = useMemo(() => {
    return Array.isArray(attachments) ? attachments : [];
  }, [attachments]);

  const resolveUrl = (path) => {
    if (!path || typeof path !== 'string') return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;

    const base = process.env.NEXT_PUBLIC_API_URL || '';
    return `${base}${path}`;
  };

  const getAttachmentUrl = (a) => {
    if (!a) return '';
    if (typeof a === 'string') return resolveUrl(a);
    return resolveUrl(a.url || a.path || a.fileUrl || a.link || '');
  };

  useEffect(() => {
    return () => {
      selectedFiles.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);

    selectedFiles.forEach((item) => URL.revokeObjectURL(item.previewUrl));

    if (!files.length) {
      setSelectedFiles([]);
      setHasFiles(false);
      return;
    }

    const mapped = files.map((file, index) => ({
      id: `${file.name}-${file.lastModified}-${index}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setSelectedFiles(mapped);
    setHasFiles(files.length > 0 && files[0]?.size > 0);
  };

  const handleRemoveSelected = (id) => {
    setSelectedFiles((prev) => {
      const remaining = prev.filter((item) => item.id !== id);
      const removed = prev.find((item) => item.id === id);

      if (removed) URL.revokeObjectURL(removed.previewUrl);

      if (fileInputRef.current) {
        const dt = new DataTransfer();
        remaining.forEach((item) => dt.items.add(item.file));
        fileInputRef.current.files = dt.files;
      }

      if (!remaining.length) setHasFiles(false);
      return remaining;
    });
  };

  // ✅ matches YOUR controller requirements
  const buildUploadFormData = (files) => {
    const fd = new FormData();

    // keep it safe for backend spreads/assign
    fd.append('updates', JSON.stringify({}));

    if (activityType === 'relocation') {
      // support BOTH:
      // 1) attachmentTarget="surveyWork" + phase="sourceSite"
      // 2) attachmentTarget="sourceSite.surveyWork" (old format)

      let finalPhase = phase;
      let finalSubPhase = attachmentTarget;

      if (String(attachmentTarget).includes('.')) {
        const parts = String(attachmentTarget).split('.');
        finalPhase = parts[0];
        finalSubPhase = parts[1];
      }

      if (
        !finalPhase ||
        !['sourceSite', 'destinationSite'].includes(finalPhase)
      ) {
        throw new Error(
          'For relocation, pass phase="sourceSite" or "destinationSite".'
        );
      }

      if (
        !finalSubPhase ||
        ![
          'surveyWork',
          'civilWork',
          'telecomWork',
          'dismantlingWork',
          'storeOperatorWork',
        ].includes(finalSubPhase)
      ) {
        throw new Error(
          'Invalid subPhase for relocation (surveyWork/civilWork/telecomWork/dismantlingWork/storeOperatorWork).'
        );
      }

      fd.append('phase', finalPhase);
      fd.append('subPhase', finalSubPhase);
    } else {
      // dismantling
      if (
        !attachmentTarget ||
        !['survey', 'dismantling', 'dispatch'].includes(
          String(attachmentTarget)
        )
      ) {
        throw new Error(
          'Invalid phase for dismantling (survey/dismantling/dispatch).'
        );
      }
      fd.append('phase', attachmentTarget);
    }

    Array.from(files).forEach((file) => {
      fd.append('attachments', file); // multer key must match
    });

    return fd;
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!activityId) return toast.error('Missing activity ID');
    if (!uploadFn) return toast.error('Upload function not provided');

    const files = fileInputRef.current?.files;

    if (
      !files ||
      !files.length ||
      (files.length === 1 && files[0]?.size === 0)
    ) {
      return toast.error('Please select at least one image');
    }

    try {
      setIsUploading(true);

      const formData = buildUploadFormData(files);
      const updated = await uploadFn(activityId, formData);

      if (fileInputRef.current) fileInputRef.current.value = '';

      selectedFiles.forEach((item) => URL.revokeObjectURL(item.previewUrl));
      setSelectedFiles([]);
      setHasFiles(false);

      onUploaded?.(updated);
      toast.success('Attachments uploaded');
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to upload attachments';
      toast.error(msg);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="border shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <Paperclip className="w-4 h-4" />
            {title}
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </div>

        {existing.length > 0 && (
          <Badge variant="outline" className="text-xs">
            {existing.length} file{existing.length > 1 ? 's' : ''}
          </Badge>
        )}
      </CardHeader>

      <CardContent className="space-y-5 text-sm">
        <form className="space-y-3" onSubmit={handleUpload}>
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
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="gap-2"
              >
                <ImageIcon className="h-4 w-4" />
                Select Files
              </Button>

              <Button
                size="sm"
                variant="outline"
                type="submit"
                disabled={isUploading || !hasFiles}
                className="gap-2"
              >
                <UploadCloud className="h-4 w-4" />
                {isUploading ? 'Uploading...' : 'Upload'}
              </Button>
            </div>

            <p className="text-[11px] text-muted-foreground">
              {activityType === 'relocation' ? (
                <>
                  Phase:{' '}
                  <span className="font-medium">{phase || 'NOT SET'}</span>
                  {' | '}SubPhase:{' '}
                  <span className="font-medium">{attachmentTarget}</span>
                </>
              ) : (
                <>
                  Phase: <span className="font-medium">{attachmentTarget}</span>
                </>
              )}
            </p>
          </div>
        </form>

        {/* previews */}
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
                    className="w-full h-24 object-cover cursor-pointer"
                    onClick={() => setActivePreviewUrl(item.previewUrl)}
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
          </div>
        )}

        {/* existing */}
        {existing.length > 0 && (
          <div className="space-y-2">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
              Existing Attachments
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {existing.map((a, idx) => {
                const fullUrl = getAttachmentUrl(a);
                return (
                  <button
                    type="button"
                    key={`${fullUrl}-${idx}`}
                    className="border border-border rounded-md overflow-hidden bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
                    onClick={() => setActivePreviewUrl(fullUrl)}
                  >
                    <img
                      src={fullUrl}
                      alt={`Attachment ${idx + 1}`}
                      className="w-full h-24 object-cover"
                    />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* preview */}
        {activePreviewUrl && (
          <div className="border rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 bg-muted">
              <p className="text-xs text-muted-foreground">Preview</p>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    window.open(
                      activePreviewUrl,
                      '_blank',
                      'noopener,noreferrer'
                    )
                  }
                >
                  Open
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setActivePreviewUrl(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <img
              src={activePreviewUrl}
              alt="Attachment preview"
              className="w-full h-auto object-contain bg-black/5"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
