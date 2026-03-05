import { ReactNode } from "react";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ClerkProvider, useAuth } from "@clerk/clerk-react";

const convexUrl = import.meta.env.VITE_CONVEX_URL || import.meta.env.NEXT_PUBLIC_CONVEX_URL;
const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || import.meta.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  if (!convexUrl || !clerkKey) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-4">
          <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Configuration Required</h1>
          <p className="text-zinc-500">
            Please set <code className="text-amber-500">VITE_CONVEX_URL</code> and <code className="text-amber-500">VITE_CLERK_PUBLISHABLE_KEY</code> in your environment variables to continue.
          </p>
        </div>
      </div>
    );
  }

  const convex = new ConvexReactClient(convexUrl);

  return (
    <ClerkProvider publishableKey={clerkKey}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
