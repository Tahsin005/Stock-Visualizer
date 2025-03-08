import { useEffect, useState } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, ComposedChart, CartesianGrid, AreaChart, Area } from "recharts";

export default function App() {
  const [trades, setTrades] = useState([]);
  const [allTrades, setAllTrades] = useState([]);
  const [deletedTrades, setDeletedTrades] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(10);
  const [selectedTrade, setSelectedTrade] = useState("");
  const [timeRange, setTimeRange] = useState("all");

  useEffect(() => {
    const deleted = JSON.parse(localStorage.getItem("deletedTrades")) || [];
    setDeletedTrades(deleted);
    setIsLoading(true);

    fetch("/data.json")
      .then((res) => res.json())
      .then((data) => {
        const filteredTrades = data.filter(
          (trade) =>
            !deleted.some(
              (del) => del.date === trade.date && del.trade_code === trade.trade_code
            )
        );
        setAllTrades(filteredTrades);
        setTrades(filteredTrades.slice(0, visibleCount));
        setIsLoading(false);

        if (filteredTrades.length > 0) {
          setSelectedTrade(filteredTrades[0].trade_code);
        }
      });
  }, []);

  const handleLoadMore = () => {
    const newCount = visibleCount + 10;
    setTrades(allTrades.slice(0, newCount));
    setVisibleCount(newCount);
  };

  const handleDelete = (trade_code, date) => {
    const updatedDeletedTrades = [...deletedTrades, { trade_code, date }];
    setDeletedTrades(updatedDeletedTrades);
    localStorage.setItem("deletedTrades", JSON.stringify(updatedDeletedTrades));

    const updatedTrades = allTrades.filter(
      (trade) => !(trade.trade_code === trade_code && trade.date === date)
    );
    setAllTrades(updatedTrades);
    setTrades(updatedTrades.slice(0, visibleCount));
  };

  const handleReset = () => {
    localStorage.removeItem("deletedTrades");
    setDeletedTrades([]);
    fetch("/data.json")
      .then((res) => res.json())
      .then((data) => {
        setAllTrades(data);
        setTrades(data.slice(0, 10));
        setVisibleCount(10);
        if (data.length > 0) setSelectedTrade(data[0].trade_code);
      });
  };

  const chartData = allTrades
    .filter((trade) => trade.trade_code === selectedTrade)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const filteredChartData = (() => {
    if (timeRange === "all") return chartData;

    const now = new Date();
    const cutoffDate = new Date();

    if (timeRange === "month") {
      cutoffDate.setMonth(now.getMonth() - 1);
    } else if (timeRange === "quarter") {
      cutoffDate.setMonth(now.getMonth() - 3);
    } else if (timeRange === "year") {
      cutoffDate.setFullYear(now.getFullYear() - 1);
    }

    return chartData.filter(item => new Date(item.date) >= cutoffDate);
  })();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Trade Analytics Dashboard</h1>
          <p className="text-gray-500 mt-2">View and analyze trade performance data</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm col-span-2">
            <div className="flex flex-wrap items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-700">Price & Volume</h2>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={filteredChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fill: '#6b7280' }} />
                <YAxis yAxisId="left" tick={{ fill: '#6b7280' }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: '#6b7280' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    border: 'none'
                  }}
                />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="close" stroke="#6366f1" strokeWidth={2} dot={{ r: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                <Bar yAxisId="right" dataKey="volume" fill="#a5b4fc" radius={[4, 4, 0, 0]} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Trade Selection</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Trade</label>
                <select
                  value={selectedTrade}
                  onChange={(e) => setSelectedTrade(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Array.from(new Set(allTrades.map((trade) => trade.trade_code))).map((code) => (
                    <option key={code} value={code}>{code}</option>
                  ))}
                </select>
              </div>



              <button
                onClick={handleReset}
                className="w-full mt-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Reset Trades
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm mb-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Price Movement Range</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={filteredChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fill: '#6b7280' }} />
              <YAxis tick={{ fill: '#6b7280' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  border: 'none'
                }}
              />
              <Legend />
              <Area type="monotone" dataKey="high" stroke="#f97316" fill="#fdba74" fillOpacity={0.2} />
              <Area type="monotone" dataKey="close" stroke="#22c55e" fill="#86efac" fillOpacity={0.2} />
              <Area type="monotone" dataKey="low" stroke="#8b5cf6" fill="#c4b5fd" fillOpacity={0.2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-700">Trade History</h2>
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {allTrades.length} records
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Trade Code</th>
                  <th className="px-6 py-3">High</th>
                  <th className="px-6 py-3">Low</th>
                  <th className="px-6 py-3">Open</th>
                  <th className="px-6 py-3">Close</th>
                  <th className="px-6 py-3">Volume</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-10 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                      </div>
                      <p className="mt-2 text-sm text-gray-500">Loading trades...</p>
                    </td>
                  </tr>
                ) : trades.length > 0 ? (
                  trades.map((trade, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-700">{trade.date}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{trade.trade_code}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{trade.high}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{trade.low}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{trade.open}</td>
                      <td className="px-6 py-4 text-sm font-medium">
                        <span className={`${trade.close > trade.open ? 'text-green-600' : 'text-red-600'}`}>
                          {trade.close}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{trade.volume.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm font-medium">
                        <button
                          className="text-red-600 hover:text-red-900 transition-colors"
                          onClick={() => handleDelete(trade.trade_code, trade.date)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="px-6 py-10 text-center text-sm text-gray-500">
                      No trades available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {visibleCount < allTrades.length && (
            <div className="px-6 py-4 border-t border-gray-100">
              <button
                onClick={handleLoadMore}
                className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium rounded-lg transition-colors"
              >
                Load More ({allTrades.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}