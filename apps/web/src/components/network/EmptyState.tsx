export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border p-6 text-sm text-muted-foreground">
      {message}
    </div>
  );
}

