"use client";

import { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/axios";
import { getImageUrl } from "@/lib/images";
import { toast } from "sonner";

interface ImageUploadProps {
  onUpload: (url: string) => void;
  currentImage?: string;
  label?: string;
  className?: string;
}

export function ImageUpload({ onUpload, currentImage, label = "Subir imagen", className }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(
    currentImage ? (getImageUrl(currentImage) || currentImage) : null
  );
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Previsualizar localmente con FileReader (blob URL)
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    // Subir al servidor
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const { data } = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Guardar SOLO la ruta relativa (/uploads/xxx) — nunca el host hardcodeado
      const relativeUrl: string = data.data.url; // e.g. "/uploads/uuid.jpg"
      onUpload(relativeUrl);
      toast.success('Imagen subida exitosamente');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al subir imagen');
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onUpload('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className={className}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {preview ? (
        <div className="relative inline-block">
          <img
            src={preview}
            alt="Preview"
            className="w-32 h-32 object-cover rounded-xl border-3 border-foreground shadow-cartoon-sm"
          />
          <button
            onClick={handleRemove}
            className="absolute -top-2 -right-2 bg-rose text-white rounded-full p-1 border-2 border-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex flex-col items-center justify-center w-32 h-32 rounded-xl border-3 border-dashed border-foreground/40 hover:border-primary hover:bg-primary/10 transition-all gap-2"
        >
          {uploading ? (
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
          ) : (
            <>
              <ImageIcon className="h-8 w-8 text-foreground/40" />
              <span className="text-xs font-semibold text-foreground/50">{label}</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}