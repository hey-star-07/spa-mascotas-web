"use client";

import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

interface WhatsAppButtonProps {
  mensaje: string;
  numero: string;
  className?: string;
}

export function WhatsAppButton({ mensaje, numero, className }: WhatsAppButtonProps) {
  const handleClick = () => {
    const mensajeEncoded = encodeURIComponent(mensaje);
    const url = `https://wa.me/${numero.replace(/\D/g, '')}?text=${mensajeEncoded}`;
    window.open(url, "_blank");
  };

  return (
    <Button onClick={handleClick} className={className} variant="accent">
      <MessageCircle className="mr-2 h-5 w-5" />
      Enviar por WhatsApp
    </Button>
  );
}