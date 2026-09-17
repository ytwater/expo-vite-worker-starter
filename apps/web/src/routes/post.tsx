import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@acme/ui/button";

import { orpc } from "~/lib/api";

export function PostPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError } = useQuery(
    orpc.post.byId.queryOptions({ input: { id: id ?? "" } }),
  );

  if (!id) {
    return <p className="p-8">Missing post id</p>;
  }

  if (isLoading) {
    return <p className="p-8">Loading…</p>;
  }

  if (isError || !data) {
    return (
      <main className="container py-16">
        <p className="text-destructive">Post not found</p>
        <Button asChild className="mt-4" variant="outline">
          <Link to="/">Back</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="container py-16">
      <Button asChild variant="outline" className="mb-6">
        <Link to="/">← Back</Link>
      </Button>
      <h1 className="text-primary text-3xl font-bold">{data.title}</h1>
      <p className="text-foreground mt-4">{data.content}</p>
    </main>
  );
}
