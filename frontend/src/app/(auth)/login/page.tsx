import { LoginForm } from "@/components/auth/login-form";
import { PawPrintIcon } from "@/components/shared/paw-print-icon";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="flex flex-col items-center gap-6">
        <PawPrintIcon size={48} variant="primary" />
        <LoginForm />
      </div>
    </div>
  );
}