export function Footer() {
  return (
    <footer className="mt-auto px-6 py-8">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between border-t border-zinc-200 pt-6 dark:border-white/10">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Rondivu · Self-hosted invites & RSVPs</p>
        <a
          href="https://github.com/HotWinterDays/rondivu"
          target="_blank"
          rel="noreferrer"
          className="text-sm text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          View repo
        </a>
      </div>
    </footer>
  );
}
