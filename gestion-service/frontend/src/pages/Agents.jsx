import { useEffect, useState } from 'react';
import Toast, { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { agentService } from '../services/api';

const serviceOptions = ['Opérations', 'Accueil', 'Maintenance', 'Sécurité', 'Autre'];

const initialForm = {
  matricule: '',
  nom: '',
  prenom: '',
  poste: '',
  service: '',
  telephone: '',
  date_embauche: '',
  statut: 'actif'
};

const statusClasses = {
  actif: 'bg-green-100 text-green-800',
  conge: 'bg-yellow-100 text-yellow-800',
  suspendu: 'bg-red-100 text-red-800'
};

const AgentModal = ({
  mode,
  isOpen,
  formData,
  errors,
  loading,
  onClose,
  onChange,
  onSubmit
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl" onClick={(event) => event.stopPropagation()}>
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              {mode === 'create' ? 'Ajouter un agent' : "Modifier l'agent"}
            </h3>
            <p className="mt-1 text-sm text-gray-500">Les champs marqués d&apos;un * sont obligatoires.</p>
          </div>
          <button type="button" onClick={onClose} className="text-2xl leading-none text-gray-400">
            ×
          </button>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Matricule *</label>
              <input
                name="matricule"
                value={formData.matricule}
                onChange={onChange}
                className={`w-full rounded-md border px-3 py-2 outline-none focus:ring-2 ${
                  errors.matricule ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                }`}
              />
              {errors.matricule && <p className="mt-1 text-sm text-red-600">{errors.matricule}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
              <select
                name="statut"
                value={formData.statut}
                onChange={onChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              >
                <option value="actif">actif</option>
                <option value="conge">conge</option>
                <option value="suspendu">suspendu</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
              <input
                name="nom"
                value={formData.nom}
                onChange={onChange}
                className={`w-full rounded-md border px-3 py-2 outline-none focus:ring-2 ${
                  errors.nom ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                }`}
              />
              {errors.nom && <p className="mt-1 text-sm text-red-600">{errors.nom}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
              <input
                name="prenom"
                value={formData.prenom}
                onChange={onChange}
                className={`w-full rounded-md border px-3 py-2 outline-none focus:ring-2 ${
                  errors.prenom ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                }`}
              />
              {errors.prenom && <p className="mt-1 text-sm text-red-600">{errors.prenom}</p>}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Poste</label>
              <input
                name="poste"
                value={formData.poste}
                onChange={onChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
              <select
                name="service"
                value={formData.service}
                onChange={onChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sélectionner</option>
                {serviceOptions.map((service) => (
                  <option key={service} value={service}>
                    {service}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
              <input
                name="telephone"
                value={formData.telephone}
                onChange={onChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date d&apos;embauche</label>
              <input
                name="date_embauche"
                type="date"
                value={formData.date_embauche || ''}
                onChange={onChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 transition hover:bg-gray-50">
              Annuler
            </button>
            <button type="submit" disabled={loading} className="rounded-md bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700">
              {loading ? 'Enregistrement...' : mode === 'create' ? 'Ajouter' : 'Mettre à jour'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DeleteModal = ({ agent, isOpen, loading, onClose, onConfirm }) => {
  if (!isOpen || !agent) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl" onClick={(event) => event.stopPropagation()}>
        <h3 className="text-xl font-semibold text-gray-900">Confirmation de suppression</h3>
        <p className="mt-4 text-gray-700">
          Êtes-vous sûr de vouloir supprimer {agent.nom} {agent.prenom} ?
        </p>
        <p className="mt-2 text-sm font-medium text-red-600">Cette action est irréversible.</p>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 transition hover:bg-gray-50">
            Annuler
          </button>
          <button type="button" onClick={onConfirm} disabled={loading} className="rounded-md bg-red-600 px-4 py-2 text-white transition hover:bg-red-700">
            {loading ? 'Suppression...' : 'Supprimer'}
          </button>
        </div>
      </div>
    </div>
  );
};

const Agents = () => {
  const { user } = useAuth();
  const { toast, showToast, hideToast } = useToast();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ search: '', service: '', statut: '', limit: 10 });
  const [searchInput, setSearchInput] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [formMode, setFormMode] = useState('create');
  const [formData, setFormData] = useState(initialForm);
  const [errors, setErrors] = useState({});

  const canManage = user && ['admin', 'superviseur'].includes(user.role);
  const canDelete = user?.role === 'admin';

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setFilters((current) => ({ ...current, search: searchInput }));
      setPage(1);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const fetchAgents = async () => {
      setLoading(true);

      try {
        const result = await agentService.getAll({
          ...filters,
          page
        });

        setAgents(result.data);
        setPages(result.pages);
        setTotal(result.total);
      } catch (requestError) {
        showToast(requestError.response?.data?.message || 'Erreur lors du chargement des agents', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
  }, [filters, page]);

  const resetForm = () => {
    setFormData(initialForm);
    setErrors({});
    setSelectedAgent(null);
  };

  const openCreateModal = () => {
    resetForm();
    setFormMode('create');
    setModalOpen(true);
  };

  const openEditModal = (agent) => {
    setSelectedAgent(agent);
    setFormMode('edit');
    setErrors({});
    setFormData({
      matricule: agent.matricule || '',
      nom: agent.nom || '',
      prenom: agent.prenom || '',
      poste: agent.poste || '',
      service: agent.service || '',
      telephone: agent.telephone || '',
      date_embauche: agent.date_embauche ? String(agent.date_embauche).slice(0, 10) : '',
      statut: agent.statut || 'actif'
    });
    setModalOpen(true);
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!formData.matricule.trim()) {
      nextErrors.matricule = 'Le matricule est requis';
    }

    if (!formData.nom.trim()) {
      nextErrors.nom = 'Le nom est requis';
    }

    if (!formData.prenom.trim()) {
      nextErrors.prenom = 'Le prénom est requis';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        poste: formData.poste || null,
        service: formData.service || null,
        telephone: formData.telephone || null,
        date_embauche: formData.date_embauche || null
      };

      if (formMode === 'create') {
        await agentService.create(payload);
        showToast('Agent ajouté avec succès');
      } else {
        await agentService.update(selectedAgent.id, payload);
        showToast('Agent mis à jour avec succès');
      }

      setModalOpen(false);
      resetForm();

      const result = await agentService.getAll({ ...filters, page });
      setAgents(result.data);
      setPages(result.pages);
      setTotal(result.total);
    } catch (requestError) {
      showToast(requestError.response?.data?.message || 'Opération impossible', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedAgent) {
      return;
    }

    setDeleting(true);

    try {
      await agentService.delete(selectedAgent.id);
      showToast('Agent supprimé avec succès');
      setDeleteModalOpen(false);
      setSelectedAgent(null);
      const targetPage = agents.length === 1 && page > 1 ? page - 1 : page;
      setPage(targetPage);
      const result = await agentService.getAll({ ...filters, page: targetPage });
      setAgents(result.data);
      setPages(result.pages);
      setTotal(result.total);
    } catch (requestError) {
      showToast(requestError.response?.data?.message || 'Suppression impossible', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const rangeStart = total === 0 ? 0 : (page - 1) * filters.limit + 1;
  const rangeEnd = Math.min(page * filters.limit, total);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Agents</h1>
          <p className="mt-1 text-sm text-gray-500">Suivi des agents et de leurs affectations.</p>
        </div>
        {canManage && (
          <button type="button" onClick={openCreateModal} className="rounded-md bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700">
            Ajouter un agent
          </button>
        )}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Recherche</label>
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Nom, prénom ou matricule"
              className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
            <select
              value={filters.service}
              onChange={(event) => {
                setFilters((current) => ({ ...current, service: event.target.value }));
                setPage(1);
              }}
              className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous</option>
              {serviceOptions.map((service) => (
                <option key={service} value={service}>
                  {service}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
            <select
              value={filters.statut}
              onChange={(event) => {
                setFilters((current) => ({ ...current, statut: event.target.value }));
                setPage(1);
              }}
              className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous</option>
              <option value="actif">actif</option>
              <option value="conge">conge</option>
              <option value="suspendu">suspendu</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Matricule</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Nom</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Prénom</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Poste</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Service</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Statut</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-4 py-10 text-center text-gray-500">
                    Chargement des agents...
                  </td>
                </tr>
              ) : agents.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-10 text-center text-gray-500">
                    Aucun agent trouvé pour ces critères.
                  </td>
                </tr>
              ) : (
                agents.map((agent, index) => (
                  <tr key={agent.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-50`}>
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">{agent.matricule}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{agent.nom}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{agent.prenom}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{agent.poste || '-'}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{agent.service || '-'}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[agent.statut] || 'bg-gray-100 text-gray-800'}`}>
                        {agent.statut}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                      <div className="flex justify-end gap-2">
                        {canManage && (
                          <button type="button" onClick={() => openEditModal(agent)} className="rounded-md p-2 text-blue-600 transition hover:bg-blue-50">
                            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2">
                              <path d="M4 20h4l10-10-4-4L4 16v4zM14 6l4 4" />
                            </svg>
                          </button>
                        )}
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAgent(agent);
                              setDeleteModalOpen(true);
                            }}
                            className="rounded-md p-2 text-red-600 transition hover:bg-red-50"
                          >
                            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2">
                              <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-4 border-t border-gray-200 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-gray-600">
            {rangeStart} à {rangeEnd} sur {total} agents
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(current - 1, 1))}
              disabled={page === 1}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50"
            >
              Previous
            </button>
            {Array.from({ length: pages }, (_, index) => index + 1).map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                onClick={() => setPage(pageNumber)}
                className={`rounded-md px-3 py-2 text-sm ${
                  pageNumber === page ? 'bg-blue-600 text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {pageNumber}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(current + 1, pages))}
              disabled={page === pages}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <AgentModal
        mode={formMode}
        isOpen={modalOpen}
        formData={formData}
        errors={errors}
        loading={submitting}
        onClose={() => setModalOpen(false)}
        onChange={(event) => setFormData((current) => ({ ...current, [event.target.name]: event.target.value }))}
        onSubmit={handleSubmit}
      />

      <DeleteModal
        agent={selectedAgent}
        isOpen={deleteModalOpen}
        loading={deleting}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedAgent(null);
        }}
        onConfirm={handleDelete}
      />

      {toast.show && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  );
};

export default Agents;
