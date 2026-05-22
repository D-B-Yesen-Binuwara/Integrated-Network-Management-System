import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const EventPage = () => {
    const [search, setSearch] = useState("");
    const [selectedNode, setSelectedNode] = useState("All");
    const [selectedDate, setSelectedDate] = useState(null);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch data from database on component mount
    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const response = await fetch("http://localhost:5000/api/events");
                if (response.ok) {
                    const events = await response.json();
                    setData(events);
                } else {
                    // Fallback to sample data if API fails
                    setData([
                        { id: 1, time: "13/02/2026, 10:23:03", node: "CEAN-BLR-001", event: "ALARM_RAISED", alarmType: "AC Alarm", officer: "John Silva", severity: "MAJOR" },
                        { id: 2, time: "13/02/2026, 10:23:02", node: "CEAN-BLR-001", event: "ALARM_RAISED", alarmType: "Power Failure", officer: "John Silva", severity: "MAJOR" },
                        { id: 3, time: "13/02/2026, 10:22:56", node: "CEAN-BLR-001", event: "NODE_DOWN", alarmType: "Node Offline", officer: "Mary Fernando", severity: "CRITICAL" },
                        { id: 4, time: "13/02/2026, 10:20:10", node: "SLBN-DEL-001", event: "NODE_DOWN", alarmType: "Node Offline", officer: "Kamal Perera", severity: "CRITICAL" },
                        { id: 5, time: "13/02/2026, 10:18:20", node: "SLBN-DEL-001", event: "NODE_UP", alarmType: "Node Online", officer: "Kamal Perera", severity: "INFO" },
                        { id: 6, time: "13/02/2026, 10:15:05", node: "MSAN-BLR-001", event: "ALARM_RAISED", alarmType: "Temperature Alert", officer: "Nimal Silva", severity: "MAJOR" },
                        { id: 7, time: "13/02/2026, 10:14:00", node: "MSAN-BLR-001", event: "NODE_UP", alarmType: "Node Online", officer: "Nimal Silva", severity: "INFO" }
                    ]);
                }
            } catch (error) {
                console.error("Error fetching events:", error);
                // Set fallback data on error
                setData([
                    { id: 1, time: "13/02/2026, 10:23:03", node: "CEAN-BLR-001", event: "ALARM_RAISED", alarmType: "AC Alarm", officer: "John Silva", severity: "MAJOR" },
                    { id: 2, time: "13/02/2026, 10:23:02", node: "CEAN-BLR-001", event: "ALARM_RAISED", alarmType: "Power Failure", officer: "John Silva", severity: "MAJOR" },
                    { id: 3, time: "13/02/2026, 10:22:56", node: "CEAN-BLR-001", event: "NODE_DOWN", alarmType: "Node Offline", officer: "Mary Fernando", severity: "CRITICAL" },
                    { id: 4, time: "13/02/2026, 10:20:10", node: "SLBN-DEL-001", event: "NODE_DOWN", alarmType: "Node Offline", officer: "Kamal Perera", severity: "CRITICAL" },
                    { id: 5, time: "13/02/2026, 10:18:20", node: "SLBN-DEL-001", event: "NODE_UP", alarmType: "Node Online", officer: "Kamal Perera", severity: "INFO" },
                    { id: 6, time: "13/02/2026, 10:15:05", node: "MSAN-BLR-001", event: "ALARM_RAISED", alarmType: "Temperature Alert", officer: "Nimal Silva", severity: "MAJOR" },
                    { id: 7, time: "13/02/2026, 10:14:00", node: "MSAN-BLR-001", event: "NODE_UP", alarmType: "Node Online", officer: "Nimal Silva", severity: "INFO" }
                ]);
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, []);

    const nodes = ["All", ...new Set(data.map((d) => d.node))];

    const filtered = data.filter((d) => {
        const eventDate = new Date(d.time);

        return (
            (selectedNode === "All" || d.node === selectedNode) &&
            (d.node.toLowerCase().includes(search.toLowerCase()) ||
             d.alarmType.toLowerCase().includes(search.toLowerCase())) &&
            (!selectedDate ||
             eventDate.toDateString() === selectedDate.toDateString())
        );
    });

    const getSeverityRowClass = (sev) => {
        if (sev === "CRITICAL") return "hover:bg-red-50";
        if (sev === "MAJOR") return "hover:bg-yellow-50";
        if (sev === "INFO") return "hover:bg-blue-50";
        return "hover:bg-gray-50";
    };

    const getSeverityBadge = (sev) => {
        if (sev === "CRITICAL") return "bg-red-600 text-white";
        if (sev === "MAJOR") return "bg-yellow-600 text-white";
        if (sev === "INFO") return "bg-blue-600 text-white";
        return "bg-gray-500 text-white";
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-gray-800">
                    System Event Log
                </h1>
                <p className="mt-0.5 text-sm text-gray-500">
                    Monitor all system events and alarm activities across your network
                </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                    <select
                        value={selectedNode}
                        onChange={(e) => setSelectedNode(e.target.value)}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {nodes.map((n, i) => (
                            <option key={i} value={n}>{n}</option>
                        ))}
                    </select>

                    <div className="flex flex-1 items-center overflow-hidden rounded-lg border border-gray-300">
                        <input
                            type="text"
                            placeholder="Search node or alarm type..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="flex-1 px-3 py-2 text-sm focus:outline-none"
                        />

                        <button className="bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
                            Search
                        </button>
                    </div>

                    <div className="relative flex items-center gap-2">
                        <DatePicker
                            selected={selectedDate}
                            onChange={(date) => setSelectedDate(date)}
                            placeholderText="📅"
                            className="h-10 w-10 cursor-pointer rounded-lg border border-gray-300 text-center hover:bg-gray-50"
                            popperPlacement="bottom-start"
                        />

                        <button
                            onClick={() => setSelectedDate(null)}
                            className="text-xs text-blue-600 hover:underline"
                        >
                            Select All
                        </button>
                    </div>
                </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 p-4">
                    <h2 className="text-base font-semibold text-gray-700">
                        Events ({filtered.length}) 
                        
                    </h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50">
                                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-600">Timestamp</th>
                                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-600">Node</th>
                                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-600">Event Type</th>
                                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-600">Officer</th>
                                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-600">Device Priority</th>
                                <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-600">Alarm Type</th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                            Loading events...
                                        </div>
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">
                                        No events found.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((d, i) => (
                                    <tr
                                        key={i}
                                        className={`border-b border-gray-100 transition ${getSeverityRowClass(d.severity)}`}
                                    >
                                        <td className="px-4 py-3 font-mono text-xs text-gray-600">{d.time}</td>
                                        <td className="px-4 py-3 font-medium text-gray-800">{d.node}</td>
                                        <td className="px-4 py-3">
                                            <span className="rounded bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">
                                                {d.event}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">{d.officer}</td>
                                        <td className="px-4 py-3">
                                            <span className={`rounded px-3 py-1 text-xs font-semibold ${getSeverityBadge(d.severity)}`}>
                                                {d.severity}
                                            </span>
                                        </td>
                                        <td className="max-w-xs truncate px-4 py-3 text-gray-600">{d.alarmType}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default EventPage;
