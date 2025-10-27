'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, File, Image, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onFileRemove?: () => void;
  accept?: Record<string, string[]>;
  maxSize?: number;
  currentFile?: string | null;
  type?: 'photo' | 'document';
  className?: string;
  disabled?: boolean;
}

export function FileUpload({
  onFileSelect,
  onFileRemove,
  accept = {
    'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
    'application/pdf': ['.pdf']
  },
  maxSize = 5 * 1024 * 1024, // 5MB
  currentFile,
  type = 'document',
  className,
  disabled = false
}: FileUploadProps) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0 && !disabled) {
      const file = acceptedFiles[0];
      onFileSelect(file);
    }
  }, [onFileSelect, disabled]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple: false,
    disabled: disabled || isUploading
  });

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'webp'].includes(extension || '')) {
      return <Image className="h-8 w-8 text-blue-500" />;
    } else if (extension === 'pdf') {
      return <FileText className="h-8 w-8 text-red-500" />;
    }
    return <File className="h-8 w-8 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={cn('w-full', className)}>
      {!currentFile ? (
        <div
          {...getRootProps()}
          className={cn(
            'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
            isDragActive
              ? 'border-primary bg-primary/5'
              : 'border-gray-300 hover:border-gray-400',
            disabled && 'opacity-50 cursor-not-allowed',
            type === 'photo' && 'aspect-square max-w-xs mx-auto'
          )}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center space-y-2">
            <Upload className={cn(
              'h-10 w-10 text-gray-400',
              isDragActive && 'text-primary'
            )} />
            <div className="text-sm text-gray-600">
              {isDragActive ? (
                <p>Lepaskan file di sini...</p>
              ) : (
                <div>
                  <p className="font-medium">
                    Klik untuk memilih file atau drag & drop
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {type === 'photo' 
                      ? 'PNG, JPG, WebP hingga 5MB'
                      : 'PDF, PNG, JPG hingga 5MB'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getFileIcon(currentFile)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {currentFile.split('/').pop()}
                </p>
                <p className="text-xs text-gray-500">
                  File berhasil diunggah
                </p>
              </div>
            </div>
            {onFileRemove && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onFileRemove}
                disabled={disabled}
                className="text-red-500 hover:text-red-700"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}

      {isUploading && (
        <div className="mt-2">
          <Progress value={uploadProgress} className="h-2" />
          <p className="text-xs text-gray-500 mt-1">
            Mengunggah... {uploadProgress}%
          </p>
        </div>
      )}

      {fileRejections.length > 0 && (
        <div className="mt-2">
          {fileRejections.map(({ file, errors }) => (
            <div key={file.name} className="text-sm text-red-600">
              <p className="font-medium">{file.name}</p>
              <ul className="list-disc list-inside">
                {errors.map((error) => (
                  <li key={error.code} className="text-xs">
                    {error.code === 'file-too-large' && 'File terlalu besar (maksimal 5MB)'}
                    {error.code === 'file-invalid-type' && 'Tipe file tidak didukung'}
                    {error.code !== 'file-too-large' && error.code !== 'file-invalid-type' && error.message}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}