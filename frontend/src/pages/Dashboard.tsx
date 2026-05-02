import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardService } from '../services/dashboardService';
import type { DashboardStats } from '../services/dashboardService';
import type { Task } from '../types';
import { useAuth } from '../context/AuthContext';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Calendar,
  ChevronRight,
  TrendingUp,
  Layout as LayoutIcon,
  ListTodo,
  Users,
  ShieldCheck,
  Zap
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [myTasks, setMyTasks] = useState<Record<string, Task[]>>({});
  const [adminStats, setAdminStats] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsData, tasksData] = await Promise.all([
          dashboardService.getStats(),
          dashboardService.getMyTasks()
        ]);
        setStats(statsData);
        setMyTasks(tasksData);

        // Fetch admin stats if user is ADMIN
        if (user?.role === 'ADMIN') {
          const [aStats, healthData] = await Promise.all([
            dashboardService.getAdminStats(),
            dashboardService.getHealth()
          ]);
          setAdminStats(aStats);
          setHealth(healthData);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4">
        <p className="text-sm text-red-700">{error}</p>
      </div>
    );
  }

  const activeTasksCount = (myTasks['TODO']?.length || 0) + (myTasks['IN_PROGRESS']?.length || 0) + (myTasks['REVIEW']?.length || 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name}!</h1>
          <p className="text-gray-500">Here's what's happening with your projects today.</p>
        </div>
        <div className="hidden sm:block text-sm text-gray-500">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-2xl border border-indigo-100 shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-indigo-800 uppercase tracking-wider">Total Assigned</span>
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-sm">
              <ListTodo size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline">
            <p className="text-4xl font-extrabold text-indigo-900">{stats?.totalTasks || 0}</p>
            <span className="ml-2 text-xs font-semibold text-indigo-600">Tasks</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-white p-6 rounded-2xl border border-green-100 shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-green-800 uppercase tracking-wider">Completion Rate</span>
            <div className="p-2 bg-green-500 text-white rounded-xl shadow-sm">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline">
            <p className="text-4xl font-extrabold text-green-900">{stats?.completionPercentage || 0}%</p>
            <div className="ml-4 flex-1 h-2.5 bg-green-200 rounded-full overflow-hidden shadow-inner">
              <div 
                className="h-full bg-green-500 rounded-full" 
                style={{ width: `${stats?.completionPercentage || 0}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-2xl border border-blue-100 shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-blue-800 uppercase tracking-wider">Due This Week</span>
            <div className="p-2 bg-blue-500 text-white rounded-xl shadow-sm">
              <Calendar size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline">
            <p className="text-4xl font-extrabold text-blue-900">{stats?.dueThisWeekCount || 0}</p>
            <span className="ml-2 text-xs font-semibold text-blue-600">Upcoming</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-white p-6 rounded-2xl border border-red-100 shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-red-800 uppercase tracking-wider">Overdue</span>
            <div className="p-2 bg-red-500 text-white rounded-xl shadow-sm">
              <AlertCircle size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline">
            <p className="text-4xl font-extrabold text-red-600">{stats?.overdueCount || 0}</p>
            <span className="ml-2 text-xs font-semibold text-red-500">Action required</span>
          </div>
        </div>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Tasks List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Active Tasks</h3>
              <span className="px-2.5 py-1 text-xs font-bold bg-indigo-50 text-indigo-700 rounded-full">
                {activeTasksCount} Pending
              </span>
            </div>
            <div className="divide-y divide-gray-100">
              {activeTasksCount === 0 ? (
                <div className="p-12 text-center">
                  <CheckCircle2 size={48} className="mx-auto text-green-200 mb-4" />
                  <p className="text-gray-500 font-medium">All caught up! No active tasks assigned.</p>
                </div>
              ) : (
                ['IN_PROGRESS', 'TODO', 'REVIEW'].flatMap(status => myTasks[status] || []).map(task => (
                  <div key={task.id} className="px-6 py-4 hover:bg-gray-50 transition-colors group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`mt-1 p-1.5 rounded-lg ${
                          task.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-600' :
                          task.status === 'REVIEW' ? 'bg-purple-50 text-purple-600' :
                          'bg-gray-50 text-gray-400'
                        }`}>
                          {task.status === 'IN_PROGRESS' ? <Clock size={16} /> : <ListTodo size={16} />}
                        </div>
                        <div>
                          <Link to={`/projects/${task.projectId}`} className="text-sm font-bold text-gray-900 hover:text-indigo-600 transition-colors">
                            {task.title}
                          </Link>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-gray-500 flex items-center font-medium">
                              <LayoutIcon size={12} className="mr-1" />
                              {task.project?.name}
                            </span>
                            {task.dueDate && (
                              <span className={`text-xs flex items-center font-medium ${
                                new Date(task.dueDate) < new Date() ? 'text-red-500' : 'text-gray-400'
                              }`}>
                                <Calendar size={12} className="mr-1" />
                                {new Date(task.dueDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Link to={`/projects/${task.projectId}`} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                        <ChevronRight size={18} />
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
            {activeTasksCount > 0 && (
              <div className="bg-gray-50 px-6 py-3 border-t border-gray-100">
                <Link to="/tasks" className="text-sm font-bold text-indigo-600 hover:text-indigo-500 flex items-center justify-center">
                  View all tasks <ChevronRight size={16} className="ml-1" />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-6">
          {/* Status Breakdown */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Task Status</h3>
            <div className="space-y-4">
              {['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'].map(status => {
                const count = stats?.statusCounts[status] || 0;
                const total = stats?.totalTasks || 1;
                const percentage = Math.round((count / total) * 100);
                
                return (
                  <div key={status}>
                    <div className="flex justify-between text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">
                      <span>{status.replace('_', ' ')}</span>
                      <span>{count}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          status === 'DONE' ? 'bg-green-500' :
                          status === 'IN_PROGRESS' ? 'bg-blue-500' :
                          status === 'REVIEW' ? 'bg-purple-500' :
                          'bg-gray-300'
                        }`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Info */}
          <div className="bg-indigo-600 rounded-2xl shadow-lg p-6 text-white overflow-hidden relative">
            <div className="relative z-10">
              <h3 className="text-lg font-bold mb-2">Need Help?</h3>
              <p className="text-indigo-100 text-sm mb-4">Check out our documentation or contact your project administrator.</p>
              <button className="bg-white text-indigo-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-50 transition-colors">
                View Guide
              </button>
            </div>
            <div className="absolute top-0 right-0 -mr-8 -mt-8 bg-indigo-500 w-32 h-32 rounded-full opacity-20"></div>
            <div className="absolute bottom-0 left-0 -ml-4 -mb-4 bg-indigo-700 w-24 h-24 rounded-full opacity-20"></div>
          </div>
        </div>
      </div>

      {user?.role === 'ADMIN' && adminStats && (
        <AdminSection stats={adminStats} health={health} />
      )}
    </div>
  );
};

export default Dashboard;

const AdminSection: React.FC<{ stats: any; health: any }> = ({ stats, health }) => (
  <div className="mt-12 space-y-6">
    <div className="flex items-center gap-2 border-b border-gray-200 pb-4">
      <ShieldCheck className="text-indigo-600" size={24} />
      <h2 className="text-xl font-bold text-gray-900">System Administration</h2>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* System Health */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-700">API Health</h3>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
            health?.status === 'OK' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {health?.status || 'Unknown'}
          </span>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">Node Version</span>
            <span className="font-mono font-bold text-indigo-600">{stats?.systemHealth?.nodeVersion}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">Uptime</span>
            <span className="font-bold text-gray-700">{Math.floor(stats?.systemHealth?.uptime / 3600)}h {Math.floor((stats?.systemHealth?.uptime % 3600) / 60)}m</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">Memory</span>
            <span className="font-bold text-gray-700">{Math.round(stats?.systemHealth?.memoryUsage?.rss / 1024 / 1024)}MB RSS</span>
          </div>
        </div>
      </div>

      {/* Global Stats */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
        <h3 className="font-bold text-gray-700 mb-4">Global Network</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100">
            <div className="flex items-center gap-2 text-indigo-600 mb-1">
              <Users size={14} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Users</span>
            </div>
            <p className="text-xl font-black text-indigo-900">{stats?.totalUsers}</p>
          </div>
          <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <Zap size={14} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Projects</span>
            </div>
            <p className="text-xl font-black text-blue-900">{stats?.totalProjects}</p>
          </div>
        </div>
      </div>

      {/* Quick Activity */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <h3 className="font-bold text-gray-700 mb-4">Recent Projects</h3>
        <div className="space-y-3">
          {stats?.recentProjects?.map((p: any) => (
            <div key={p.id} className="flex items-center justify-between text-xs border-b border-gray-50 pb-2 last:border-0 last:pb-0">
              <span className="font-bold text-gray-900 truncate max-w-[120px]">{p.name}</span>
              <span className="text-gray-400">by {p.owner?.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);
