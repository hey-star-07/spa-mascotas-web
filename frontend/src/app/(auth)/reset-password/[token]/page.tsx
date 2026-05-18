import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { PawPrintIcon } from "@/components/shared/paw-print-icon";

export default function ResetPasswordPage({ params }: { params: { token: string } }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="flex flex-col items-center gap-6">
        <PawPrintIcon size={48} variant="rose" />
        <ResetPasswordForm token={params.token} />
      </div>
    </div>
  );
}