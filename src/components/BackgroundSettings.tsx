import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ImagePlus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";

export function BackgroundSettings() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { role } = useUserRole();
  const [uploading, setUploading] = useState(false);
  const [open, setOpen] = useState(false);

  if (role !== "coordenador") {
    return null;
  }

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    imageNumber: 1 | 2
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: t("error"),
        description: t("invalidImageFormat"),
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: t("error"),
        description: "File size must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('imageNumber', imageNumber.toString());

      const { data, error } = await supabase.functions.invoke('upload-background', {
        body: formData,
      });

      if (error) throw error;

      toast({
        title: t("success"),
        description: t("backgroundUpdated"),
      });

      window.location.reload();
    } catch (error) {
      console.error("Error uploading background:", error);
      toast({
        title: t("error"),
        description: t("errorUploadingBackground"),
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <ImagePlus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{t("backgroundSettings")}</DialogTitle>
          <DialogDescription>{t("backgroundSettingsDescription")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="background1">{t("backgroundImage1")}</Label>
            <Input
              id="background1"
              type="file"
              accept="image/*"
              onChange={(e) => handleFileUpload(e, 1)}
              disabled={uploading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="background2">{t("backgroundImage2")}</Label>
            <Input
              id="background2"
              type="file"
              accept="image/*"
              onChange={(e) => handleFileUpload(e, 2)}
              disabled={uploading}
            />
          </div>
          {uploading && (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{t("uploading")}</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
