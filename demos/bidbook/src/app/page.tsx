"use client";

import { useCallback, useEffect, useState } from "react";
import { SaturationError } from "@saturationio/sdk";
import type { Project, Me } from "@saturationio/sdk";
import {
  makeClient,
  storeCredentials,
  clearCredentials,
  getStoredToken,
  DEFAULT_BASE_URL,
} from "@/lib/sat";
import { Bidbook } from "@/components/Bidbook";

type Stage =
  | { name: "connect" }
  | { name: "projects"; me: Me }
  | { name: "bidbook"; me: Me; project: Project };

export default function Home() {
  const [stage, setStage] = useState<Stage>({ name: "connect" });
  const [booting, setBooting] = useState(true);

  // Reconnect silently if a token is already stored.
  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setBooting(false);
      return;
    }
    makeClient(token)
      .me()
      .then((me) => setStage({ name: "projects", me }))
      .catch(() => setStage({ name: "connect" }))
      .finally(() => setBooting(false));
  }, []);

  const connect = useCallback(async (token: string, baseUrl?: string) => {
    storeCredentials(token, baseUrl);
    const me = await makeClient(token).me();
    setStage({ name: "projects", me });
  }, []);

  const disconnect = useCallback(() => {
    clearCredentials();
    setStage({ name: "connect" });
  }, []);

  if (booting) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Wordmark />
      </div>
    );
  }

  if (stage.name === "connect") {
    return <ConnectScreen onConnect={connect} />;
  }

  if (stage.name === "projects") {
    return (
      <ProjectPicker
        me={stage.me}
        onPick={(project) => setStage({ name: "bidbook", me: stage.me, project })}
        onDisconnect={disconnect}
      />
    );
  }

  return (
    <Bidbook
      me={stage.me}
      project={stage.project}
      onBack={() => setStage({ name: "projects", me: stage.me })}
      onDisconnect={disconnect}
    />
  );
}

function Wordmark() {
  return (
    <div className="font-display text-2xl tracking-tight text-[var(--color-cream)]">
      Bidbook
      <span className="text-[var(--color-gold)]">.</span>
    </div>
  );
}

/* ---------------- Connect ---------------- */

function ConnectScreen({
  onConnect,
}: {
  onConnect: (token: string, baseUrl?: string) => Promise<void>;
}) {
  const [token, setToken] = useState("");
  const [baseUrl, setBaseUrl] = useState(DEFAULT_BASE_URL);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await onConnect(token.trim(), baseUrl);
    } catch (err) {
      if (err instanceof SaturationError) {
        setError(
          err.code === "invalid_token"
            ? "That token was not accepted. Check it and try again."
            : err.message
        );
      } else {
        setError("Could not reach the API. Check the base URL.");
      }
      setPending(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-md">
        <Wordmark />
        <h1 className="font-display mt-10 text-5xl leading-[1.05] font-light">
          Your budget,
          <br />
          <span className="text-[var(--color-gold)]">ready to send.</span>
        </h1>
        <p className="mt-6 text-[15px] leading-relaxed text-[var(--color-muted)]">
          Bidbook turns a live Saturation budget into a client-ready bid.
          Connect a token to see your own project, beautifully presented.
        </p>

        <form onSubmit={submit} className="mt-10 space-y-4">
          <div>
            <label className="mb-2 block text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--color-muted)]">
              API token
            </label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="sat_live_..."
              autoFocus
              className="w-full rounded-md border hairline bg-[var(--color-ink-2)] px-4 py-3 text-[15px] outline-none placeholder:text-[var(--color-muted)]/50 focus:border-[var(--color-gold)]/60"
            />
            <p className="mt-2 text-[12px] text-[var(--color-muted)]">
              Settings → Developers → API. Stored only in this tab.
            </p>
          </div>

          {showAdvanced && (
            <div>
              <label className="mb-2 block text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--color-muted)]">
                API base URL
              </label>
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                className="w-full rounded-md border hairline bg-[var(--color-ink-2)] px-4 py-3 text-[14px] outline-none focus:border-[var(--color-gold)]/60"
              />
            </div>
          )}

          {error && (
            <p className="rounded-md border border-red-900/50 bg-red-950/40 px-4 py-3 text-[13px] text-red-200">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!token.trim() || pending}
            className="w-full rounded-md bg-[var(--color-cream)] px-4 py-3 text-[15px] font-semibold text-[var(--color-ink)] transition hover:bg-white disabled:opacity-40"
          >
            {pending ? "Connecting" : "Connect workspace"}
          </button>

          <button
            type="button"
            onClick={() => setShowAdvanced((s) => !s)}
            className="w-full text-center text-[12px] text-[var(--color-muted)] hover:text-[var(--color-cream)]"
          >
            {showAdvanced ? "Hide advanced" : "Use a local or staging API"}
          </button>
        </form>
      </div>

      <p className="absolute bottom-8 text-[12px] text-[var(--color-muted)]">
        A demo built on <span className="text-[var(--color-cream)]">@saturationio/sdk</span>
      </p>
    </div>
  );
}

/* ---------------- Project picker ---------------- */

function ProjectPicker({
  me,
  onPick,
  onDisconnect,
}: {
  me: Me;
  onPick: (p: Project) => void;
  onDisconnect: () => void;
}) {
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    makeClient()
      .projects.list({ limit: 100 })
      .all()
      .then(setProjects)
      .catch((e) =>
        setError(e instanceof SaturationError ? e.message : "Failed to load projects")
      );
  }, []);

  const ws = me.workspaces[0];

  return (
    <div className="mx-auto min-h-screen w-full max-w-5xl px-6 py-12">
      <header className="flex items-center justify-between">
        <Wordmark />
        <div className="flex items-center gap-4">
          <span className="text-[13px] text-[var(--color-muted)]">
            {ws?.workspaceName}
          </span>
          <button
            onClick={onDisconnect}
            className="text-[13px] text-[var(--color-muted)] hover:text-[var(--color-cream)]"
          >
            Disconnect
          </button>
        </div>
      </header>

      <h1 className="font-display mt-16 text-4xl font-light">Choose a project</h1>
      <p className="mt-3 text-[14px] text-[var(--color-muted)]">
        Pick the production to present as a bid.
      </p>

      {error && <p className="mt-8 text-red-300">{error}</p>}

      {!projects && !error && (
        <p className="mt-16 text-[var(--color-muted)]">Loading projects</p>
      )}

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects?.map((p) => (
          <button
            key={p.id}
            onClick={() => onPick(p)}
            className="group rounded-xl border hairline bg-[var(--color-ink-2)] p-6 text-left transition hover:border-[var(--color-gold)]/50 hover:bg-[var(--color-ink-3)]"
          >
            <div className="text-3xl">{p.emoji ?? "🎬"}</div>
            <div className="font-display mt-4 text-xl font-normal leading-snug">
              {p.name}
            </div>
            {p.summary && (
              <div className="mt-2 line-clamp-2 text-[13px] text-[var(--color-muted)]">
                {p.summary}
              </div>
            )}
            <div className="mt-4 text-[11px] uppercase tracking-[0.14em] text-[var(--color-muted)] group-hover:text-[var(--color-gold)]">
              Open bidbook →
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
