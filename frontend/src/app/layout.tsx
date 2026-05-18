import type { Metadata } from "next";
import "@/styles/globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Pet Spa - Sistema de Gestión",
  description: "Sistema integral para Pet Spa & Grooming",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 600,
              border: "3px solid #2D2D2D",
              borderRadius: "1rem",
              boxShadow: "4px 4px 0px #2D2D2D",
            },
          }}
        />
      </body>
    </html>
  );
}