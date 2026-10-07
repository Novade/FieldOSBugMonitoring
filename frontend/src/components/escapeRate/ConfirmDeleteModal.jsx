import { useEffect, useState } from 'react';
import { Modal } from '../common/Modal';
import { Banner } from '../common/Banner';
import { btnDanger, btnSecondary } from './styles';

export function ConfirmDeleteModal({ entry, onClose, onConfirm }) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setDeleting(false);
    setError(null);
  }, [entry]);

  async function handleConfirm() {
    setDeleting(true);
    setError(null);
    try {
      await onConfirm(entry);
    } catch (err) {
      setError(err.message);
      setDeleting(false);
    }
  }

  return (
    <Modal
      open={!!entry}
      title={`Delete escape rate ${entry?.version ?? ''}?`}
      onClose={onClose}
      busy={deleting}
      footer={
        <>
          <button type="button" className={btnSecondary} onClick={onClose} disabled={deleting}>
            Cancel
          </button>
          <button type="button" className={btnDanger} onClick={handleConfirm} disabled={deleting}>
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </>
      }
    >
      <Banner message={error} visible={!!error} />
      <p className="text-[13px] text-[#5a6075]">This removes the entry from the Escape Rate table. Jira bugs are not affected.</p>
    </Modal>
  );
}
