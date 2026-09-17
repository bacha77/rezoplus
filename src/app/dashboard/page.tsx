"use client";

import React, { useEffect, useState, useRef } from "react";
import { ShieldCheck, ShieldAlert, Plus, RefreshCw, Activity, AlertTriangle, Truck, Upload, ChevronDown, ChevronUp, Key, Download } from "lucide-react";
import Papa from "papaparse";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { UserButton } from "@clerk/nextjs";
import { CheckoutButton } from "@/components/CheckoutButton";

type Carrier = {
  id: number;
  dot_number: string;
  name: string;
  insurance_status: string;
  authority_status: string;
  safety_score: number;
  insurance_amount?: number;
  power_units?: number;
  oos_rate?: number;
  address?: string;
  phone?: string;
  safety_rating?: string;
  last_checked: string;
};

type HistoryRecord = {
  id: number;
  timestamp: string;
  safety_score: number;
};

type ApiKey = {
  id: number;
  api_key: string;
  customer_name: string;
  is_active: number;
  created_at: string;
};

export default function Home() {
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [newDot, setNewDot] = useState("");
  const [newCustomer, setNewCustomer] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [historyData, setHistoryData] = useState<Record<number, HistoryRecord[]>>({});
  const [isSubscribed, setIsSubscribed] = useState(true);
  const [alertEmail, setAlertEmail] = useState("");
  const [emailAlertsEnabled, setEmailAlertsEnabled] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [carrierRes, keysRes, subRes, settingsRes] = await Promise.all([
        fetch("/api/carriers"),
        fetch("/api/keys"),
        fetch("/api/subscription"),
        fetch("/api/settings")
      ]);
      const carrierData = await carrierRes.json();
      const keysData = await keysRes.json();
      const subData = await subRes.json();
      const settingsData = await settingsRes.json();
      
      setCarriers(carrierData || []);
      setApiKeys(keysData || []);
      setIsSubscribed(subData.isActive);
      
      if (settingsData) {
        setAlertEmail(settingsData.alert_email || "");
        setEmailAlertsEnabled(settingsData.email_alerts_enabled);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddCarrier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch("/api/carriers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dotNumber: newDot }),
      });
      setNewDot("");
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerName: newCustomer }),
      });
      setNewCustomer("");
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results: any) => {
        const parsedCarriers = results.data.map((row: any) => ({
          dotNumber: row.DOT || row.dot || row.dot_number || row.dotNumber,
          name: row.Name || row.name || row.company || row.company_name
        })).filter((c: any) => c.dotNumber && c.name);

        if (parsedCarriers.length > 0) {
          try {
            await fetch("/api/carriers/bulk", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ carriers: parsedCarriers }),
            });
            fetchData();
          } catch (error) {
            console.error("Bulk upload failed", error);
          }
        }
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    });
  };

  const toggleExpand = async (id: number) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    if (!historyData[id]) {
      try {
        const res = await fetch(`/api/carriers/${id}/history`);
        const data = await res.json();
        const formattedData = data.map((d: any) => ({
          ...d,
          timeLabel: new Date(d.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })
        }));
        setHistoryData(prev => ({ ...prev, [id]: formattedData }));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  };

  const handleClearAll = async () => {
    if (!confirm("Are you sure you want to delete all tracked carriers? This cannot be undone.")) return;
    
    try {
      await fetch("/api/carriers", { method: "DELETE" });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportCSV = () => {
    if (carriers.length === 0) return;
    const csv = Papa.unparse(carriers);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "compliance_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: alertEmail, enabled: emailAlertsEnabled })
      });
      alert("Settings saved successfully!");
    } catch (e) {
      console.error(e);
      alert("Failed to save settings");
    }
    setSavingSettings(false);
  };

  const totalCarriers = carriers.length;
  const nonCompliant = carriers.filter(c => c.insurance_status === 'DROPPED' || c.authority_status === 'REVOKED').length;
  const avgSafetyScore = totalCarriers > 0 ? Math.round(carriers.reduce((acc, c) => acc + c.safety_score, 0) / totalCarriers) : 0;


  return (
    <main className="flex-1 p-8 bg-[var(--background)] overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header section */}
        <header className="flex justify-between items-center pb-6 border-b border-[var(--border)]">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <img src="/logo.jpg" alt="RezoPlus Logo" className="h-10 rounded-md" />
              RezoPlus Monitor
            </h1>
            <p className="text-gray-400 mt-2">Real-time FMCSA compliance monitoring</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={handleClearAll}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-md transition-all text-sm font-medium cursor-pointer"
            >
              Clear All Data
            </button>
            <button 
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--card)] hover:bg-[#202020] border border-[var(--border)] rounded-md transition-all text-sm font-medium cursor-pointer text-white"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <input 
              type="file" 
              accept=".csv" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileUpload} 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] hover:bg-blue-600 border border-transparent rounded-md transition-all text-sm font-medium text-white cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              Upload CSV
            </button>
            <button 
              onClick={fetchData}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--card)] hover:bg-[#202020] border border-[var(--border)] rounded-md transition-all text-sm font-medium cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <div className="pl-4 ml-2 border-l border-[var(--border)] flex items-center gap-4">
              {!isSubscribed && (
                <div className="w-40">
                  <CheckoutButton text="Upgrade to Pro" />
                </div>
              )}
              <UserButton />
            </div>
          </div>
        </header>

        {/* Paywall Overlay */}
        {!isSubscribed && !loading && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="glass-panel rounded-2xl p-8 max-w-md w-full text-center shadow-2xl relative z-50">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShieldCheck className="w-8 h-8 text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Subscription Required</h2>
              <p className="text-gray-400 mb-8">
                You must have an active subscription to view the dashboard and monitor carriers in real-time.
              </p>
              <CheckoutButton text="Start Subscription ($49/mo)" />
              <div className="mt-4">
                <UserButton />
              </div>
            </div>
          </div>
        )}

        <div className={!isSubscribed ? "opacity-30 pointer-events-none filter blur-sm" : ""}>
          {/* Analytics Widget */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel rounded-xl p-6 shadow-md flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium mb-1">Total Tracked Carriers</p>
              <h3 className="text-3xl font-bold text-white">{totalCarriers}</h3>
            </div>
            <div className="bg-blue-500/10 p-3 rounded-lg">
              <Truck className="w-6 h-6 text-[var(--primary)]" />
            </div>
          </div>
          <div className="glass-panel rounded-xl p-6 shadow-md flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium mb-1">Action Required</p>
              <h3 className={`text-3xl font-bold ${nonCompliant > 0 ? 'text-red-500' : 'text-green-500'}`}>{nonCompliant}</h3>
            </div>
            <div className={`p-3 rounded-lg ${nonCompliant > 0 ? 'bg-red-500/10' : 'bg-green-500/10'}`}>
              <ShieldAlert className={`w-6 h-6 ${nonCompliant > 0 ? 'text-red-500' : 'text-green-500'}`} />
            </div>
          </div>
          <div className="glass-panel rounded-xl p-6 shadow-md flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium mb-1">Fleet Avg Safety Score</p>
              <h3 className="text-3xl font-bold text-white">{avgSafetyScore}</h3>
            </div>
            <div className="bg-yellow-500/10 p-3 rounded-lg">
              <Activity className="w-6 h-6 text-yellow-500" />
            </div>
          </div>
        </div>


        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Add Carrier Form */}
          <div className="glass-panel rounded-xl p-6 shadow-xl h-fit">
            <h2 className="text-lg font-semibold mb-4 text-white">Watch New Carrier</h2>
            <form onSubmit={handleAddCarrier} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">DOT Number</label>
                <input 
                  type="text" 
                  required
                  value={newDot}
                  onChange={(e) => setNewDot(e.target.value)}
                  className="w-full bg-[#0f0f0f] border border-[var(--border)] rounded-md px-3 py-2 text-white focus:outline-none focus:border-[var(--primary)] transition-colors"
                  placeholder="e.g. 1234567"
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-[var(--primary)] hover:bg-blue-600 text-white rounded-md px-4 py-2 font-medium flex justify-center items-center gap-2 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add to Watchlist
              </button>
            </form>

            <div className="mt-8 pt-8 border-t border-[var(--border)]">
              <h2 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                <Key className="w-5 h-5" /> B2B API Access
              </h2>
              <form onSubmit={handleGenerateKey} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Client/Company Name</label>
                  <input 
                    type="text" 
                    required
                    value={newCustomer}
                    onChange={(e) => setNewCustomer(e.target.value)}
                    className="w-full bg-[#0f0f0f] border border-[var(--border)] rounded-md px-3 py-2 text-white focus:outline-none focus:border-[var(--primary)] transition-colors"
                    placeholder="e.g. Acme 3PL"
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full bg-[var(--card)] border border-[var(--border)] hover:bg-[#202020] text-white rounded-md px-4 py-2 font-medium flex justify-center items-center gap-2 transition-colors cursor-pointer text-sm"
                >
                  <Plus className="w-4 h-4" /> Generate API Key
                </button>
              </form>
            </div>

            {/* Notification Settings */}
            <div className="mt-8 pt-8 border-t border-[var(--border)]">
              <h2 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                Alert Settings
              </h2>
              <form onSubmit={saveSettings} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Alert Email Address</label>
                  <input 
                    type="email" 
                    required
                    value={alertEmail}
                    onChange={(e) => setAlertEmail(e.target.value)}
                    className="w-full bg-[#0f0f0f] border border-[var(--border)] rounded-md px-3 py-2 text-white focus:outline-none focus:border-[var(--primary)] transition-colors"
                    placeholder="alerts@brokerage.com"
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={emailAlertsEnabled}
                    onChange={(e) => setEmailAlertsEnabled(e.target.checked)}
                    className="rounded border-gray-600 bg-[#0f0f0f] text-[var(--primary)] focus:ring-[var(--primary)]"
                  />
                  <span className="text-sm text-gray-400">Receive Email Alerts</span>
                </label>
                <button 
                  type="submit"
                  disabled={savingSettings}
                  className="w-full bg-[var(--card)] border border-[var(--border)] hover:bg-[#202020] text-white rounded-md px-4 py-2 font-medium flex justify-center items-center gap-2 transition-colors cursor-pointer text-sm disabled:opacity-50"
                >
                  {savingSettings ? "Saving..." : "Save Settings"}
                </button>
              </form>
            </div>
          </div>

          {/* Data Tables */}
          <div className="md:col-span-2 space-y-6">
            
            {/* API Keys Table */}
            {apiKeys.length > 0 && (
              <div className="glass-panel rounded-xl p-6 shadow-xl overflow-x-auto">
                <h2 className="text-lg font-semibold mb-4 text-white">Active API Keys</h2>
                <table className="w-full text-left text-sm">
                  <thead className="text-gray-400 border-b border-[var(--border)]">
                    <tr>
                      <th className="pb-3 font-medium">Client Name</th>
                      <th className="pb-3 font-medium">API Key</th>
                      <th className="pb-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apiKeys.map((key) => (
                      <tr key={key.id} className="border-b border-[var(--border)] last:border-0">
                        <td className="py-3 font-medium text-white">{key.customer_name}</td>
                        <td className="py-3 font-mono text-gray-400 text-xs">{key.api_key}</td>
                        <td className="py-3">
                          {key.is_active ? (
                            <span className="text-green-400 font-medium text-xs">Active</span>
                          ) : (
                            <span className="text-red-400 font-medium text-xs">Revoked</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-4 text-xs text-gray-500">
                  Endpoint: <code className="text-gray-400">GET /api/v1/compliance?dotNumber=XXX</code> | Header: <code className="text-gray-400">x-api-key</code>
                </div>
              </div>
            )}

            {/* Carrier List */}
            <div className="glass-panel rounded-xl p-6 shadow-xl overflow-x-auto">
              <h2 className="text-lg font-semibold mb-4 text-white">Monitored Carriers</h2>
              
              <table className="w-full text-left text-sm">
                <thead className="text-gray-400 border-b border-[var(--border)]">
                  <tr>
                    <th className="pb-3 font-medium">Carrier</th>
                    <th className="pb-3 font-medium">Authority</th>
                    <th className="pb-3 font-medium">Insurance</th>
                    <th className="pb-3 font-medium">Safety Score</th>
                    <th className="pb-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {carriers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-500">
                        No carriers currently monitored. Add one to begin or upload a CSV.
                      </td>
                    </tr>
                  ) : (
                    carriers.map((carrier) => (
                      <React.Fragment key={carrier.id}>
                        <tr 
                          className={`border-b border-[var(--border)] hover:bg-[#1a1a1a] transition-colors cursor-pointer ${expandedId === carrier.id ? 'bg-[#1a1a1a]' : ''}`}
                          onClick={() => toggleExpand(carrier.id)}
                        >
                          <td className="py-4">
                            <div className="font-medium text-white">{carrier.name}</div>
                            <div className="text-xs text-gray-500 font-mono">DOT: {carrier.dot_number}</div>
                          </td>
                          <td className="py-4">
                            {carrier.authority_status === 'AUTHORIZED' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                                <ShieldCheck className="w-3.5 h-3.5" /> Authorized
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                                <ShieldAlert className="w-3.5 h-3.5" /> Revoked
                              </span>
                            )}
                          </td>
                          <td className="py-4">
                            {carrier.insurance_status === 'ACTIVE' ? (
                              <span className="text-green-400 font-medium">Active</span>
                            ) : (
                              <span className="text-red-400 font-medium flex items-center gap-1">
                                <AlertTriangle className="w-4 h-4" /> Dropped
                              </span>
                            )}
                          </td>
                          <td className="py-4">
                            <div className="flex items-center gap-2">
                              <Activity className="w-4 h-4 text-gray-400" />
                              <span className={carrier.safety_score > 50 ? 'text-yellow-400 font-medium' : 'text-gray-300'}>
                                {carrier.safety_score}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 text-right">
                            {expandedId === carrier.id ? (
                              <ChevronUp className="w-5 h-5 text-gray-400 inline-block" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-gray-400 inline-block" />
                            )}
                          </td>
                        </tr>
                        {expandedId === carrier.id && (
                          <tr className="border-b border-[var(--border)] bg-[#121212]">
                            <td colSpan={5} className="py-6 px-6">
                              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Advanced Data */}
                                <div className="space-y-4">
                                  <h3 className="text-sm font-semibold text-white border-b border-[var(--border)] pb-2">Carrier Details</h3>
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <p className="text-gray-500 text-xs">Insurance Coverage</p>
                                      <p className="text-gray-200">${(carrier.insurance_amount || 0).toLocaleString()}</p>
                                    </div>
                                    <div>
                                      <p className="text-gray-500 text-xs">Power Units</p>
                                      <p className="text-gray-200">{carrier.power_units || 0} Trucks</p>
                                    </div>
                                    <div>
                                      <p className="text-gray-500 text-xs">Out of Service Rate</p>
                                      <p className="text-gray-200">{carrier.oos_rate}%</p>
                                    </div>
                                    <div>
                                      <p className="text-gray-500 text-xs">Safety Rating</p>
                                      <p className="text-gray-200">{carrier.safety_rating || 'Unrated'}</p>
                                    </div>
                                    <div className="col-span-2">
                                      <p className="text-gray-500 text-xs">Contact Information</p>
                                      <p className="text-gray-200">{carrier.phone || 'No phone'} • {carrier.address || 'No address'}</p>
                                    </div>
                                  </div>
                                </div>

                                {/* Graph */}
                                <div className="lg:col-span-2">
                                  <h3 className="text-sm font-semibold text-white border-b border-[var(--border)] pb-2 mb-4">Safety Score History</h3>
                                  <div className="h-56 w-full">
                                    {historyData[carrier.id] && historyData[carrier.id].length > 0 ? (
                                  <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={historyData[carrier.id]}>
                                      <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                      <XAxis dataKey="timeLabel" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                                      <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                                      <Tooltip 
                                        contentStyle={{ backgroundColor: '#1f1f1f', borderColor: '#333', color: '#fff' }}
                                        itemStyle={{ color: '#fff' }}
                                      />
                                      <Line type="monotone" dataKey="safety_score" stroke="var(--primary)" strokeWidth={3} dot={{ fill: 'var(--primary)', strokeWidth: 2 }} activeDot={{ r: 6 }} name="Safety Score" />
                                    </LineChart>
                                  </ResponsiveContainer>
                                ) : (
                                  <div className="h-full flex items-center justify-center text-gray-500 italic">
                                    Not enough historical data collected yet.
                                  </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        </div>
      </div>
    </main>
  );
}
