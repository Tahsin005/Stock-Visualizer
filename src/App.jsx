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
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-lg">
      <h1 className="text-2xl font-bold mb-4 px-6 py-4 ">Trade Data</h1>

      <div className="flex flex-wrap justify-between items-center px-6 py-4 mb-6">
        <div className="mb-4 mr-4">
          <label className="mr-2 font-semibold">Select Trade:</label>
          <select
            value={selectedTrade}
            onChange={(e) => setSelectedTrade(e.target.value)}
            className="px-4 py-2 border rounded shadow"
          >
            {Array.from(new Set(allTrades.map((trade) => trade.trade_code))).map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-8 px-6 py-4">
        <h2 className="text-xl font-semibold mb-2">Price & Volume</h2>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={filteredChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis yAxisId="left" label={{ value: "Close Price", angle: -90, position: "insideLeft" }} />
            <YAxis yAxisId="right" orientation="right" label={{ value: "Volume", angle: -90, position: "insideRight" }} />
            <Tooltip />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="close" stroke="#8884d8" />
            <Bar yAxisId="right" dataKey="volume" fill="#82ca9d" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Price Movement Visualization - Area Chart */}
      <div className="mb-8 px-6 py-4">
        <h2 className="text-xl font-semibold mb-2">Price Movement Range</h2>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={filteredChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="high" stroke="#ff7300" fill="#ff7300" fillOpacity={0.1} />
            <Area type="monotone" dataKey="close" stroke="#387908" fill="#387908" fillOpacity={0.2} />
            <Area type="monotone" dataKey="low" stroke="#8884d8" fill="#8884d8" fillOpacity={0.1} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="px-6 py-4 border-t border-gray-100">
        <button
          onClick={handleReset}
          className="mb-4 px-4 py-2 bg-blue-500 text-white rounded shadow hover:bg-blue-700"
        >
          Reset Trades
        </button>
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
                        className="bg-red-500 text-white rounded shadow hover:bg-red-700 transition-colors py-1 w-full"
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
              className="w-full py-2 bg-green-500 text-white rounded shadow hover:bg-green-700"
            >
              Load More ({allTrades.length - visibleCount} remaining)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}