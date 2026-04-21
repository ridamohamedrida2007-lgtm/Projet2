import { useEffect, useState } from 'react';
import Toast, { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { agentService, planningService } from '../services/api';

const shiftStyles = {
  matin: 'bg-blue-100 text-blue-800 border-blue-200',
  soir: 'bg-orange-100 text-orange-800 border-orange-200',
  nuit: 'bg-purple-100 text-purple-800 border-purple-200',
  repos: 'bg-gray-100 text-gray-500 border-gray-200'
};

const dayLabels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

const pad = (value) => String(value).padStart(2, '0');
const toIsoDate = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const toFrDate = (value) => new Date(`${value}T00:00:00`).toLocaleDateString('fr-FR');

const getMonday = (date) => {
  const current = new Date(date);
  current.setHours(0, 0, 0, 0);
  const day = current.getDay() || 7;
  current.setDate(current.getDate() - day + 1);
  return current;
};

const getWeekDays = (mondayValue) => {
  const monday = new Date(`${mondayValue}T00:00:00`);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return {
      label: dayLabels[index],
      iso: toIsoDate(date),
      display: date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
    };
  });
};

const ShiftModal = ({
  isOpen,
  mode,
  canManage,
  formData,
  selectedAgent,
  loading,
  onClose,
  onChange,
  onSubmit,
  onDelete
}) => {
  if (!isOpen || !selectedAgent) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl" onClick={(event) => event.stopPropagation()}>
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              {mode === 'create' ? 'Planifier un shift' : 'Modifier le shift'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {selectedAgent.matricule} - {selectedAgent.prenom} {selectedAgent.nom}
            </p>
            <p className="text-sm text-gray-500">{toFrDate(formData.date_service)}</p>
          </div>
          <button type="button" onClick={onClose} className="text-2xl leading-none text-gray-400">
            ×
          </button>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type de shift</label>
            <select
              name="type_shift"
              value={formData.type_shift}
              onChange={onChange}
              disabled={!canManage}
              className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            >
              <option value="matin">matin</option>
              <option value="soir">soir</option>
              <option value="nuit">nuit</option>
              <option value="repos">repos</option>
            </select>
          </div>

          {formData.type_shift !== 'repos' && (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Heure début</label>
                <input
                  type="time"
                  name="heure_debut"
                  value={formData.heure_debut}
                  onChange={onChange}
                  disabled={!canManage}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Heure fin</label>
                <input
                  type="time"
                  name="heure_fin"
                  value={formData.heure_fin}
                  onChange={onChange}
                  disabled={!canManage}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
            <textarea
              rows="4"
              name="note"
              value={formData.note}
              onChange={onChange}
              disabled={!canManage}
              className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              {mode === 'edit' && canManage && (
                <button type="button" onClick={onDelete} className="rounded-md bg-red-600 px-4 py-2 text-white transition hover:bg-red-700">
                  Supprimer
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 transition hover:bg-gray-50">
                Fermer
              </button>
              {canManage && (
                <button type="submit" disabled={loading} className="rounded-md bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700">
                  {loading ? 'Enregistrement...' : mode === 'create' ? 'Ajouter' : 'Mettre à jour'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

const Planning = () => {
  const { user } = useAuth();
  const { toast, showToast, hideToast } = useToast();
  const [agents, setAgents] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [selectedShift, setSelectedShift] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [currentMonday, setCurrentMonday] = useState(toIsoDate(getMonday(new Date())));
  const [formData, setFormData] = useState({
    agent_id: '',
    date_service: '',
    type_shift: 'matin',
    heure_debut: '',
    heure_fin: '',
    note: ''
  });

  const canManage = user && ['admin', 'superviseur'].includes(user.role);
  const weekDays = getWeekDays(currentMonday);

  const fetchPlanning = async () => {
    setLoading(true);

    try {
      const [agentsResult, planningResult] = await Promise.all([
        agentService.getAll({ limit: 100 }),
        planningService.getByWeek(currentMonday)
      ]);

      setAgents(agentsResult.data);
      setShifts(planningResult.data);
    } catch (requestError) {
      showToast(requestError.response?.data?.message || 'Impossible de charger le planning', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlanning();
  }, [currentMonday]);

  const shiftByKey = {};
  shifts.forEach((shift) => {
    shiftByKey[`${shift.agent_id}-${String(shift.date_service).slice(0, 10)}`] = shift;
  });

  const openCreateModal = (agent, date) => {
    if (!canManage) {
      return;
    }

    setSelectedAgent(agent);
    setSelectedShift(null);
    setModalMode('create');
    setFormData({
      agent_id: agent.id,
      date_service: date,
      type_shift: 'matin',
      heure_debut: '',
      heure_fin: '',
      note: ''
    });
    setModalOpen(true);
  };

  const openEditModal = (shift) => {
    const agent = agents.find((item) => item.id === shift.agent_id);
    setSelectedAgent(agent);
    setSelectedShift(shift);
    setModalMode('edit');
    setFormData({
      agent_id: shift.agent_id,
      date_service: String(shift.date_service).slice(0, 10),
      type_shift: shift.type_shift,
      heure_debut: shift.heure_debut ? String(shift.heure_debut).slice(0, 5) : '',
      heure_fin: shift.heure_fin ? String(shift.heure_fin).slice(0, 5) : '',
      note: shift.note || ''
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedAgent(null);
    setSelectedShift(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        heure_debut: formData.type_shift === 'repos' ? null : formData.heure_debut || null,
        heure_fin: formData.type_shift === 'repos' ? null : formData.heure_fin || null,
        note: formData.note || null
      };

      if (modalMode === 'create') {
        await planningService.create(payload);
        showToast('Shift planifié avec succès');
      } else {
        await planningService.update(selectedShift.id, payload);
        showToast('Shift mis à jour avec succès');
      }

      closeModal();
      await fetchPlanning();
    } catch (requestError) {
      if (requestError.response?.status === 409) {
        showToast('Conflit détecté: agent déjà planifié ce jour', 'warning');
      } else {
        showToast(requestError.response?.data?.message || 'Opération impossible', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedShift) {
      return;
    }

    setSubmitting(true);

    try {
      await planningService.delete(selectedShift.id);
      showToast('Shift supprimé avec succès');
      closeModal();
      await fetchPlanning();
    } catch (requestError) {
      showToast(requestError.response?.data?.message || 'Suppression impossible', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const mondayDisplay = toFrDate(weekDays[0].iso);
  const sundayDisplay = toFrDate(weekDays[6].iso);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tableau de Service</h1>
            <p className="mt-1 text-sm text-gray-500">Organisation hebdomadaire des shifts par agent.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                const previous = new Date(`${currentMonday}T00:00:00`);
                previous.setDate(previous.getDate() - 7);
                setCurrentMonday(toIsoDate(previous));
              }}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-50"
            >
              &lt; Précédente
            </button>
            <div className="rounded-md bg-blue-50 px-4 py-2 text-sm font-medium text-blue-800">
              Semaine du {mondayDisplay} au {sundayDisplay}
            </div>
            <button
              type="button"
              onClick={() => {
                const next = new Date(`${currentMonday}T00:00:00`);
                next.setDate(next.getDate() + 7);
                setCurrentMonday(toIsoDate(next));
              }}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-50"
            >
              Suivante &gt;
            </button>
            <button
              type="button"
              onClick={() => setCurrentMonday(toIsoDate(getMonday(new Date())))}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white transition hover:bg-blue-700"
            >
              Semaine actuelle
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="sticky left-0 z-10 bg-gray-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Agent
                </th>
                {weekDays.map((day) => (
                  <th key={day.iso} className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <div>{day.label}</div>
                    <div className="mt-1 text-[11px] font-normal text-gray-400">{day.display}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-4 py-10 text-center text-gray-500">
                    Chargement du planning...
                  </td>
                </tr>
              ) : agents.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-10 text-center text-gray-500">
                    Aucun agent disponible.
                  </td>
                </tr>
              ) : (
                agents.map((agent, index) => (
                  <tr key={agent.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-50`}>
                    <td className="sticky left-0 z-10 whitespace-nowrap bg-inherit px-4 py-4">
                      <div className="font-medium text-gray-900">{agent.matricule}</div>
                      <div className="text-sm text-gray-500">{agent.prenom} {agent.nom}</div>
                    </td>
                    {weekDays.map((day) => {
                      const shift = shiftByKey[`${agent.id}-${day.iso}`];

                      return (
                        <td key={day.iso} className="px-3 py-3 text-center">
                          {shift ? (
                            <button
                              type="button"
                              onClick={() => openEditModal(shift)}
                              disabled={!canManage}
                              className={`w-full rounded-lg border px-3 py-2 text-sm font-medium capitalize ${shiftStyles[shift.type_shift] || shiftStyles.repos}`}
                            >
                              {shift.type_shift}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openCreateModal(agent, day.iso)}
                              disabled={!canManage}
                              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-dashed border-gray-300 text-lg text-gray-400 transition hover:border-blue-400 hover:text-blue-600"
                            >
                              +
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ShiftModal
        isOpen={modalOpen}
        mode={modalMode}
        canManage={canManage}
        formData={formData}
        selectedAgent={selectedAgent}
        loading={submitting}
        onClose={closeModal}
        onChange={(event) => setFormData((current) => ({ ...current, [event.target.name]: event.target.value }))}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
      />

      {toast.show && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  );
};

export default Planning;
