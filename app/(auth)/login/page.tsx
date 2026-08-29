import { signInWithOAuth } from "@/actions/auth";
import { Logo } from "@/components/layout/Logo";
import { ResetAnalytics } from "@/components/analytics/ResetAnalytics";

const ERROR_MESSAGES: Record<string, string> = {
  oauth_failed: "We couldn't sign you in. Please try again.",
  missing_code: "The sign-in link was invalid. Please try again.",
};

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.5 0 12.3c0 5.44 3.44 10.05 8.21 11.68.6.11.82-.27.82-.6 0-.29-.01-1.24-.02-2.25-3.34.75-4.04-1.45-4.04-1.45-.55-1.44-1.34-1.82-1.34-1.82-1.09-.77.08-.76.08-.76 1.21.09 1.84 1.28 1.84 1.28 1.07 1.87 2.81 1.33 3.5 1.02.11-.79.42-1.33.76-1.64-2.67-.31-5.47-1.38-5.47-6.13 0-1.35.47-2.46 1.24-3.32-.12-.31-.54-1.57.12-3.28 0 0 1.01-.33 3.3 1.27a11.2 11.2 0 0 1 6.02 0c2.29-1.6 3.3-1.27 3.3-1.27.66 1.71.24 2.97.12 3.28.77.86 1.24 1.97 1.24 3.32 0 4.76-2.81 5.81-5.49 6.12.43.38.81 1.13.81 2.29 0 1.65-.02 2.98-.02 3.39 0 .33.22.72.83.6C20.56 22.34 24 17.74 24 12.3 24 5.5 18.63 0 12 0Z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3.02h3.87c2.27-2.09 3.58-5.17 3.58-8.84Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.94-2.9l-3.87-3.02c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.95H1.27v3.11A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.28a7.2 7.2 0 0 1 0-4.56V6.61H1.27a12 12 0 0 0 0 10.78l4-3.11Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.34.6 4.58 1.79l3.43-3.43C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.27 6.61l4 3.11C6.22 6.88 8.87 4.77 12 4.77Z"
      />
    </svg>
  );
}

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const { error, loggedOut } = await searchParams;
  const errorMessage = typeof error === "string" ? ERROR_MESSAGES[error] : null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      {loggedOut === "1" && <ResetAnalytics />}
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-8 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)]">
        <div className="flex justify-center">
          <Logo />
        </div>

        <div className="mt-6 text-center">
          <h1 className="text-xl font-semibold text-text-primary">
            Welcome to JobPilot
          </h1>
          <p className="mt-1.5 text-sm text-text-secondary">
            Sign in to continue your job search.
          </p>
        </div>

        {errorMessage && (
          <p className="mt-4 rounded-md bg-error/10 px-3 py-2 text-center text-sm text-error">
            {errorMessage}
          </p>
        )}

        <div className="mt-8 flex flex-col gap-3">
          <form action={signInWithOAuth.bind(null, "google")}>
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2.5 rounded-md border border-border bg-surface px-4 py-2.5 text-sm font-medium text-text-primary transition-colors hover:bg-surface-secondary"
            >
              <GoogleIcon />
              Continue with Google
            </button>
          </form>

          <form action={signInWithOAuth.bind(null, "github")}>
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2.5 rounded-md bg-text-slate px-4 py-2.5 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
            >
              <GitHubIcon />
              Continue with GitHub
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
