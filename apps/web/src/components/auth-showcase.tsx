import { useQuery } from "@tanstack/react-query";

import { Button } from "@acme/ui/button";

import { orpc } from "~/lib/api";
import { authClient } from "~/lib/auth";

export function AuthShowcase() {
  const { data: session } = authClient.useSession();

  const secretQuery = useQuery({
    ...orpc.auth.getSecretMessage.queryOptions(),
    enabled: !!session,
  });

  if (!session) {
    return (
      <Button
        size="lg"
        onClick={async () => {
          const res = await authClient.signIn.social({
            provider: "google",
            callbackURL: `${window.location.origin}/`,
          });
          if (!res.data?.url) {
            throw new Error("No URL returned from signInSocial");
          }
          window.location.href = res.data.url;
        }}
      >
        Sign in with Google
      </Button>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <p className="text-center text-2xl">
        <span>Logged in as {session.user.name}</span>
      </p>

      {secretQuery.data ? (
        <p className="text-muted-foreground text-center text-sm italic">
          {secretQuery.data}
        </p>
      ) : null}

      <Button
        size="lg"
        onClick={async () => {
          await authClient.signOut();
          window.location.href = "/";
        }}
      >
        Sign out
      </Button>
    </div>
  );
}
