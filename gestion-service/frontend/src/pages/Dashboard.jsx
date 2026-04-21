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

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState({
    agentStats: null,
    planningStats: null,
    recap: null,
    lineTrend: []
  });

  useEffect(() => {
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
  }, []);

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
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">
        {error}
      </div>
    );
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
          <div key={metric.title} className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">{metric.title}</p>
            <p className="mt-3 text-3xl font-bold text-gray-900">{metric.value}</p>
            <p className="mt-2 text-sm text-gray-500">{metric.subtitle}</p>
          </div>
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
