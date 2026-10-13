"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { formatDateTime } from "@/lib/format";
import { useFeedback } from "@/components/Feedback"
import { clearDraft, loadDraft, saveDraft, type DraftData, type DraftFixture, type DraftTeam } from "@/lib/activity-drafts";

/*
 * Staff editor for one activity's points table + fixtures.
 * Everything here edits a private DRAFT. The public pages read the real `teams` and
 * `fixtures` tables, which only change when staff press "Publish to public".
 */

const STAT_FIELDS = ["played", "won", "drawn", "lost", "goals_for", "goals_against", "goal_difference", "points"] as const;
type StatField = (typeof STAT_FIELDS)[number];
const STAT_LABEL: Record<StatField, string> = { played: "P", won: "W", drawn: "D", lost: "L", goals_for: "GF", goals_against: "GA", goal_difference: "GD", points: "Pts" };

const isTmp = (id: string) => id.startsWith("tmp-");
const newId = () => `tmp-${crypto.randomUUID()}`;
const pad = (n: number) => String(n).padStart(2, "0");
const toLocalInput = (iso: string) => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const fromLocalInput = (value: string) => new Date(value).toISOString();

/* eslint-disable @typescript-eslint/no-explicit-any */
const toTeam = (t: any): DraftTeam => ({
  id: String(t.id), name: t.name ?? "", group_name: t.group_name ?? null,
  played: Number(t.played ?? 0), won: Number(t.won ?? 0), drawn: Number(t.drawn ?? 0), lost: Number(t.lost ?? 0),
  goals_for: Number(t.goals_for ?? 0), goals_against: Number(t.goals_against ?? 0),
  goal_difference: Number(t.goal_difference ?? 0), points: Number(t.points ?? 0),
});
const toFixture = (f: any): DraftFixture => ({
  id: String(f.id), home_team_id: String(f.home_team_id), away_team_id: String(f.away_team_id),
  home_score: f.home_score == null ? null : Number(f.home_score), away_score: f.away_score == null ? null : Number(f.away_score),
  match_date: f.match_date, location: f.location ?? null, status: f.status ?? "scheduled",
});
/* eslint-enable @typescript-eslint/no-explicit-any */

// Add (sign = 1) or take back (sign = -1) one completed fixture's effect on the two teams' stats.
// Working in deltas means manual corrections staff typed into the table are never overwritten.
const applyResult = (teams: DraftTeam[], f: DraftFixture, sign: 1 | -1): DraftTeam[] => {
  const hs = Number(f.home_score ?? 0);
  const as = Number(f.away_score ?? 0);
  return teams.map((t) => {
    const isHome = t.id === f.home_team_id;
    if (!isHome && t.id !== f.away_team_id) return t;
    const gf = isHome ? hs : as;
    const ga = isHome ? as : hs;
    return {
      ...t,
      played: t.played + sign,
      won: t.won + (gf > ga ? sign : 0),
      drawn: t.drawn + (gf === ga ? sign : 0),
      lost: t.lost + (gf < ga ? sign : 0),
      goals_for: t.goals_for + sign * gf,
      goals_against: t.goals_against + sign * ga,
      goal_difference: t.goal_difference + sign * (gf - ga),
      points: t.points + sign * (gf > ga ? 3 : gf === ga ? 1 : 0),
    };
  });
};

const sortStandings = (teams: DraftTeam[]) =>
  [...teams].sort((a, b) => b.points - a.points || b.goal_difference - a.goal_difference || b.goals_for - a.goals_for || a.name.localeCompare(b.name));

const teamSig = (t: DraftTeam) => JSON.stringify([t.name, t.group_name, ...STAT_FIELDS.map((k) => t[k])]);
const fixtureSig = (f: DraftFixture) =>
  JSON.stringify([f.home_team_id, f.away_team_id, f.home_score, f.away_score, new Date(f.match_date).getTime(), f.location ?? "", f.status]);

function diffRows<T extends { id: string }>(live: T[], draft: T[], sig: (row: T) => string) {
  const liveById = new Map(live.map((r) => [r.id, r]));
  const state: Record<string, "new" | "edited"> = {};
  for (const row of draft) {
    const before = liveById.get(row.id);
    if (!before) state[row.id] = "new";
    else if (sig(before) !== sig(row)) state[row.id] = "edited";
  }
  const draftIds = new Set(draft.map((r) => r.id));
  const removed = live.filter((r) => !draftIds.has(r.id)).length;
  return { state, removed };
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
const field = "border rounded-lg px-2 py-1.5 text-sm bg-transparent";
const badge = "text-[.6rem] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full";

export default function ActivityDraftEditor({ activityId }: { activityId: string }) {
  const [supabase] = useState(() => supabaseBrowser());
  const { confirm } = useFeedback();
  const [live, setLive] = useState<DraftData>({ teams: [], fixtures: [] });
  const [draft, setDraft] = useState<DraftData>({ teams: [], fixtures: [] });
  const [ready, setReady] = useState(false);
  const [shared, setShared] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const storedRef = useRef(false); // is there a saved draft we may need to delete?

  const [newTeam, setNewTeam] = useState({ name: "", group_name: "" });
  const [newFixture, setNewFixture] = useState({ home_team_id: "", away_team_id: "", match_date: "", location: "" });
  const [scores, setScores] = useState<Record<string, { home: string; away: string }>>({});
  const [rescheduling, setRescheduling] = useState<{ id: string; match_date: string; location: string } | null>(null);

  const fetchLive = async (): Promise<DraftData> => {
    const [t, f] = await Promise.all([
      supabase.from("teams").select("*").eq("activity_id", activityId).order("name"),
      supabase.from("fixtures").select("*").eq("activity_id", activityId).order("match_date"),
    ]);
    if (t.error || f.error) throw new Error((t.error ?? f.error)!.message);
    return { teams: (t.data ?? []).map(toTeam), fixtures: (f.data ?? []).map(toFixture) };
  };

  const load = async () => {
    try {
      const liveData = await fetchLive();
      const { draft: stored, shared: sh } = await loadDraft(supabase, activityId);
      setLive(liveData);
      setShared(sh);
      storedRef.current = !!stored;
      setDraft(stored ?? liveData);
    } catch (e) {
      setMessage({ kind: "error", text: `Couldn't load this activity: ${(e as Error).message}` });
    }
    setReady(true);
  };
  // Fetching on mount: state is only set after the awaits resolve, so the cascading-render warning doesn't apply.
  // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [activityId]);

  const teamDiff = useMemo(() => diffRows(live.teams, draft.teams, teamSig), [live.teams, draft.teams]);
  const fixtureDiff = useMemo(() => diffRows(live.fixtures, draft.fixtures, fixtureSig), [live.fixtures, draft.fixtures]);
  const changeCount = Object.keys(teamDiff.state).length + teamDiff.removed + Object.keys(fixtureDiff.state).length + fixtureDiff.removed;
  const hasChanges = changeCount > 0;

  // Autosave the draft shortly after every edit so nothing is lost if the tab closes.
  useEffect(() => {
    if (!ready || publishing) return;
    const timer = setTimeout(() => {
      if (hasChanges) { storedRef.current = true; saveDraft(supabase, activityId, draft, shared); }
      else if (storedRef.current) { storedRef.current = false; clearDraft(supabase, activityId, shared); }
    }, 500);
    return () => clearTimeout(timer);
  }, [draft, hasChanges, ready, publishing, shared, supabase, activityId]);

  // Closing the editor (Hide) within the autosave delay must not lose the last edit.
  const latest = useRef({ draft, hasChanges, ready, publishing, shared });
  useEffect(() => { latest.current = { draft, hasChanges, ready, publishing, shared }; });
  useEffect(() => () => {
    const l = latest.current;
    if (l.ready && !l.publishing && l.hasChanges) saveDraft(supabase, activityId, l.draft, l.shared);
  }, [supabase, activityId]);

  const teamName = (id: string) => draft.teams.find((t) => t.id === id)?.name ?? "—";
  const updateDraft = (fn: (d: DraftData) => DraftData) => { setMessage(null); setDraft(fn); };

  /* ---------- teams ---------- */
  const addTeam = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newTeam.name.trim();
    if (!name) return;
    updateDraft((d) => ({
      ...d,
      teams: [...d.teams, { id: newId(), name, group_name: newTeam.group_name.trim() || null, played: 0, won: 0, drawn: 0, lost: 0, goals_for: 0, goals_against: 0, goal_difference: 0, points: 0 }],
    }));
    setNewTeam({ name: "", group_name: "" });
  };

  const updateStat = (teamId: string, key: StatField, value: string) => {
    const n = Number(value || 0);
    if (Number.isNaN(n)) return;
    updateDraft((d) => ({ ...d, teams: d.teams.map((t) => (t.id === teamId && t[key] !== n ? { ...t, [key]: n } : t)) }));
  };

    const removeTeam = async (team: DraftTeam) => {
    const gone = draft.fixtures.filter((f) => f.home_team_id === team.id || f.away_team_id === team.id);
    const ok = await confirm({
      title: `Remove ${team.name}?`,
      message: gone.length ? `Its ${plural(gone.length, "fixture")} will be removed from the draft too.` : "It will be removed from the draft. Nothing changes publicly until you publish.",
      confirmLabel: "Remove",
      danger: true,
    });
    if (!ok) return;
    updateDraft((d) => {
      let teams = d.teams.filter((t) => t.id !== team.id);
      for (const f of gone) if (f.status === "completed") teams = applyResult(teams, f, -1); // undo the opponent's stats
      return { teams, fixtures: d.fixtures.filter((f) => !gone.includes(f)) };
    });
  };

  /* ---------- fixtures ---------- */
  const addFixture = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFixture.home_team_id || !newFixture.away_team_id || !newFixture.match_date) return;
    if (newFixture.home_team_id === newFixture.away_team_id) { setMessage({ kind: "error", text: "Pick two different teams." }); return; }
    updateDraft((d) => ({
      ...d,
      fixtures: [...d.fixtures, {
        id: newId(), home_team_id: newFixture.home_team_id, away_team_id: newFixture.away_team_id,
        home_score: null, away_score: null, match_date: fromLocalInput(newFixture.match_date),
        location: newFixture.location.trim() || null, status: "scheduled",
      }],
    }));
    setNewFixture({ home_team_id: "", away_team_id: "", match_date: "", location: "" });
  };

  const saveResult = (f: DraftFixture) => {
    const s = scores[f.id];
    if (!s || s.home === "" || s.away === "") return;
    const home = Number(s.home);
    const away = Number(s.away);
    if (!Number.isInteger(home) || !Number.isInteger(away) || home < 0 || away < 0) { setMessage({ kind: "error", text: "Scores must be whole numbers, 0 or higher." }); return; }
    const done: DraftFixture = { ...f, home_score: home, away_score: away, status: "completed" };
    updateDraft((d) => ({ teams: applyResult(d.teams, done, 1), fixtures: d.fixtures.map((x) => (x.id === f.id ? done : x)) }));
    setScores((prev) => ({ ...prev, [f.id]: { home: "", away: "" } }));
  };

  const saveReschedule = () => {
    if (!rescheduling || !rescheduling.match_date) { setMessage({ kind: "error", text: "Choose a new date and time." }); return; }
    const { id, match_date, location } = rescheduling;
    updateDraft((d) => ({
      ...d,
      fixtures: d.fixtures.map((f) => (f.id === id ? { ...f, match_date: fromLocalInput(match_date), location: location.trim() || null, status: "scheduled" } : f)),
    }));
    setRescheduling(null);
  };

    const deleteFixture = async (f: DraftFixture) => {
    if (f.status === "completed") {
      const ok = await confirm({
        title: "Delete this result?",
        message: `${teamName(f.home_team_id)} ${f.home_score}–${f.away_score} ${teamName(f.away_team_id)}. The points table will be adjusted.`,
        confirmLabel: "Delete result",
        danger: true,
      });
      if (!ok) return;
    }
    updateDraft((d) => ({
      teams: f.status === "completed" ? applyResult(d.teams, f, -1) : d.teams,
      fixtures: d.fixtures.filter((x) => x.id !== f.id),
    }));
    if (rescheduling?.id === f.id) setRescheduling(null);
  };

  /* ---------- publish / discard ---------- */
  const discard = async () => {
        const ok = await confirm({ title: "Discard the draft?", message: "Everything goes back to what the public currently sees.", confirmLabel: "Discard draft", danger: true });
    if (!ok) return;
    storedRef.current = false;
    await clearDraft(supabase, activityId, shared);
    setRescheduling(null);
    await load();
    setMessage({ kind: "ok", text: "Draft discarded." });
  };

  const publish = async () => {
    if (!hasChanges || publishing) return;
        const ok = await confirm({ title: `Publish ${plural(changeCount, "change")}?`, message: "The public points table and fixtures update straight away.", confirmLabel: "Publish" });
    if (!ok) return;
    setPublishing(true);
    setMessage(null);

    const snapshot = draft;
    const idMap = new Map<string, string>(); // draft-only id -> real database id
    const mapId = (id: string) => idMap.get(id) ?? id;
    let failure: string | null = null;

    try {
      const current = await fetchLive(); // compare against the database as it is right now
      const liveTeams = new Map(current.teams.map((t) => [t.id, t]));
      const liveFixtures = new Map(current.fixtures.map((f) => [f.id, f]));

      for (const t of snapshot.teams) {
        const row = { name: t.name, group_name: t.group_name, ...Object.fromEntries(STAT_FIELDS.map((k) => [k, t[k]])) };
        if (isTmp(t.id)) {
          const { data, error } = await supabase.from("teams").insert({ ...row, activity_id: activityId }).select("id").single();
          if (error) throw error;
          idMap.set(t.id, String(data.id));
        } else {
          const before = liveTeams.get(t.id);
          if (before && teamSig(before) === teamSig(t)) continue;
          const { error } = await supabase.from("teams").update(row).eq("id", t.id);
          if (error) throw error;
        }
      }

      for (const f of snapshot.fixtures) {
        const row = {
          home_team_id: mapId(f.home_team_id), away_team_id: mapId(f.away_team_id),
          home_score: f.home_score, away_score: f.away_score,
          match_date: f.match_date, location: f.location, status: f.status,
        };
        if (isTmp(f.id)) {
          const { data, error } = await supabase.from("fixtures").insert({ ...row, activity_id: activityId }).select("id").single();
          if (error) throw error;
          idMap.set(f.id, String(data.id));
        } else {
          const before = liveFixtures.get(f.id);
          if (before && fixtureSig(before) === fixtureSig(f)) continue;
          const { error } = await supabase.from("fixtures").update(row).eq("id", f.id);
          if (error) throw error;
        }
      }

      // Deletions last, fixtures before teams, so nothing is ever left pointing at a missing team.
      const keepFixtures = new Set(snapshot.fixtures.map((f) => f.id));
      const keepTeams = new Set(snapshot.teams.map((t) => t.id));
      const dropFixtures = current.fixtures.filter((f) => !keepFixtures.has(f.id)).map((f) => f.id);
      const dropTeams = current.teams.filter((t) => !keepTeams.has(t.id)).map((t) => t.id);
      if (dropFixtures.length) { const { error } = await supabase.from("fixtures").delete().in("id", dropFixtures); if (error) throw error; }
      if (dropTeams.length) { const { error } = await supabase.from("teams").delete().in("id", dropTeams); if (error) throw error; }
    } catch (e) {
      failure = (e as { message?: string }).message ?? "Unknown error";
    }

    if (failure) {
      // Keep the draft, but point it at the rows that were already created so a retry doesn't duplicate them.
      if (idMap.size) {
        setDraft({
          teams: snapshot.teams.map((t) => ({ ...t, id: mapId(t.id) })),
          fixtures: snapshot.fixtures.map((f) => ({ ...f, id: mapId(f.id), home_team_id: mapId(f.home_team_id), away_team_id: mapId(f.away_team_id) })),
        });
      }
      try { setLive(await fetchLive()); } catch { /* keep the old snapshot */ }
      setMessage({ kind: "error", text: `Publishing stopped part-way: ${failure}. Your draft is still saved — fix the problem and press Publish again.` });
      setPublishing(false);
      return;
    }

    storedRef.current = false;
    await clearDraft(supabase, activityId, shared);
    setRescheduling(null);
    await load();
    setPublishing(false);
    setMessage({ kind: "ok", text: "Published. The public points table and fixtures are now up to date." });
  };

  /* ---------- render ---------- */
  if (!ready) return <p className="mt-4 text-xs text-blue-700/70 dark:text-blue-300/70">Loading…</p>;

  const standings = sortStandings(draft.teams);
  const fixturesByDate = [...draft.fixtures].sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime());
  const summary = [
    Object.keys(teamDiff.state).length + teamDiff.removed > 0 && plural(Object.keys(teamDiff.state).length + teamDiff.removed, "team change"),
    Object.keys(fixtureDiff.state).length + fixtureDiff.removed > 0 && plural(Object.keys(fixtureDiff.state).length + fixtureDiff.removed, "fixture change"),
  ].filter(Boolean).join(" and ");

  const draftBadge = (s?: "new" | "edited") =>
    s ? <span className={`${badge} ${s === "new" ? "bg-ok/20 text-ok" : "bg-warn/20 text-warn"}`}>{s === "new" ? "New" : "Edited"}</span> : null;

  return (
    <div className="mt-4 space-y-6">
      <div className={`sticky top-[77px] z-30 rounded-xl border p-3 text-sm backdrop-blur ${hasChanges ? "border-warn bg-warn/15" : "border-blue-100 dark:border-blue-900 bg-blue-50/80 dark:bg-blue-900/30"}`}>
        {hasChanges ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p><span className="font-bold">Draft:</span> {summary}, not public yet.</p>
            <div className="flex gap-2">
              <button onClick={discard} disabled={publishing} className="text-xs font-bold border rounded-lg px-3 py-1.5 disabled:opacity-50">Discard draft</button>
              <button onClick={publish} disabled={publishing} className="text-xs font-bold bg-blue-900 text-white rounded-lg px-3 py-1.5 disabled:opacity-50">{publishing ? "Publishing…" : "Publish to public"}</button>
            </div>
          </div>
        ) : (
          <p className="text-blue-700/80 dark:text-blue-300/80">The public site matches this page. Changes you make here stay private until you publish them.</p>
        )}
        {!shared && <p className="mt-2 text-xs text-blue-700/80 dark:text-blue-300/80">Drafts are saved in this browser only. Run <code>supabase/activity_drafts.sql</code> in Supabase so every staff member shares one draft.</p>}
        {message && <p role="status" className={`mt-2 text-xs font-bold ${message.kind === "ok" ? "text-ok" : "text-bad"}`}>{message.text}</p>}
      </div>

      <div className="bg-blue-50/60 dark:bg-blue-900/20 rounded-xl p-4">
        <h4 className="font-black uppercase text-xs mb-3">Teams & table</h4>
        <form onSubmit={addTeam} className="flex flex-wrap gap-2 mb-4">
          <input placeholder="Team name" aria-label="Team name" value={newTeam.name} onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })} className={`${field} flex-1 min-w-32`} />
          <input placeholder="Group (optional)" aria-label="Group" value={newTeam.group_name} onChange={(e) => setNewTeam({ ...newTeam, group_name: e.target.value })} className={`${field} w-32`} />
          <button disabled={publishing} className="bg-blue-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-50">Add team</button>
        </form>

        {standings.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-blue-700/60 dark:text-blue-300/60 uppercase tracking-widest">
                  <th className="py-1.5">Team</th><th>Group</th>
                  {STAT_FIELDS.map((k) => <th key={k}>{STAT_LABEL[k]}</th>)}<th></th>
                </tr>
              </thead>
              <tbody>
                {standings.map((t) => (
                  <tr key={t.id} className="border-t border-blue-100 dark:border-blue-900">
                    <td className="py-1.5 font-bold whitespace-nowrap">{t.name} {draftBadge(teamDiff.state[t.id])}</td>
                    <td className="text-blue-700/70">{t.group_name ?? "—"}</td>
                    {STAT_FIELDS.map((k) => (
                      <td key={k}>
                        <input type="number" aria-label={`${t.name} ${STAT_LABEL[k]}`} key={`${t.id}-${k}-${t[k]}`} defaultValue={t[k]} disabled={publishing}
                          onBlur={(e) => updateStat(t.id, k, e.target.value)} className="w-12 border rounded px-1 py-0.5 bg-transparent" />
                      </td>
                    ))}
                    <td><button onClick={() => removeTeam(t)} disabled={publishing} aria-label={`Remove ${t.name}`} className="text-bad font-bold px-1">×</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {teamDiff.removed > 0 && <p className="mt-2 text-xs text-warn">{plural(teamDiff.removed, "team")} removed in this draft.</p>}
        {!draft.teams.length && <p className="text-xs text-blue-700/70">No teams yet — add some above.</p>}
      </div>

      <div className="bg-blue-50/60 dark:bg-blue-900/20 rounded-xl p-4">
        <h4 className="font-black uppercase text-xs mb-3">Fixtures</h4>
        <form onSubmit={addFixture} className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
          <select aria-label="Home team" value={newFixture.home_team_id} onChange={(e) => setNewFixture({ ...newFixture, home_team_id: e.target.value })} className={field}>
            <option value="">Home team</option>
            {draft.teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <select aria-label="Away team" value={newFixture.away_team_id} onChange={(e) => setNewFixture({ ...newFixture, away_team_id: e.target.value })} className={field}>
            <option value="">Away team</option>
            {draft.teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <input type="datetime-local" aria-label="Match date and time" value={newFixture.match_date} onChange={(e) => setNewFixture({ ...newFixture, match_date: e.target.value })} className={field} />
          <input placeholder="Pitch / location" aria-label="Location" value={newFixture.location} onChange={(e) => setNewFixture({ ...newFixture, location: e.target.value })} className={field} />
          <button disabled={publishing} className="sm:col-span-2 bg-blue-900 text-white rounded-lg py-1.5 text-sm font-bold disabled:opacity-50">Add fixture</button>
        </form>

        {fixturesByDate.map((f) => {
          const editing = rescheduling?.id === f.id;
          return (
            <div key={f.id} className="border-t border-blue-100 dark:border-blue-900 pt-3 pb-2">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-bold">{teamName(f.home_team_id)} vs {teamName(f.away_team_id)} {draftBadge(fixtureDiff.state[f.id])}</p>
                  <p className="text-xs text-blue-700/70">{formatDateTime(f.match_date)}{f.location ? ` · ${f.location}` : ""}</p>
                </div>
                <div className="flex gap-3 text-xs font-bold">
                  {f.status !== "completed" && (
                    <button onClick={() => setRescheduling(editing ? null : { id: f.id, match_date: toLocalInput(f.match_date), location: f.location ?? "" })} disabled={publishing} className="text-blue-600">
                      {editing ? "Cancel" : "Reschedule"}
                    </button>
                  )}
                  <button onClick={() => deleteFixture(f)} disabled={publishing} className="text-bad">Delete</button>
                </div>
              </div>

              {editing && rescheduling && (
                <div className="mt-2 flex flex-wrap gap-2 items-center">
                  <input type="datetime-local" aria-label="New date and time" value={rescheduling.match_date} onChange={(e) => setRescheduling({ ...rescheduling, match_date: e.target.value })} className={field} />
                  <input placeholder="Pitch / location" aria-label="Location" value={rescheduling.location} onChange={(e) => setRescheduling({ ...rescheduling, location: e.target.value })} className={`${field} flex-1 min-w-32`} />
                  <button onClick={saveReschedule} className="text-xs font-bold bg-blue-900 text-white px-3 py-1.5 rounded-lg">Save new time</button>
                </div>
              )}

              {f.status === "completed" ? (
                <p className="text-sm font-black text-blue-600 mt-1">{f.home_score} – {f.away_score}</p>
              ) : (
                <div className="flex gap-2 items-center mt-2">
                  <input type="number" min={0} placeholder="Home" aria-label="Home score" value={scores[f.id]?.home ?? ""} className="w-16 border rounded-lg px-2 py-1 text-xs bg-transparent"
                    onChange={(e) => setScores({ ...scores, [f.id]: { home: e.target.value, away: scores[f.id]?.away ?? "" } })} />
                  <span className="text-xs">–</span>
                  <input type="number" min={0} placeholder="Away" aria-label="Away score" value={scores[f.id]?.away ?? ""} className="w-16 border rounded-lg px-2 py-1 text-xs bg-transparent"
                    onChange={(e) => setScores({ ...scores, [f.id]: { home: scores[f.id]?.home ?? "", away: e.target.value } })} />
                  <button onClick={() => saveResult(f)} disabled={publishing} className="text-xs font-bold bg-blue-900 text-white px-3 py-1 rounded-lg">Save result</button>
                </div>
              )}
            </div>
          );
        })}
        {fixtureDiff.removed > 0 && <p className="mt-2 text-xs text-warn">{plural(fixtureDiff.removed, "fixture")} deleted in this draft.</p>}
        {!draft.fixtures.length && <p className="text-xs text-blue-700/70">No fixtures yet.</p>}
      </div>
    </div>
  );
}   