"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Upload, X, FileText, Image, AlertCircle } from "lucide-react"
import { toast } from "sonner"

interface FileUploadProps {
  onUpload: (files: UploadedFile[]) => void
  accept?: string
  multiple?: boolean
  maxSize?: number // in MB
  uploadType?: "photo" | "document" | "general"
  className?: string
}

interface UploadedFile {
  url: string
  filename: string
  originalName: string
  size: number
  type: string
}

export function FileUpload({
  onUpload,
  accept = "*/*",
  multiple = false,
  maxSize = 10,
  uploadType = "general",
  className = ""
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    setUploadProgress(0)

    const newUploadedFiles: UploadedFile[] = []

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        // Validate file size
        if (file.size > maxSize * 1024 * 1024) {
          toast.error(`File ${file.name} terlalu besar. Maksimal ${maxSize}MB`)
          continue
        }

        const formData = new FormData()
        formData.append("file", file)
        formData.append("type", uploadType)

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData
        })

        if (!response.ok) {
          const error = await response.json()
          toast.error(`Gagal upload ${file.name}: ${error.error}`)
          continue
        }

        const uploadedFile = await response.json()
        newUploadedFiles.push(uploadedFile)

        // Update progress
        setUploadProgress(((i + 1) / files.length) * 100)
      }

      if (newUploadedFiles.length > 0) {
        const allFiles = multiple ? [...uploadedFiles, ...newUploadedFiles] : newUploadedFiles
        setUploadedFiles(allFiles)
        onUpload(allFiles)
        toast.success(`Berhasil upload ${newUploadedFiles.length} file`)
      }
    } catch (error) {
      console.error("Upload error:", error)
      toast.error("Terjadi kesalahan saat upload file")
    } finally {
      setUploading(false)
      setUploadProgress(0)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const removeFile = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index)
    setUploadedFiles(newFiles)
    onUpload(newFiles)
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) {
      return <Image className="w-4 h-4" />
    }
    return <FileText className="w-4 h-4" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2">
        <Input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          disabled={uploading}
          className="hidden"
          id="file-upload"
        />
        <Label htmlFor="file-upload" className="cursor-pointer">
          <Button
            type="button"
            variant="outline"
            disabled={uploading}
            className="flex items-center gap-2"
            asChild
          >
            <span>
              <Upload className="w-4 h-4" />
              {uploading ? "Uploading..." : "Pilih File"}
            </span>
          </Button>
        </Label>
        <span className="text-sm text-muted-foreground">
          Maksimal {maxSize}MB
        </span>
      </div>

      {uploading && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <span>Uploading...</span>
            <span>{uploadProgress.toFixed(0)}%</span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">File yang diupload:</Label>
          <div className="space-y-2">
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded-lg bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  {getFileIcon(file.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {file.originalName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    Uploaded
                  </Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {uploadType === "photo" && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <AlertCircle className="w-3 h-3" />
          <span>Hanya file gambar (JPG, PNG, WebP) yang diperbolehkan</span>
        </div>
      )}

      {uploadType === "document" && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <AlertCircle className="w-3 h-3" />
          <span>Hanya file dokumen (PDF, DOC, DOCX) yang diperbolehkan</span>
        </div>
      )}
    </div>
  )
}