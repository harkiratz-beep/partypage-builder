import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="rounded-card border border-line bg-surface p-4">
      <h1 className="font-semibold">Invite not found</h1>
      <p className="mt-1 text-sm text-muted">
        Check the link with whoever sent it to you.
      </p>
      <Link
        href="/"
        className="mt-3 inline-flex items-center rounded-lg border border-line px-3 py-2 text-sm font-semibold"
      >
        Back home
      </Link>
    </div>
  );
}
