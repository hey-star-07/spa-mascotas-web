"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, X, Send } from "lucide-react";
import { useRouter } from "next/navigation";

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const router = useRouter();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    if (open) loadCount();
  }, [open]);

  const loadCount = async () => {
    try {
      const { data } = await api.get("/store/cart");
      setCartCount(data.data?.detalles?.length || 0);
    } catch {}
  };

  if (!open) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        size="lg"
        variant="accent"
        onClick={() => { onClose(); router.push("/store/cart"); }}
        className="shadow-cartoon relative animate-bounce"
      >
        <ShoppingCart className="mr-2 h-5 w-5" />
        Ver Carrito
        {cartCount > 0 && (
          <Badge variant="destructive" className="absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center p-0">
            {cartCount}
          </Badge>
        )}
      </Button>
    </div>
  );
}