import { useEffect, useState } from 'react';
import Toast, { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { agentService, elementVariableService } from '../services/api';

const monthOptions = [
  { value: 1, label: 'Janvier' },
  { value: 2, label: 'Février' },
  { value: 3, label: 'Mars' },
  { value: 4, label: 'Avril' },
  { value: 5, label: 'Mai' },
  { value: 6, label: 'Juin' },
  { value: 7, label: 'Juillet' },
  { value: 8, label: 'Août' },
  { value: 9, label: 'Septembre' },
  { value: 10, label: 'Octobre' },
  { value: 11, label: 'Novembre' },
  { value: 12, label: 'Décembre' }
];

const initialForm = {
  agent_id: '',
  heures_supplementaires: 0,
  jours_absence: 0,
  motif_absence: '',
  jours_conge: 0,
  prime_rendement: 0,
  indemnite_transport: 0,
  autres_primes: 0
};

const toCurrency = (value) => `${Number(value || 0).toFixed(2)} MAD`;

const RecordModal = ({
  isOpen,
  mode,
  selectedMonth,
  selectedYear,
  agents,
  formData,
  record,
  isReadOnly,
  loading,
  onClose,
  onChange,
  onSubmit
}) => {
  if (!isOpen) {
    return null;
  }

  const totalPrimes =
    Number(formData.prime_rendement || 0) +
    Number(formData.indemnite_transport || 0) +
    Number(formData.autres_primes || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl" onClick={(event) => event.stopPropagation()}>
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              {mode === 'create' ? 'Saisir les éléments variables' : 'Modifier'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Période {selectedMonth}/{selectedYear}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-2xl leading-none text-gray-400">
            ×
          </button>
        </div>

        {isReadOnly ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="font-medium text-gray-900">
                {record?.nom} {record?.prenom} ({record?.matricule})
              </p>
              <p className="mt-2 text-sm text-gray-600">Heures supplémentaires: {record?.heures_supplementaires}</p>
              <p className="text-sm text-gray-600">Jours d&apos;absence: {record?.jours_absence}</p>
              <p className="text-sm text-gray-600">Motif: {record?.motif_absence || '-'}</p>
              <p className="text-sm text-gray-600">Jours de congé: {record?.jours_conge}</p>
              <p className="text-sm text-gray-600">Prime de rendement: {toCurrency(record?.prime_rendement)}</p>
              <p className="text-sm text-gray-600">Indemnité transport: {toCurrency(record?.indemnite_transport)}</p>
              <p className="text-sm text-gray-600">Autres primes: {toCurrency(record?.autres_primes)}</p>
              <p className="mt-2 text-sm font-semibold text-blue-800">Total primes: {toCurrency(record?.total_primes)}</p>
            </div>
            <div className="flex justify-end">
              <button type="button" onClick={onClose} className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 transition hover:bg-gray-50">
                Fermer
              </button>
            </div>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={onSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Agent</label>
              <select
                name="agent_id"
                value={formData.agent_id}
                onChange={onChange}
                disabled={mode === 'edit'}
                className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Sélectionner</option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.matricule} - {agent.prenom} {agent.nom}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mois</label>
                <input
                  value={selectedMonth}
                  readOnly
                  className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Année</label>
                <input
                  value={selectedYear}
                  readOnly
                  className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-gray-500"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Heures supplémentaires</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  name="heures_supplementaires"
                  value={formData.heures_supplementaires}
                  onChange={onChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jours d&apos;absence</label>
                <input
                  type="number"
                  min="0"
                  name="jours_absence"
                  value={formData.jours_absence}
                  onChange={onChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Motif absence</label>
              <input
                name="motif_absence"
                value={formData.motif_absence}
                onChange={onChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jours de congé</label>
                <input
                  type="number"
                  min="0"
                  name="jours_conge"
                  value={formData.jours_conge}
                  onChange={onChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prime de rendement</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  name="prime_rendement"
                  value={formData.prime_rendement}
                  onChange={onChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Indemnité transport</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  name="indemnite_transport"
                  value={formData.indemnite_transport}
                  onChange={onChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Autres primes</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  name="autres_primes"
                  value={formData.autres_primes}
                  onChange={onChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="rounded-lg bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800">
              Total primes: {toCurrency(totalPrimes)}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={onClose} className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 transition hover:bg-gray-50">
                Annuler
              </button>
              <button type="submit" disabled={loading} className="rounded-md bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700">
                {loading ? 'Enregistrement...' : mode === 'create' ? 'Ajouter' : 'Mettre à jour'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

const ValidationModal = ({ isOpen, record, loading, onClose, onConfirm }) => {
  if (!isOpen || !record) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl" onClick={(event) => event.stopPropagation()}>
        <h3 className="text-xl font-semibold text-gray-900">Valider les éléments</h3>
        <p className="mt-4 text-gray-700">
          Valider les éléments de {record.nom} {record.prenom} pour {record.mois}/{record.annee} ?
        </p>
        <p className="mt-2 text-sm font-medium text-green-700">Cette action ne peut pas être annulée.</p>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 transition hover:bg-gray-50">
            Annuler
          </button>
          <button type="button" onClick={onConfirm} disabled={loading} className="rounded-md bg-green-600 px-4 py-2 text-white transition hover:bg-green-700">
            {loading ? 'Validation...' : 'Valider'}
          </button>
        </div>
      </div>
    </div>
  );
};

const ElementsVariables = () => {
  const { user } = useAuth();
  const { toast, showToast, hideToast } = useToast();
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState({
    heures_supplementaires: 0,
    jours_absence: 0,
    jours_conge: 0,
    prime_rendement: 0,
    indemnite_transport: 0,
    autres_primes: 0,
    total_primes: 0
  });
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [validationOpen, setValidationOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [formData, setFormData] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);

  const canManage = user && ['admin', 'superviseur'].includes(user.role);
  const isAdmin = user?.role === 'admin';

  const fetchData = async () => {
    setLoading(true);

    try {
      const [recapResult, agentsResult] = await Promise.all([
        elementVariableService.getRecap(selectedMonth, selectedYear),
        agentService.getAll({ limit: 100, statut: 'actif' })
      ]);

      setRecords((recapResult.data || []).filter((item) => item.id));
      setSummary(recapResult.summary || {});
      setAgents(agentsResult.data || []);
    } catch (requestError) {
      showToast(requestError.response?.data?.message || 'Impossible de charger les éléments variables', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear]);

  const openCreateModal = () => {
    setSelectedRecord(null);
    setModalMode('create');
    setFormData({
      ...initialForm,
      agent_id: agents[0]?.id || ''
    });
    setModalOpen(true);
  };

  const openEditModal = (record) => {
    setSelectedRecord(record);
    setModalMode('edit');
    setFormData({
      agent_id: record.agent_id,
      heures_supplementaires: record.heures_supplementaires,
      jours_absence: record.jours_absence,
      motif_absence: record.motif_absence || '',
      jours_conge: record.jours_conge,
      prime_rendement: record.prime_rendement,
      indemnite_transport: record.indemnite_transport,
      autres_primes: record.autres_primes
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedRecord(null);
    setFormData(initialForm);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        agent_id: Number(formData.agent_id),
        mois: selectedMonth,
        annee: selectedYear
      };

      if (modalMode === 'create') {
        await elementVariableService.create(payload);
        showToast('Éléments variables ajoutés avec succès');
      } else {
        await elementVariableService.update(selectedRecord.id, payload);
        showToast('Éléments variables mis à jour avec succès');
      }

      closeModal();
      await fetchData();
    } catch (requestError) {
      showToast(requestError.response?.data?.message || 'Opération impossible', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (recordId) => {
    if (!window.confirm('Confirmer la suppression de cet enregistrement ?')) {
      return;
    }

    setSubmitting(true);

    try {
      await elementVariableService.delete(recordId);
      showToast('Enregistrement supprimé avec succès');
      await fetchData();
    } catch (requestError) {
      showToast(requestError.response?.data?.message || 'Suppression impossible', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleValidate = async () => {
    if (!selectedRecord) {
      return;
    }

    setSubmitting(true);

    try {
      await elementVariableService.valider(selectedRecord.id);
      showToast('Éléments variables validés');
      setValidationOpen(false);
      setSelectedRecord(null);
      await fetchData();
    } catch (requestError) {
      showToast(requestError.response?.data?.message || 'Validation impossible', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const isReadOnly = Boolean(selectedRecord?.valide && !isAdmin);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Éléments Variables</h1>
            <p className="mt-1 text-sm text-gray-500">Gestion mensuelle des heures, absences et primes.</p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mois</label>
              <select
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(Number(event.target.value))}
                className="rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              >
                {monthOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Année</label>
              <input
                type="number"
                value={selectedYear}
                onChange={(event) => setSelectedYear(Number(event.target.value))}
                className="rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {canManage && (
              <button type="button" onClick={openCreateModal} className="rounded-md bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700">
                Ajouter
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Matricule</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Agent</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">H.Sup</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Absences</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Motif</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Congés</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Prime</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Transport</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Autres</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Total primes</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Statut</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="12" className="px-4 py-10 text-center text-gray-500">
                    Chargement des éléments variables...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan="12" className="px-4 py-10 text-center text-gray-500">
                    Aucun enregistrement pour cette période.
                  </td>
                </tr>
              ) : (
                records.map((record, index) => (
                  <tr key={record.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-50`}>
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">{record.matricule}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{record.prenom} {record.nom}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{record.heures_supplementaires}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{record.jours_absence}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{record.motif_absence || '-'}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{record.jours_conge}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{toCurrency(record.prime_rendement)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{toCurrency(record.indemnite_transport)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{toCurrency(record.autres_primes)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-blue-800">{toCurrency(record.total_primes)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${record.valide ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {record.valide ? 'Validé' : 'En attente'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                      <div className="flex justify-end gap-2">
                        {(canManage && (!record.valide || isAdmin)) && (
                          <button type="button" onClick={() => openEditModal(record)} className="rounded-md border border-blue-200 px-3 py-2 text-blue-700 transition hover:bg-blue-50">
                            Modifier
                          </button>
                        )}
                        {canManage && !record.valide && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRecord(record);
                              setValidationOpen(true);
                            }}
                            className="rounded-md border border-green-200 px-3 py-2 text-green-700 transition hover:bg-green-50"
                          >
                            Valider
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => handleDelete(record.id)}
                            className="rounded-md border border-red-200 px-3 py-2 text-red-700 transition hover:bg-red-50"
                          >
                            Supprimer
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}

              {!loading && records.length > 0 && (
                <tr className="bg-blue-50">
                  <td className="px-4 py-3 text-sm font-bold text-blue-900" colSpan="2">
                    TOTAUX
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-blue-900">{Number(summary.heures_supplementaires || 0).toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm font-bold text-blue-900">{summary.jours_absence || 0}</td>
                  <td className="px-4 py-3 text-sm font-bold text-blue-900">-</td>
                  <td className="px-4 py-3 text-sm font-bold text-blue-900">{summary.jours_conge || 0}</td>
                  <td className="px-4 py-3 text-sm font-bold text-blue-900">{toCurrency(summary.prime_rendement)}</td>
                  <td className="px-4 py-3 text-sm font-bold text-blue-900">{toCurrency(summary.indemnite_transport)}</td>
                  <td className="px-4 py-3 text-sm font-bold text-blue-900">{toCurrency(summary.autres_primes)}</td>
                  <td className="px-4 py-3 text-sm font-bold text-blue-900">{toCurrency(summary.total_primes)}</td>
                  <td className="px-4 py-3 text-sm font-bold text-blue-900">-</td>
                  <td className="px-4 py-3 text-sm font-bold text-blue-900">-</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <RecordModal
        isOpen={modalOpen}
        mode={modalMode}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        agents={agents}
        formData={formData}
        record={selectedRecord}
        isReadOnly={isReadOnly}
        loading={submitting}
        onClose={closeModal}
        onChange={(event) => setFormData((current) => ({ ...current, [event.target.name]: event.target.value }))}
        onSubmit={handleSubmit}
      />

      <ValidationModal
        isOpen={validationOpen}
        record={selectedRecord}
        loading={submitting}
        onClose={() => {
          setValidationOpen(false);
          setSelectedRecord(null);
        }}
        onConfirm={handleValidate}
      />

      {toast.show && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  );
};

export default ElementsVariables;
