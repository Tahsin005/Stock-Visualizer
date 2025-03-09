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
  const [isAddingTrade, setIsAddingTrade] = useState(false);
  const [isEditingTrade, setIsEditingTrade] = useState(false);
  const [editingTradeId, setEditingTradeId] = useState(null);
  const [newTrade, setNewTrade] = useState({
    date: new Date().toISOString().split('T')[0],
    trade_code: "",
    high: 0,
    low: 0,
    open: 0,
    close: 0,
    volume: "0"
  });

  const parseVolume = (volumeStr) => {
    if (typeof volumeStr === 'number') return volumeStr;
    return parseInt(volumeStr.replace(/,/g, '')) || 0;
  };

  const formatVolume = (volume) => {
    if (typeof volume === 'string' && volume.includes(',')) return volume;
    return volume.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  useEffect(() => {
    const deleted = JSON.parse(localStorage.getItem("deletedTrades")) || [];
    setDeletedTrades(deleted);


    const savedTrades = JSON.parse(localStorage.getItem("savedTrades")) || [];

    if (savedTrades.length > 0) {
      const filteredTrades = savedTrades.filter(
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
    } else {
      setIsLoading(true);
      fetch("/data.json")
        .then((res) => res.json())
        .then((data) => {
          const processedData = data.map(trade => ({
            ...trade,
            volume: typeof trade.volume === 'number' ?
              formatVolume(trade.volume) :
              trade.volume
          }));

          const filteredTrades = processedData.filter(
            (trade) =>
              !deleted.some(
                (del) => del.date === trade.date && del.trade_code === trade.trade_code
              )
          );
          setAllTrades(filteredTrades);
          setTrades(filteredTrades.slice(0, visibleCount));
          setIsLoading(false);

          localStorage.setItem("savedTrades", JSON.stringify(filteredTrades));

          if (filteredTrades.length > 0) {
            setSelectedTrade(filteredTrades[0].trade_code);
          }
        })
        .catch(error => {
          console.error("Error loading data:", error);
          setIsLoading(false);
        });
    }
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

    localStorage.setItem("savedTrades", JSON.stringify(updatedTrades));
  };

  const handleReset = () => {
    localStorage.removeItem("deletedTrades");
    setDeletedTrades([]);
    fetch("/data.json")
      .then((res) => res.json())
      .then((data) => {
        const processedData = data.map(trade => ({
          ...trade,
          volume: typeof trade.volume === 'number' ?
            formatVolume(trade.volume) :
            trade.volume
        }));

        setAllTrades(processedData);
        setTrades(processedData.slice(0, 10));
        setVisibleCount(10);
        localStorage.setItem("savedTrades", JSON.stringify(processedData));
        if (processedData.length > 0) setSelectedTrade(processedData[0].trade_code);
      });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (["high", "low", "open", "close"].includes(name)) {
      setNewTrade({ ...newTrade, [name]: parseFloat(value) || 0 });
    } else if (name === "volume") {
      const rawValue = value.replace(/,/g, '');
      if (/^\d*$/.test(rawValue)) {
        const formattedValue = formatVolume(rawValue);
        setNewTrade({ ...newTrade, volume: formattedValue });
      }
    } else {
      setNewTrade({ ...newTrade, [name]: value });
    }
  };

  const handleAddTrade = () => {
    if (!newTrade.trade_code || !newTrade.date) {
      alert("Trade code and date are required!");
      return;
    }

    const tradeToAdd = {
      ...newTrade,
      volume: newTrade.volume
    };

    const updatedTrades = [tradeToAdd, ...allTrades];

    setAllTrades(updatedTrades);
    setTrades(updatedTrades.slice(0, visibleCount));
    localStorage.setItem("savedTrades", JSON.stringify(updatedTrades));

    if (!selectedTrade) {
      setSelectedTrade(tradeToAdd.trade_code);
    }

    setNewTrade({
      date: new Date().toISOString().split('T')[0],
      trade_code: "",
      high: 0,
      low: 0,
      open: 0,
      close: 0,
      volume: "0"
    });

    setIsAddingTrade(false);
  };

  const handleEditTrade = (trade) => {
    setNewTrade({
      date: trade.date,
      trade_code: trade.trade_code,
      high: trade.high,
      low: trade.low,
      open: trade.open,
      close: trade.close,
      volume: trade.volume
    });
    setEditingTradeId({ date: trade.date, trade_code: trade.trade_code });
    setIsEditingTrade(true);
  };

  const handleUpdateTrade = () => {
    const tradeIndex = allTrades.findIndex(
      trade =>
        trade.date === editingTradeId.date &&
        trade.trade_code === editingTradeId.trade_code
    );

    if (tradeIndex === -1) {
      alert("Trade not found!");
      return;
    }

    const updatedTrades = [...allTrades];
    updatedTrades[tradeIndex] = { ...newTrade };

    setAllTrades(updatedTrades);
    setTrades(updatedTrades.slice(0, visibleCount));
    localStorage.setItem("savedTrades", JSON.stringify(updatedTrades));

    setNewTrade({
      date: new Date().toISOString().split('T')[0],
      trade_code: "",
      high: 0,
      low: 0,
      open: 0,
      close: 0,
      volume: "0"
    });

    setIsEditingTrade(false);
    setEditingTradeId(null);
  };

  const chartData = allTrades
    .filter((trade) => trade.trade_code === selectedTrade)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map(trade => ({
      ...trade,
      volume: parseVolume(trade.volume)
    }));

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
    <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg">
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
            <YAxis
              yAxisId="left"
              label={{ value: "Close Price", angle: -90, position: "insideLeft", fill: "black" }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              label={{ value: "", angle: -90, position: "insideRight", fill: "black" }}
            />
            <Tooltip />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="close" stroke="#8884d8" />
            <Bar yAxisId="right" dataKey="volume" fill="#82ca9d" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>


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

      <div className="px-6 py-4 border-t border-gray-100 flex justify-between">
        <button
          onClick={handleReset}
          className="mb-4 px-4 py-2 bg-blue-500 text-white rounded shadow hover:bg-blue-700"
        >
          Reset Trades
        </button>

        <button
          onClick={() => setIsAddingTrade(true)}
          className="mb-4 px-4 py-2 bg-green-500 text-white rounded shadow hover:bg-green-700"
        >
          Add New Trade
        </button>
      </div>

      {/* Add Trade */}
      {isAddingTrade && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add New Trade</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trade Code</label>
                <input
                  type="text"
                  name="trade_code"
                  value={newTrade.trade_code}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  name="date"
                  value={newTrade.date}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Open</label>
                  <input
                    type="number"
                    name="open"
                    value={newTrade.open}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Close</label>
                  <input
                    type="number"
                    name="close"
                    value={newTrade.close}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">High</label>
                  <input
                    type="number"
                    name="high"
                    value={newTrade.high}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Low</label>
                  <input
                    type="number"
                    name="low"
                    value={newTrade.low}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    step="0.01"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Volume</label>
                <input
                  type="text"
                  name="volume"
                  value={newTrade.volume}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g. 1,292,933"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setIsAddingTrade(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                onClick={handleAddTrade}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
              >
                Add Trade
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Trade */}
      {isEditingTrade && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit Trade</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trade Code</label>
                <input
                  type="text"
                  name="trade_code"
                  value={newTrade.trade_code}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  name="date"
                  value={newTrade.date}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Open</label>
                  <input
                    type="number"
                    name="open"
                    value={newTrade.open}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Close</label>
                  <input
                    type="number"
                    name="close"
                    value={newTrade.close}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">High</label>
                  <input
                    type="number"
                    name="high"
                    value={newTrade.high}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Low</label>
                  <input
                    type="number"
                    name="low"
                    value={newTrade.low}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    step="0.01"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Volume</label>
                <input
                  type="text"
                  name="volume"
                  value={newTrade.volume}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g. 1,292,933"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setIsEditingTrade(false);
                  setEditingTradeId(null);
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                onClick={handleUpdateTrade}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Update Trade
              </button>
            </div>
          </div>
        </div>
      )}

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
                    <td className="px-6 py-4 text-sm text-gray-700">{trade.volume}</td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          className="bg-blue-500 text-white rounded shadow hover:bg-blue-700 transition-colors py-1 px-2"
                          onClick={() => handleEditTrade(trade)}
                        >
                          Edit
                        </button>
                        <button
                          className="bg-red-500 text-white rounded shadow hover:bg-red-700 transition-colors py-1 px-2"
                          onClick={() => handleDelete(trade.trade_code, trade.date)}
                        >
                          Delete
                        </button>
                      </div>
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