import { useEffect, useState } from 'react';
import { Modal } from '../common/Modal';
import { Banner } from '../common/Banner';
import { btnPrimary, btnSecondary, input } from './styles';

const EMPTY = { version: '', prodFrom: '', prodTo: '', testFrom: '', testTo: '' };

function validate(form) {
  if (!form.version.trim()) return 'Version is required.';
  if (!form.testFrom || !form.testTo) return 'Bugs during testing: both dates are required.';
  if (!form.prodFrom || !form.prodTo) return 'Bugs after prod: both dates are required.';
  if (form.testFrom > form.testTo) return 'Bugs during testing: Date from must be on or before Date to.';
  if (form.prodFrom > form.prodTo) return 'Bugs after prod: Date from must be on or before Date to.';
  return null;
}

function DateRange({ label, hint, fromKey, toKey, form, onChange, disabled }) {
  return (
    <fieldset className="mb-4">
      <legend className="text-[13px] font-semibold text-[#1a2332]">{label}</legend>
      <div className="text-[12px] text-[#8896b0] mb-2">{hint}</div>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="block text-[12px] text-[#6b7a99] mb-1">Date from</span>
          <input type="date" className={input} value={form[fromKey]} max={form[toKey] || undefined}
            onChange={(e) => onChange(fromKey, e.target.value)} disabled={disabled} />
        </label>
        <label className="block">
          <span className="block text-[12px] text-[#6b7a99] mb-1">Date to</span>
          <input type="date" className={input} value={form[toKey]} min={form[fromKey] || undefined}
            onChange={(e) => onChange(toKey, e.target.value)} disabled={disabled} />
        </label>
      </div>
    </fieldset>
  );
}

export function EscapeRateFormModal({ open, entry, onClose, onSubmit }) {
  const isEdit = !!entry;
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(entry ? { version: entry.version, prodFrom: entry.prodFrom, prodTo: entry.prodTo, testFrom: entry.testFrom, testTo: entry.testTo } : EMPTY);
    setError(null);
    setSaving(false);
  }, [open, entry]);

  // Testing ends on the prod deploy day, which is also where "after prod" starts
  // (the QA-BUG label keeps the two counts apart). So prod "Date from" follows
  // testing "Date to" while it's empty or still in sync; once edited by hand it stays.
  function handleChange(key, value) {
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (key === 'testTo' && (!f.prodFrom || f.prodFrom === f.testTo)) next.prodFrom = value;
      return next;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const problem = validate(form);
    if (problem) {
      setError(problem);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSubmit({ ...form, version: form.version.trim() });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      title={isEdit ? `Edit escape rate ${entry.version}` : 'New escape rate'}
      onClose={onClose}
      busy={saving}
      footer={
        <>
          <button type="button" className={btnSecondary} onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" form="escape-rate-form" className={btnPrimary} disabled={saving}>
            {saving && <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {saving ? 'Computing…' : 'Save'}
          </button>
        </>
      }
    >
      <form id="escape-rate-form" onSubmit={handleSubmit} noValidate>
        <Banner message={error} visible={!!error} />
        <label className="block mb-4">
          <span className="block text-[13px] font-semibold text-[#1a2332] mb-1">Version</span>
          <input type="text" className={input} placeholder="e.g. v2.76.0" value={form.version}
            onChange={(e) => handleChange('version', e.target.value)} disabled={saving} autoFocus />
        </label>
        <DateRange
          label="Bugs during testing"
          hint="From this version's staging deployment to its prod deployment day (bugs labelled QA-BUG)."
          fromKey="testFrom" toKey="testTo" form={form} onChange={handleChange} disabled={saving}
        />
        <DateRange
          label="Bugs after prod"
          hint="From this version's prod deployment day (auto-filled from testing Date to) to the day before the next prod deployment."
          fromKey="prodFrom" toKey="prodTo" form={form} onChange={handleChange} disabled={saving}
        />
        <p className="text-[12px] text-[#8896b0]">
          Bugs labelled no-action-done or cannot-reproduce are excluded. Counts are computed from Jira when you save.
        </p>
      </form>
    </Modal>
  );
}
