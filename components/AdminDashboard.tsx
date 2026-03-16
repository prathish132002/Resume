import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { GEMINI_FLASH_LITE_COST_PER_1M_TOKENS, AIUsageData } from '../services/aiTrackingService';
import { ArrowLeft, Users, Activity, DollarSign, Database } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface AdminDashboardProps {
  onBack: () => void;
}

interface UserUsage extends AIUsageData {
  userId: string;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack }) => {
  const [loading, setLoading] = useState(true);
  const [usersUsage, setUsersUsage] = useState<UserUsage[]>([]);
  const [totalRequests, setTotalRequests] = useState(0);
  const [totalTokens, setTotalTokens] = useState(0);
  const [dailyData, setDailyData] = useState<{ date: string; requests: number }[]>([]);

  useEffect(() => {
    const fetchUsageData = async () => {
      try {
        const usageRef = collection(db, 'ai_usage');
        const snapshot = await getDocs(usageRef);
        
        let reqs = 0;
        let tokens = 0;
        const usageList: UserUsage[] = [];
        const dailyAgg: Record<string, number> = {};

        snapshot.forEach(doc => {
          const data = doc.data() as AIUsageData;
          reqs += data.totalRequests || 0;
          tokens += data.totalTokensEstimated || 0;
          usageList.push({ ...data, userId: doc.id });

          if (data.dailyUsage) {
            Object.entries(data.dailyUsage).forEach(([date, count]) => {
              dailyAgg[date] = (dailyAgg[date] || 0) + count;
            });
          }
        });

        setTotalRequests(reqs);
        setTotalTokens(tokens);
        
        // Sort users by usage
        usageList.sort((a, b) => (b.totalRequests || 0) - (a.totalRequests || 0));
        setUsersUsage(usageList);

        // Prepare chart data (last 30 days)
        const chartData = Object.entries(dailyAgg)
          .map(([date, requests]) => ({ date, requests }))
          .sort((a, b) => a.date.localeCompare(b.date))
          .slice(-30);
        
        setDailyData(chartData);
      } catch (error) {
        console.error("Error fetching admin data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsageData();
  }, []);

  const estimatedCost = (totalTokens / 1_000_000) * GEMINI_FLASH_LITE_COST_PER_1M_TOKENS;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center mb-8">
          <button onClick={onBack} className="mr-4 p-2 hover:bg-slate-200 rounded-full transition-colors">
            <ArrowLeft size={24} className="text-slate-600" />
          </button>
          <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-500 font-medium">Total Requests</h3>
              <Activity className="text-blue-500" size={20} />
            </div>
            <p className="text-3xl font-bold text-slate-900">{totalRequests}</p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-500 font-medium">Total Tokens</h3>
              <Database className="text-indigo-500" size={20} />
            </div>
            <p className="text-3xl font-bold text-slate-900">{totalTokens.toLocaleString()}</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-500 font-medium">Estimated Cost</h3>
              <DollarSign className="text-emerald-500" size={20} />
            </div>
            <p className="text-3xl font-bold text-slate-900">${estimatedCost.toFixed(4)}</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-500 font-medium">Active Users</h3>
              <Users className="text-purple-500" size={20} />
            </div>
            <p className="text-3xl font-bold text-slate-900">{usersUsage.length}</p>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Daily Usage (Last 30 Days)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fill: '#64748b' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#64748b' }} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line type="monotone" dataKey="requests" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Users Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">Top Users by Usage</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-sm">
                <tr>
                  <th className="px-6 py-4 font-medium">User ID</th>
                  <th className="px-6 py-4 font-medium">Total Requests</th>
                  <th className="px-6 py-4 font-medium">Tokens Used</th>
                  <th className="px-6 py-4 font-medium">Last Request</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {usersUsage.slice(0, 10).map((user) => (
                  <tr key={user.userId} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{user.userId}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{user.totalRequests}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{user.totalTokensEstimated?.toLocaleString() || 0}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {user.lastRequestAt ? new Date(user.lastRequestAt).toLocaleString() : 'N/A'}
                    </td>
                  </tr>
                ))}
                {usersUsage.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">No usage data found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
