import { useEffect, useState } from 'react';
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { useAuth } from '../context/AuthContext';
import { agentService, elementVariableService, planningService } from '../services/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
);

const monthLabels = ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aout', 'Sep', 'Oct', 'Nov', 'Dec'];

const SkeletonCard = () => (
  <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
    <div className="mb-3 h-4 w-28 animate-pulse rounded bg-gray-200" />
    <div className="h-8 w-20 animate-pulse rounded bg-gray-200" />
  </div>
);

const DashboardCard = ({ title, value, subtitle }) => (
  <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
    <p className="text-sm font-medium text-gray-500">{title}</p>
    <p className="mt-3 text-3xl font-bold text-gray-900">{value}</p>
    <p className="mt-2 text-sm text-gray-500">{subtitle}</p>
  </div>
);

const EmptyMessage = ({ message, tone = 'red' }) => {
  const styles = tone === 'yellow'
    ? 'border-yellow-200 bg-yellow-50 text-yellow-800'
    : 'border-red-200 bg-red-50 text-red-700';

  return <div className={`rounded-lg border p-6 ${styles}`}>{message}</div>;
};

const getDateKey = (value) => String(value).slice(0, 10);

const AgentDashboard = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState({
    agent: null,
    planning: [],
    variables: []
  });

  useEffect(() => {
    const fetchAgentDashboard = async () => {
      setLoading(true);
      setError('');

      try {
        const searchResult = await agentService.getAll({
          search: user.email || `${user.prenom} ${user.nom}`,
          limit: 100
        });

        const agent = (searchResult.data || []).find(
          (item) =>
            (item.email && user.email && item.email.trim().toLowerCase() === user.email.trim().toLowerCase())
            || (
              item.nom?.trim().toLowerCase() === user.nom?.trim().toLowerCase()
              && item.prenom?.trim().toLowerCase() === user.prenom?.trim().toLowerCase()
            )
        );

        if (!agent) {
          throw new Error('Aucun profil agent lié à cet utilisateur. Vérifiez le nom/prénom du compte.');
        }

        const now = new Date();
        const [planningResult, variableResult] = await Promise.all([
          planningService.getByAgent(agent.id, {
            mois: now.getMonth() + 1,
            annee: now.getFullYear()
          }),
          elementVariableService.getByAgent(agent.id)
        ]);

        setDashboardData({
          agent,
          planning: planningResult.data || [],
          variables: variableResult.data || []
        });
      } catch (requestError) {
        setError(requestError.response?.data?.message || requestError.message || 'Impossible de charger votre espace personnel');
      } finally {
        setLoading(false);
      }
    };

    fetchAgentDashboard();
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => <SkeletonCard key={index} />)}
        </div>
      </div>
    );
  }

  if (error) {
    return <EmptyMessage message={error} tone="yellow" />;
  }

  const todayKey = getDateKey(new Date().toISOString());
  const nextShifts = [...dashboardData.planning]
    .filter((item) => getDateKey(item.date_service) >= todayKey)
    .sort((left, right) => new Date(left.date_service) - new Date(right.date_service))
    .slice(0, 5);

  const latestVariable = dashboardData.variables[0];
  const shiftCounts = dashboardData.planning.reduce(
    (accumulator, item) => ({
      ...accumulator,
      [item.type_shift]: (accumulator[item.type_shift] || 0) + 1
    }),
    { matin: 0, soir: 0, nuit: 0, repos: 0 }
  );

  const doughnutData = {
    labels: ['Matin', 'Soir', 'Nuit', 'Repos'],
    datasets: [
      {
        data: [
          shiftCounts.matin || 0,
          shiftCounts.soir || 0,
          shiftCounts.nuit || 0,
          shiftCounts.repos || 0
        ],
        backgroundColor: ['#2563eb', '#f97316', '#7c3aed', '#9ca3af'],
        borderWidth: 0
      }
    ]
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-blue-200 bg-gradient-to-r from-blue-800 to-blue-600 p-6 text-white shadow-sm">
        <h1 className="text-2xl font-bold">Bonjour {user.prenom}</h1>
        <p className="mt-2 text-blue-100">
          Voici votre espace personnel pour suivre votre planning et vos éléments variables.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <DashboardCard title="Mes shifts du mois" value={dashboardData.planning.length} subtitle="Planning personnel du mois en cours" />
        <DashboardCard
          title="Heures sup"
          value={Number(latestVariable?.heures_supplementaires || 0).toFixed(1)}
          subtitle="Dernière période enregistrée"
        />
        <DashboardCard
          title="Absences"
          value={Number(latestVariable?.jours_absence || 0)}
          subtitle="Dernière période enregistrée"
        />
        <DashboardCard
          title="Total primes"
          value={`${Number(latestVariable?.total_primes || 0).toFixed(2)} MAD`}
          subtitle="Dernière période enregistrée"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm xl:col-span-2">
          <h3 className="mb-5 text-lg font-semibold text-gray-900">Mes prochains shifts</h3>
          <div className="space-y-3">
            {nextShifts.length === 0 ? (
              <p className="text-sm text-gray-500">Aucun shift à venir pour le moment.</p>
            ) : (
              nextShifts.map((shift) => (
                <div key={shift.id} className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
                  <div>
                    <p className="font-medium text-gray-900">
                      {new Date(`${getDateKey(shift.date_service)}T00:00:00`).toLocaleDateString('fr-FR')}
                    </p>
                    <p className="text-sm text-gray-500">
                      {shift.note || 'Aucune note'}
                    </p>
                  </div>
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold capitalize text-blue-800">
                    {shift.type_shift}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-5 text-lg font-semibold text-gray-900">Répartition de mes shifts</h3>
          <div className="h-80">
            <Doughnut
              data={doughnutData}
              options={{
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'bottom' }
                }
              }}
            />
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm xl:col-span-3">
          <h3 className="mb-5 text-lg font-semibold text-gray-900">Mes derniers éléments variables</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Période</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">H.Sup</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Absences</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Congés</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Primes</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {dashboardData.variables.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-sm text-gray-500">
                      Aucun élément variable enregistré.
                    </td>
                  </tr>
                ) : (
                  dashboardData.variables.slice(0, 6).map((item, index) => (
                    <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3 text-sm text-gray-700">{item.mois}/{item.annee}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{item.heures_supplementaires}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{item.jours_absence}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{item.jours_conge}</td>
                      <td className="px-4 py-3 text-sm font-medium text-blue-800">{Number(item.total_primes || 0).toFixed(2)} MAD</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.valide ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {item.valide ? 'Validé' : 'En attente'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const SupervisorDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState({
    agentStats: null,
    planningStats: null,
    recap: null,
    weekPlanning: []
  });

  useEffect(() => {
    const fetchSupervisorDashboard = async () => {
      setLoading(true);
      setError('');

      try {
        const now = new Date();
        const mois = now.getMonth() + 1;
        const annee = now.getFullYear();
        const referenceDate = now.toISOString().slice(0, 10);

        const [agentStats, planningStats, recap, weekPlanning] = await Promise.all([
          agentService.getStats(),
          planningService.getStats(mois, annee),
          elementVariableService.getRecap(mois, annee),
          planningService.getByWeek(referenceDate)
        ]);

        setDashboardData({
          agentStats: agentStats.data,
          planningStats: planningStats.data,
          recap,
          weekPlanning: weekPlanning.data || []
        });
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Impossible de charger le tableau de bord superviseur');
      } finally {
        setLoading(false);
      }
    };

    fetchSupervisorDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => <SkeletonCard key={index} />)}
        </div>
      </div>
    );
  }

  if (error) {
    return <EmptyMessage message={error} />;
  }

  const recapRows = dashboardData.recap?.data || [];
  const recapSummary = dashboardData.recap?.summary || {};
  const pendingValidations = recapRows.filter((item) => item.id && !item.valide).length;
  const activeAgents = dashboardData.agentStats?.byStatut?.actif || 0;
  const currentWeekTotal = dashboardData.planningStats?.currentWeekTotal || 0;
  const absenceCount = recapSummary.jours_absence || 0;

  const serviceMap = dashboardData.weekPlanning.reduce((accumulator, item) => {
    const service = item.agent_service || 'Non affecté';
    accumulator[service] = (accumulator[service] || 0) + 1;
    return accumulator;
  }, {});

  const upcomingWeekShifts = [...dashboardData.weekPlanning]
    .sort((left, right) => {
      const leftKey = `${getDateKey(left.date_service)} ${left.heure_debut || '00:00:00'}`;
      const rightKey = `${getDateKey(right.date_service)} ${right.heure_debut || '00:00:00'}`;
      return leftKey.localeCompare(rightKey);
    })
    .slice(0, 8);

  const barData = {
    labels: Object.keys(serviceMap),
    datasets: [
      {
        label: 'Shifts de la semaine',
        data: Object.values(serviceMap),
        backgroundColor: '#1d4ed8',
        borderRadius: 8
      }
    ]
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-blue-200 bg-gradient-to-r from-sky-800 to-blue-700 p-6 text-white shadow-sm">
        <h1 className="text-2xl font-bold">Vue Supervision</h1>
        <p className="mt-2 text-blue-100">
          Suivi opérationnel des équipes, du planning hebdomadaire et des validations en attente.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <DashboardCard title="Agents actifs" value={activeAgents} subtitle="Effectif disponible" />
        <DashboardCard title="Shifts semaine" value={currentWeekTotal} subtitle="Planning hebdomadaire" />
        <DashboardCard title="Absences du mois" value={absenceCount} subtitle="Suivi mensuel des absences" />
        <DashboardCard title="Validations en attente" value={pendingValidations} subtitle="Éléments variables à traiter" />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm xl:col-span-2">
          <h3 className="mb-5 text-lg font-semibold text-gray-900">Charge par service cette semaine</h3>
          <div className="h-80">
            <Bar
              data={barData}
              options={{
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
              }}
            />
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-5 text-lg font-semibold text-gray-900">Répartition mensuelle des shifts</h3>
          <div className="space-y-4">
            {['matin', 'soir', 'nuit', 'repos'].map((type) => (
              <div key={type}>
                <div className="mb-1 flex items-center justify-between text-sm text-gray-600">
                  <span className="capitalize">{type}</span>
                  <span>{dashboardData.planningStats?.byTypeShift?.[type] || 0}</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100">
                  <div
                    className="h-2 rounded-full bg-blue-600"
                    style={{
                      width: `${dashboardData.planningStats?.totalShifts
                        ? ((dashboardData.planningStats.byTypeShift?.[type] || 0) / dashboardData.planningStats.totalShifts) * 100
                        : 0}%`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm xl:col-span-3">
          <h3 className="mb-5 text-lg font-semibold text-gray-900">Prochains shifts planifiés</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Agent</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Service</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Shift</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {upcomingWeekShifts.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-4 py-8 text-center text-sm text-gray-500">
                      Aucun shift planifié cette semaine.
                    </td>
                  </tr>
                ) : (
                  upcomingWeekShifts.map((item, index) => (
                    <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {new Date(`${getDateKey(item.date_service)}T00:00:00`).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {item.agent_prenom} {item.agent_nom}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{item.agent_service || 'Non affecté'}</td>
                      <td className="px-4 py-3 text-sm font-medium capitalize text-blue-800">{item.type_shift}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState({
    agentStats: null,
    planningStats: null,
    recap: null,
    lineTrend: []
  });

  useEffect(() => {
    if (user?.role !== 'admin') {
      setLoading(false);
      return undefined;
    }

    const fetchDashboard = async () => {
      setLoading(true);
      setError('');

      try {
        const now = new Date();
        const mois = now.getMonth() + 1;
        const annee = now.getFullYear();

        const [agentStats, planningStats, recap] = await Promise.all([
          agentService.getStats(),
          planningService.getStats(mois, annee),
          elementVariableService.getRecap(mois, annee)
        ]);

        const trendRequests = [];

        for (let index = 5; index >= 0; index -= 1) {
          const referenceDate = new Date(annee, mois - 1 - index, 1);
          trendRequests.push(
            elementVariableService.getRecap(referenceDate.getMonth() + 1, referenceDate.getFullYear())
              .then((result) => ({
                label: `${monthLabels[referenceDate.getMonth()]} ${referenceDate.getFullYear()}`,
                total: Number(result.summary?.heures_supplementaires || 0)
              }))
          );
        }

        const lineTrend = await Promise.all(trendRequests);

        setDashboardData({
          agentStats: agentStats.data,
          planningStats: planningStats.data,
          recap,
          lineTrend
        });
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Impossible de charger le tableau de bord');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
    return undefined;
  }, [user]);

  if (user?.role === 'agent') {
    return <AgentDashboard user={user} />;
  }

  if (user?.role === 'superviseur') {
    return <SupervisorDashboard />;
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
        <div className="grid gap-6 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-5 h-5 w-40 animate-pulse rounded bg-gray-200" />
              <div className="h-64 animate-pulse rounded bg-gray-100" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <EmptyMessage message={error} />;
  }

  const agentStats = dashboardData.agentStats || { byStatut: {}, byService: [] };
  const planningStats = dashboardData.planningStats || { byTypeShift: {}, byService: [], currentWeekTotal: 0 };
  const recapSummary = dashboardData.recap?.summary || {};

  const barData = {
    labels: planningStats.byService.map((item) => item.service),
    datasets: [
      {
        label: 'Shifts',
        data: planningStats.byService.map((item) => item.total),
        backgroundColor: '#1d4ed8',
        borderRadius: 8
      }
    ]
  };

  const doughnutData = {
    labels: ['Matin', 'Soir', 'Nuit', 'Repos'],
    datasets: [
      {
        data: [
          planningStats.byTypeShift?.matin || 0,
          planningStats.byTypeShift?.soir || 0,
          planningStats.byTypeShift?.nuit || 0,
          planningStats.byTypeShift?.repos || 0
        ],
        backgroundColor: ['#2563eb', '#f97316', '#7c3aed', '#9ca3af'],
        borderWidth: 0
      }
    ]
  };

  const lineData = {
    labels: dashboardData.lineTrend.map((item) => item.label),
    datasets: [
      {
        label: 'Heures supplémentaires',
        data: dashboardData.lineTrend.map((item) => item.total),
        borderColor: '#1d4ed8',
        backgroundColor: 'rgba(37, 99, 235, 0.15)',
        fill: true,
        tension: 0.35
      }
    ]
  };

  const metrics = [
    {
      title: 'Agents actifs',
      value: agentStats.byStatut?.actif || 0,
      subtitle: `${agentStats.total || 0} agents au total`
    },
    {
      title: 'Shifts cette semaine',
      value: planningStats.currentWeekTotal || 0,
      subtitle: `${planningStats.totalShifts || 0} shifts ce mois`
    },
    {
      title: 'Absences ce mois',
      value: recapSummary.jours_absence || 0,
      subtitle: 'Cumul mensuel'
    },
    {
      title: 'Heures sup ce mois',
      value: Number(recapSummary.heures_supplementaires || 0).toFixed(1),
      subtitle: 'Total mensuel'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <DashboardCard key={metric.title} title={metric.title} value={metric.value} subtitle={metric.subtitle} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm xl:col-span-2">
          <h3 className="mb-5 text-lg font-semibold text-gray-900">Présences par service ce mois</h3>
          <div className="h-80">
            <Bar
              data={barData}
              options={{
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
              }}
            />
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-5 text-lg font-semibold text-gray-900">Répartition des shifts</h3>
          <div className="h-80">
            <Doughnut
              data={doughnutData}
              options={{
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'bottom' }
                }
              }}
            />
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm xl:col-span-3">
          <h3 className="mb-5 text-lg font-semibold text-gray-900">Heures supplémentaires</h3>
          <div className="h-80">
            <Line
              data={lineData}
              options={{
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  y: { beginAtZero: true }
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
