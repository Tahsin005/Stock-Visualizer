import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, ComposedChart, CartesianGrid, AreaChart, Area } from "recharts";

export default function TradeTable() {
  const [trades, setTrades] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isChartLoading, setIsChartLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(10);
  const [allTrades, setAllTrades] = useState([]);
  const [editTrade, setEditTrade] = useState(null); // For editing
  const [selectedTrade, setSelectedTrade] = useState("");
  const [timeRange, setTimeRange] = useState("all");
  const [isAddingTrade, setIsAddingTrade] = useState(false);
  const [isEditingTrade, setIsEditingTrade] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTrade, setNewTrade] = useState({
    date: new Date().toISOString().split('T')[0],
    trade_code: "",
    high: 0,
    low: 0,
    open: 0,
    close: 0,
    volume: "0"
  });

  useEffect(() => {
    fetchTrades();
  }, []);

  useEffect(() => {
    if (selectedTrade) {
      setIsChartLoading(true);
      const timer = setTimeout(() => {
        setIsChartLoading(false);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [selectedTrade, timeRange]);

  const fetchTrades = async () => {
    setIsLoading(true);
    setIsChartLoading(true);
    try {
      const response = await axios.get('https://stock-visualizer-api-jybm.onrender.com/api/stocks/');
      setTrades(response.data);
      setAllTrades(response.data);
      if (response.data) console.log(response.data);
      if (response.data.length > 0) setSelectedTrade(response.data[0].trade_code);
    } catch (error) {
      console.error('Error fetching trades', error);
    } finally {
      setIsLoading(false);
      setTimeout(() => setIsChartLoading(false), 500);
    }
  };

  const handleLoadMore = () => {
    setVisibleCount((prevCount) => prevCount + 30);
  };

  const handleDelete = async (id) => {
    setIsSubmitting(true);
    try {
      await axios.delete(`https://stock-visualizer-api-jybm.onrender.com/api/stocks/${id}/`);
      const updatedTrades = allTrades.filter((trade) => trade.id !== id);
      setAllTrades(updatedTrades);
      setTrades(updatedTrades.slice(0, visibleCount));
    } catch (error) {
      console.error('Error deleting trade', error);
      alert(`Error deleting trade: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditTrade = (trade) => {
    setEditTrade({ ...trade });
    setIsEditingTrade(true);
  };

  const handleUpdateTrade = async () => {
    setIsSubmitting(true);
    try {
      await axios.put(`https://stock-visualizer-api-jybm.onrender.com/api/stocks/${editTrade.id}/`, editTrade);

      const updatedAllTrades = allTrades.map((trade) =>
        trade.id === editTrade.id ? editTrade : trade
      );

      setAllTrades(updatedAllTrades);
      setTrades(updatedAllTrades.slice(0, visibleCount));
      setEditTrade(null);
      setIsEditingTrade(false);
    } catch (error) {
      console.error('Error updating trade', error);
      alert(`Error updating trade: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (isEditingTrade) {
      setEditTrade({ ...editTrade, [name]: value });
    } else if (isAddingTrade) {
      setNewTrade({ ...newTrade, [name]: value });
    }
  };

  const handleAddTrade = async () => {
    if (!newTrade.trade_code || !newTrade.date) {
      alert("Trade code and date are required!");
      return;
    }

    setIsSubmitting(true);

    const tradeToAdd = {
      ...newTrade,
      high: parseFloat(newTrade.high),
      low: parseFloat(newTrade.low),
      open: parseFloat(newTrade.open),
      close: parseFloat(newTrade.close),
      volume: newTrade.volume
    };

    try {
      const response = await axios.post('https://stock-visualizer-api-jybm.onrender.com/api/stocks/', tradeToAdd);

      const addedTrade = response.data;
      const updatedTrades = [addedTrade, ...allTrades];
      setAllTrades(updatedTrades);
      setTrades(updatedTrades.slice(0, visibleCount));

      if (!selectedTrade) {
        setSelectedTrade(addedTrade.trade_code);
      }

      setNewTrade({
        date: new Date().toISOString().split('T')[0],
        trade_code: "",
        high: 0,
        low: 0,
        open: 0,
        close: 0,
        volume: "0",
      });

      setIsAddingTrade(false);
    } catch (error) {
      console.error('Error adding trade:', error);
      alert(`An error occurred while adding the trade: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const LoadingSpinner = () => (
    <div className="flex items-center justify-center">
      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mr-2"></div>
      <span className="text-sm text-gray-600">Processing...</span>
    </div>
  );

  const ChartLoadingSkeleton = ({ height = 300 }) => (
    <div className="w-full" style={{ height: `${height}px` }}>
      <div className="h-full w-full bg-gray-100 animate-pulse rounded flex items-center justify-center">
        <div className="flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mb-4"></div>
          <span className="text-gray-500">Loading chart data...</span>
        </div>
      </div>
    </div>
  );

  const chartData = allTrades
    .filter((trade) => trade.trade_code === selectedTrade)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map(trade => ({
      ...trade
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
    <div className='max-w-4xl mx-auto bg-white shadow-md rounded-lg'>
      <h1 className="text-2xl font-bold mb-4 px-6 py-4 ">Trade Data</h1>
      <div className="flex flex-wrap justify-between items-center px-6 py-4 mb-6">
        <div className="mb-4 mr-4">
          <label className="mr-2 font-semibold">Select Trade:</label>
          <select
            value={selectedTrade}
            onChange={(e) => {
              setSelectedTrade(e.target.value);
              setIsChartLoading(true);
            }}
            className="px-4 py-2 border rounded shadow"
            disabled={isLoading}
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
        {isChartLoading ? (
          <ChartLoadingSkeleton />
        ) : (
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
                label={{ value: "Volume", angle: -90, position: "insideRight", fill: "black" }}
              />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="close" stroke="#8884d8" />
              <Bar yAxisId="right" dataKey="volume" fill="#82ca9d" />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mb-8 px-6 py-4">
        <h2 className="text-xl font-semibold mb-2">Price Movement Range</h2>
        {isChartLoading ? (
          <ChartLoadingSkeleton />
        ) : (
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
        )}
      </div>

      <div className="px-6 py-4 border-t border-gray-100 flex justify-between">
        <button
          onClick={() => setIsAddingTrade(true)}
          className="mb-4 px-4 py-2 bg-green-500 text-white rounded shadow hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading || isSubmitting}
        >
          Add New Trade
        </button>
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
              trades.slice(0, visibleCount).map((trade) => (
                <tr key={trade.id} className="hover:bg-gray-50">
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
                        className="bg-blue-500 text-white rounded shadow hover:bg-blue-700 transition-colors py-1 px-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => handleEditTrade(trade)}
                        disabled={isSubmitting}
                      >
                        Edit
                      </button>
                      <button
                        className="bg-red-500 text-white rounded shadow hover:bg-red-700 transition-colors py-1 px-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => handleDelete(trade.id)}
                        disabled={isSubmitting}
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

        {visibleCount < allTrades.length && (
          <div className="px-6 py-4 border-t border-gray-100">
            <button
              onClick={handleLoadMore}
              className="w-full py-2 bg-green-500 text-white rounded shadow hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading || isSubmitting}
            >
              Load More ({allTrades.length - visibleCount} remaining)
            </button>
          </div>
        )}

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
                    disabled={isSubmitting}
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
                    disabled={isSubmitting}
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
                      disabled={isSubmitting}
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
                      disabled={isSubmitting}
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
                      disabled={isSubmitting}
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
                      disabled={isSubmitting}
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
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setIsAddingTrade(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>

                <button
                  onClick={handleAddTrade}
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <LoadingSpinner /> : 'Add Trade'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Trade Modal */}
        {isEditingTrade && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-8 rounded shadow-md w-96">
              <h3 className="text-lg font-medium">Edit Trade</h3>
              <form>
                <div className="mt-4">
                  <label className="block text-sm">Date</label>
                  <input
                    type="text"
                    name="date"
                    value={editTrade.date}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="mt-4">
                  <label className="block text-sm">Trade Code</label>
                  <input
                    type="text"
                    name="trade_code"
                    value={editTrade.trade_code}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="mt-4">
                  <label className="block text-sm">High</label>
                  <input
                    type="number"
                    name="high"
                    value={editTrade.high}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded"
                    step="0.01"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="mt-4">
                  <label className="block text-sm">Low</label>
                  <input
                    type="number"
                    name="low"
                    value={editTrade.low}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded"
                    step="0.01"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="mt-4">
                  <label className="block text-sm">Open</label>
                  <input
                    type="number"
                    name="open"
                    value={editTrade.open}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded"
                    step="0.01"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="mt-4">
                  <label className="block text-sm">Close</label>
                  <input
                    type="number"
                    name="close"
                    value={editTrade.close}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded"
                    step="0.01"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="mt-4">
                  <label className="block text-sm">Volume</label>
                  <input
                    type="text"
                    name="volume"
                    value={editTrade.volume}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={handleUpdateTrade}
                    className="bg-blue-500 text-white rounded px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? <LoadingSpinner /> : 'Update Trade'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditTrade(null);
                      setIsEditingTrade(false);
                    }}
                    className="ml-2 bg-gray-300 text-gray-700 rounded px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}