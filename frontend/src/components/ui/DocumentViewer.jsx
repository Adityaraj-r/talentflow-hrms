"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { FileText, Eye, Download, FolderOpen, ZoomIn, ZoomOut, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import JSZip from "jszip";

// Helper Functions
export const getFileUrl = (url) => {
  if (!url) return "#";
  const apiOrigin = (import.meta.env.VITE_API_URL || "http://localhost:5001/api").replace(/\/api\/?$/, "");
  return url.startsWith("http") ? url : `${apiOrigin}${url}`;
};

export const forceCloudinaryDownload = (url) => {
  if (!url) return "#";
  const finalUrl = getFileUrl(url);
  const parts = finalUrl.split('/upload/');
  if (parts.length === 2) {
    return `${parts[0]}/upload/fl_attachment/${parts[1]}`;
  }
  return finalUrl;
};

export const getFileName = (url) => {
  if (!url) return "";
  const filename = url.substring(url.lastIndexOf('/') + 1);
  return filename.split('?')[0];
};

export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return "";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

const getFileTypeLabel = (file) => {
  if (file?.mimeType) {
    const subtype = file.mimeType.split("/")[1] || file.mimeType;
    return subtype.replace(/[-+.].*$/, "").toUpperCase();
  }
  const name = file?.originalName || file?.filePath || "";
  const extension = name.includes(".") ? name.split(".").pop() : "";
  return extension ? extension.toUpperCase() : "File";
};

export const isImageFile = (doc) => {
  if (!doc) return false;
  const pathStr = doc.filePath || "";
  if (doc.mimeType && doc.mimeType.startsWith('image/')) return true;
  if (/\.(jpg|jpeg|png|gif|webp)$/i.test(pathStr)) return true;
  return false;
};

export const isPdfFile = (doc) => {
  if (!doc) return false;
  const pathStr = doc.filePath || "";
  if (doc.mimeType && doc.mimeType === 'application/pdf') return true;
  if (pathStr.toLowerCase().includes('.pdf')) return true;
  return false;
};

export const getAttachments = (req) => {
  if (!req) return [];
  if (Array.isArray(req.attachments)) return req.attachments;
  if (Array.isArray(req.uploadedDocuments) && req.uploadedDocuments.length > 0) {
    return req.uploadedDocuments;
  }
  if (Array.isArray(req.documentPaths) && req.documentPaths.length > 0) {
    return req.documentPaths.map((path) => ({
      originalName: getFileName(path),
      filePath: path,
      fileSize: 0,
      mimeType: "",
      uploadedAt: req.updatedAt || req.createdAt
    }));
  }
  if (req.documentPath) {
    return [{
      originalName: getFileName(req.documentPath),
      filePath: req.documentPath,
      fileSize: 0,
      mimeType: "",
      uploadedAt: req.updatedAt || req.createdAt
    }];
  }
  if (req.filePath) {
    return [{
      filePath: req.filePath,
      originalName: req.originalName || getFileName(req.filePath),
      fileSize: req.fileSize || 0,
      uploadedAt: req.uploadedAt || req.createdAt
    }];
  }
  return [];
};

// Global direct authenticated download helper
export const downloadFile = async (file, setDownloading = () => {}) => {
  if (!file || !file.filePath) {
    toast.error("File details not found");
    return;
  }
  
  setDownloading(true);
  const toastId = toast.loading("Preparing download...");
  try {
    const fileUrl = getFileUrl(file.filePath);
    const filename = file.originalName || getFileName(file.filePath) || "download";
    
    const idToken = localStorage.getItem("idToken");
    const headers = {};
    if (idToken) {
      headers["Authorization"] = `Bearer ${idToken}`;
    }

    const response = await fetch(fileUrl, {
      method: 'GET',
      headers: headers,
      credentials: 'include'
    });
    
    if (!response.ok) throw new Error("Network response was not ok");
    
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
    
    toast.success("Download started successfully", { id: toastId });
  } catch (error) {
    console.error("Direct download failed:", error);
    toast.error("Download failed. Opening fallback link...", { id: toastId });
    try {
      window.open(forceCloudinaryDownload(file.filePath), '_blank');
    } catch (fallbackError) {
      toast.error("Failed to download or open file");
    }
  } finally {
    setDownloading(false);
  }
};

// Uploaded Documents Modal Component (Refined)
export const UploadedDocumentsModal = ({ open, onOpenChange, activeRequest, onViewFile, title = "Requested Documents" }) => {
  const attachments = getAttachments(activeRequest);
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [individualDownloads, setIndividualDownloads] = useState({});
  const displayTitle = title === "Uploaded Documents" ? "Requested Documents" : title;

  const downloadAllAsZip = async () => {
    if (attachments.length === 0) return;
    setDownloadingZip(true);
    const toastId = toast.loading("Generating ZIP file...");
    try {
      const zip = new JSZip();
      const fetchPromises = attachments.map(async (file) => {
        const fileUrl = forceCloudinaryDownload(file.filePath);
        const res = await fetch(fileUrl);
        if (!res.ok) throw new Error(`Failed to fetch ${file.originalName}`);
        const blob = await res.blob();
        zip.file(file.originalName || getFileName(file.filePath), blob);
      });

      await Promise.all(fetchPromises);
      const content = await zip.generateAsync({ type: "blob" });
      
      const link = document.createElement("a");
      link.href = URL.createObjectURL(content);
      link.download = `documents_${activeRequest.requestId || "request"}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      
      toast.success("ZIP downloaded successfully!", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate ZIP. Please download files individually.", { id: toastId });
    } finally {
      setDownloadingZip(false);
    }
  };

  const handleIndividualDownload = async (file, idx) => {
    setIndividualDownloads(prev => ({ ...prev, [idx]: true }));
    await downloadFile(file, () => {});
    setIndividualDownloads(prev => ({ ...prev, [idx]: false }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-[900px] sm:w-[92vw] lg:w-[880px] max-h-[88vh] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl p-0 overflow-hidden flex flex-col [&>button.absolute]:hidden">
        {/* Fixed Header */}
        <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-7 py-5 sm:px-8">
          <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-4">
            <div className="min-w-0">
              <h3 className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <FolderOpen className="h-5 w-5" />
                </span>
                <span className="truncate">{displayTitle}</span>
              </h3>
              {activeRequest && (
                <p className="mt-2 truncate text-sm font-medium text-slate-500 dark:text-slate-400">
                  {activeRequest.requestId}{activeRequest.employeeName ? ` • ${activeRequest.employeeName}` : ""}
                </p>
              )}
            </div>
            <span className="hidden rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300 sm:inline-flex">
              {attachments.length} {attachments.length === 1 ? "Document" : "Documents"}
            </span>
            <DialogClose className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition-all duration-150 hover:bg-white hover:text-slate-700 hover:shadow-sm dark:hover:bg-slate-800 dark:hover:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <X className="h-4 w-4" />
            </DialogClose>
          </div>
        </div>

        {/* Scrollable Document List Area */}
        {activeRequest && (
          <div className="flex-1 overflow-y-auto px-7 py-6 custom-scrollbar max-h-[56vh] sm:px-8">
            <div className="space-y-3.5">
              {attachments.map((file, idx) => (
                <div 
                  key={idx} 
                  className="grid min-h-[92px] w-full grid-cols-[auto_minmax(0,1fr)] items-center gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/45 dark:hover:border-slate-700 sm:grid-cols-[auto_minmax(0,1fr)_auto]"
                >
                  {/* File Info */}
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 self-center text-left">
                    <p 
                      className="truncate pr-2 text-sm font-semibold text-slate-900 dark:text-slate-100" 
                      title={file.originalName || getFileName(file.filePath)}
                    >
                      {file.originalName || getFileName(file.filePath)}
                    </p>
                    <p className="mt-1.5 truncate text-xs font-medium text-slate-500 dark:text-slate-400">
                      {file.uploadedAt ? new Date(file.uploadedAt).toLocaleDateString() : "N/A"} {" • "}
                      {getFileTypeLabel(file)} {" • "}
                      {file.fileSize > 0 ? formatFileSize(file.fileSize) : "Size unavailable"}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="col-span-2 flex items-center justify-end gap-3 sm:col-span-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 w-28 justify-center rounded-lg border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 shadow-sm transition-all duration-150 hover:bg-slate-50 hover:text-slate-900 hover:shadow dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/80 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      onClick={() => onViewFile(file)}
                    >
                      <Eye className="h-3.5 w-3.5" /> View
                    </Button>
                    <Button
                      size="sm"
                      className="h-9 w-28 justify-center rounded-lg bg-green-600 px-4 text-xs font-semibold text-white shadow-sm transition-all duration-150 hover:bg-green-700 hover:shadow focus:outline-none focus:ring-2 focus:ring-green-500"
                      onClick={() => handleIndividualDownload(file, idx)}
                      disabled={individualDownloads[idx]}
                    >
                      {individualDownloads[idx] ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Download className="h-3.5 w-3.5" />
                      )}
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fixed Footer */}
        {activeRequest && (
          <div className="flex items-center justify-between gap-4 border-t border-slate-200 bg-slate-50 px-7 py-5 dark:border-slate-800 dark:bg-slate-900/30 sm:px-8">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="h-10 rounded-lg border-slate-300 px-5 text-xs font-semibold text-slate-700 transition-all hover:bg-white hover:shadow-sm dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Close
            </Button>
            {attachments.length > 1 && (
              <Button
                onClick={downloadAllAsZip}
                disabled={downloadingZip}
                className="flex h-10 items-center gap-1.5 rounded-lg bg-blue-600 px-5 text-xs font-semibold text-white transition-all duration-150 hover:bg-blue-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {downloadingZip ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                Download All (.zip)
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Document Preview Dialog Component
export const DocumentPreviewDialog = ({ previewDoc, onClose }) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [downloading, setDownloading] = useState(false);

  return (
    <Dialog open={!!previewDoc} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className={cn(
        "flex flex-col p-0 overflow-hidden bg-slate-900 border-slate-800 text-white shadow-2xl rounded-2xl",
        previewDoc && isPdfFile(previewDoc) ? "max-w-[95vw] w-[95vw] h-[95vh] max-h-[95vh]" : "sm:max-w-4xl md:max-w-[70vw] h-[80vh]"
      )}>
        <DialogHeader className="p-4 border-b border-slate-800 flex-shrink-0">
          <DialogTitle className="flex justify-between items-center pr-6">
            <span className="truncate pr-4 text-base font-bold text-slate-100 text-left">
              {previewDoc?.originalName}
            </span>
            <div className="flex items-center gap-3">
              {previewDoc && !isPdfFile(previewDoc) && (
                <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-lg p-0.5">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 text-slate-400 hover:text-white" 
                    onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.25))} 
                    title="Zoom Out"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-xs font-semibold w-9 text-center text-slate-300">{Math.round(zoomLevel * 100)}%</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 text-slate-400 hover:text-white" 
                    onClick={() => setZoomLevel(prev => Math.min(3, prev + 0.25))} 
                    title="Zoom In"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className={cn(
          "flex-1 bg-slate-955 relative",
          previewDoc && isPdfFile(previewDoc) ? "w-full h-full" : "flex items-center justify-center p-4 overflow-auto custom-scrollbar"
        )}>
          {previewDoc && isImageFile(previewDoc) ? (
            <img 
              src={getFileUrl(previewDoc.filePath)} 
              alt={previewDoc.originalName}
              className="max-w-full max-h-full object-contain rounded-md transition-transform duration-200"
              style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center' }}
            />
          ) : previewDoc && isPdfFile(previewDoc) ? (
            <iframe 
              src={`${getFileUrl(previewDoc.filePath)}#view=FitH`} 
              className="w-full h-full border-0 bg-white"
              title={previewDoc.originalName}
            />
          ) : previewDoc ? (
            <div 
              className="absolute inset-0 flex items-center justify-center transition-transform duration-200"
              style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center', width: '100%', height: '100%' }}
            >
              <iframe 
                src={getFileUrl(previewDoc.filePath)} 
                className="w-full h-full border-0 bg-white shadow-sm"
                title={previewDoc.originalName}
              />
            </div>
          ) : null}
        </div>
        
        <div className="border-t border-slate-800 bg-slate-900/50 p-4 flex justify-between items-center flex-shrink-0">
          <Button 
            variant="outline" 
            className="border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg"
            onClick={onClose}
          >
            Close Preview
          </Button>
          <Button 
            onClick={() => downloadFile(previewDoc, setDownloading)} 
            disabled={downloading}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg flex items-center gap-1.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all duration-150"
          >
            {downloading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Downloading...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" /> Download File
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
