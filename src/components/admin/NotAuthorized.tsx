import { cn } from "../../lib/cn";
import { ui } from "../../lib/ui";

interface NotAuthorizedProps {
  email: string | null;
  onSignOut: () => void;
}

/** Shown when a signed-in user lacks the admin role. */
export function NotAuthorized({ email, onSignOut }: NotAuthorizedProps) {
  return (
    <div className="flex h-full flex-col justify-center bg-app-bg px-[30px] py-10 text-center">
      <div className="mb-4 text-[44px]">🔒</div>
      <div className="text-[24px] font-extrabold tracking-[-0.5px]">
        Not authorized
      </div>
      <div className="mt-2 text-[15px] font-medium leading-[1.5] text-muted">
        {email ? (
          <>
            <strong className="text-ink-dim">{email}</strong> is signed in but
            doesn’t have admin access.
          </>
        ) : (
          "This account doesn’t have admin access."
        )}
        <br />
        Ask an administrator to provision your account.
      </div>

      <button onClick={onSignOut} className={cn(ui.btnPrimary, "mt-7")}>
        Sign out
      </button>
    </div>
  );
}
