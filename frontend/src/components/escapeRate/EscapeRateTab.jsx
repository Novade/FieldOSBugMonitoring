import { useCallback, useEffect, useRef, useState } from 'react';
import { Banner } from '../common/Banner';
import { EscapeRateTable } from './EscapeRateTable';
import { EscapeRateIssuesTable } from './EscapeRateIssuesTable';
import { EscapeRateFormModal } from './EscapeRateFormModal';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import {
  fetchEscapeRates,
  createEscapeRate,
  updateEscapeRate,
  recomputeEscapeRate,
  recomputeAllEscapeRates,
  deleteEscapeRate,
  fetchEscapeRateIssues,
} from '../../services/escapeRateService';

export function EscapeRateTab() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // form: null = closed, { entry: null } = new, { entry } = edit
  const [form, setForm] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [recomputingId, setRecomputingId] = useState(null);

  const [selection, setSelection] = useState(null); // { id, scope }
  const [issues, setIssues] = useState([]);
  const [issuesLoading, setIssuesLoading] = useState(false);
  const [issuesError, setIssuesError] = useState(null);
  const latestIssuesRequest = useRef(0);

  useEffect(() => {
    fetchEscapeRates()
      .then((data) => setEntries(data.entries))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const loadIssues = useCallback(async (id, scope) => {
    const requestId = ++latestIssuesRequest.current;
    setSelection({ id, scope });
    setIssuesLoading(true);
    setIssuesError(null);
    try {
      const data = await fetchEscapeRateIssues(id, scope);
      if (requestId === latestIssuesRequest.current) setIssues(data.issues);
    } catch (err) {
      if (requestId === latestIssuesRequest.current) setIssuesError(err.message);
    } finally {
      if (requestId === latestIssuesRequest.current) setIssuesLoading(false);
    }
  }, []);

  function clearSelection() {
    latestIssuesRequest.current++;
    setSelection(null);
    setIssues([]);
    setIssuesError(null);
    setIssuesLoading(false);
  }

  async function handleFormSubmit(values) {
    const editing = form?.entry;
    const data = editing ? await updateEscapeRate(editing.id, values) : await createEscapeRate(values);
    setEntries(data.entries);
    setForm(null);
    setError(null);
    if (editing && selection?.id === editing.id) loadIssues(editing.id, selection.scope);
  }

  async function handleRecompute(entry) {
    setRecomputingId(entry.id);
    setError(null);
    try {
      const data = await recomputeEscapeRate(entry.id);
      setEntries(data.entries);
    } catch (err) {
      setError(`Recompute ${entry.version} failed: ${err.message}`);
    } finally {
      setRecomputingId(null);
    }
  }

  async function handleRecomputeAll() {
    setRecomputingId('all');
    setError(null);
    try {
      const data = await recomputeAllEscapeRates();
      setEntries(data.entries);
    } catch (err) {
      setError(`Recompute all failed: ${err.message}`);
    } finally {
      setRecomputingId(null);
    }
  }

  async function handleDelete(entry) {
    const data = await deleteEscapeRate(entry.id);
    setEntries(data.entries);
    setDeleting(null);
    if (selection?.id === entry.id) clearSelection();
  }

  const selectedEntry = selection ? entries.find((e) => e.id === selection.id) : null;

  return (
    <div>
      <Banner message={error} visible={!!error} />
      <div className="flex flex-col gap-5">
        <EscapeRateTable
          entries={entries}
          loading={loading}
          selection={selection}
          recomputingId={recomputingId}
          onNew={() => setForm({ entry: null })}
          onSelect={(entry, scope) => loadIssues(entry.id, scope)}
          onEdit={(entry) => setForm({ entry })}
          onRecompute={handleRecompute}
          onRecomputeAll={handleRecomputeAll}
          onDelete={setDeleting}
        />
        <EscapeRateIssuesTable
          entry={selectedEntry}
          scope={selection?.scope}
          issues={issues}
          loading={issuesLoading}
          error={issuesError}
        />
      </div>

      <EscapeRateFormModal
        open={!!form}
        entry={form?.entry ?? null}
        onClose={() => setForm(null)}
        onSubmit={handleFormSubmit}
      />
      <ConfirmDeleteModal entry={deleting} onClose={() => setDeleting(null)} onConfirm={handleDelete} />
    </div>
  );
}
