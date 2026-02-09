import React, { useState, useRef } from 'react';
import { LayoutDashboard, FilePlus, Calendar, AlertTriangle, Wrench, ChevronDown, ChevronRight, Settings, Database, Download, Upload, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { useLab } from '../context/LabContext';

export default function Sidebar({ active, onNavigate }) {
    const { state, overwriteDatabase, clearAllData } = useLab();
    const [isPMOpen, setIsPMOpen] = useState(true);
    const [showDevTools, setShowDevTools] = useState(false);

    // File Refs for separate imports
    const masterImportRef = useRef(null);
    const listImportRef = useRef(null);
    const reportImportRef = useRef(null);

    const exportData = (type) => {
        let data, filename;
        switch (type) {
            case 'master':
                data = state.pmCalMaster;
                filename = 'pmCalMaster.json';
                break;
            case 'list':
                data = state.pmCalList;
                filename = 'pmCalList.json';
                break;
            case 'report':
                data = state.abnormalityReports;
                filename = 'abnormalityReports.json';
                break;
            case 'troubleshooting':
                data = state.troubleshootingCases;
                filename = 'troubleshootingCases.json';
                break;
            default: return;
        }

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const importData = (type, event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target.result);
                let updates = {};

                if (type === 'master') {
                    if (Array.isArray(json)) updates.pmCalMaster = json;
                    else throw new Error("File content must be an array of Master records");
                }
                else if (type === 'list') {
                    if (Array.isArray(json)) {
                        updates.pmCalList = json.map(item => {
                            // Sanitize and derive missing fields
                            let derivedMonth = item.Month;
                            let derivedYear = item.Year;

                            if (item.DueDate) {
                                const date = new Date(item.DueDate);
                                if (!isNaN(date.getTime())) {
                                    // Ensure full English month name (e.g., "January")
                                    const monthName = date.toLocaleString('en-US', { month: 'long' });

                                    // If Month is missing or doesn't match standard, overwrite it
                                    if (!derivedMonth || derivedMonth !== monthName) {
                                        derivedMonth = monthName;
                                    }

                                    // Ensure Year is a number
                                    if (!derivedYear || derivedYear !== date.getFullYear()) {
                                        derivedYear = date.getFullYear();
                                    }
                                }
                            }

                            return {
                                ...item,
                                Month: derivedMonth,
                                Year: Number(derivedYear) // Force number type
                            };
                        });
                    }
                    else throw new Error("File content must be an array of List items");
                }
                else if (type === 'report') {
                    if (Array.isArray(json)) updates.abnormalityReports = json;
                    else throw new Error("File content must be an array of Abnormality Reports");
                }
                else if (type === 'troubleshooting') {
                    if (Array.isArray(json)) updates.troubleshootingCases = json;
                    else throw new Error("File content must be an array of Troubleshooting Cases");
                }

                overwriteDatabase(updates);
                alert(`Successfully imported ${type} data! (${json.length} records)`);
            } catch (error) {
                console.error("Import Error:", error);
                alert(`Failed to import: ${error.message}`);
            }
        };
        reader.readAsText(file);
        event.target.value = ''; // Reset input
    };

    const pmSubItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'register', label: 'Register', icon: FilePlus },
        { id: 'assign', label: 'Assign Plan', icon: Calendar },
    ];

    const topLevelItems = [
        { id: 'troubleshooting', label: 'Troubleshooting', icon: Wrench },
        { id: 'abnormality', label: 'Abnormality Report', icon: AlertTriangle },
        { id: 'database', label: 'Database Management', icon: Database },
    ];

    return (
        <div className="w-64 gradient-atc text-white flex flex-col h-full shadow-xl relative z-20">
            <div className="p-6 border-b border-white/20">
                <h1 className="text-xl font-bold tracking-tight text-white">ATC SMART LAB</h1>
                <p className="text-[10px] text-white/80 uppercase tracking-widest mt-1">Smart Management Portal</p>
            </div>

            <nav className="flex-1 p-4 space-y-1">
                {/* PM/CAL Module Group */}
                <div className="mb-2">
                    <button
                        onClick={() => setIsPMOpen(!isPMOpen)}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer text-white/70 hover:bg-white/10 hover:text-white group"
                    >
                        <div className="flex items-center space-x-3">
                            <Settings className="w-5 h-5 text-white/50 group-hover:text-white transition-colors" />
                            <span>PM/CAL</span>
                        </div>
                        {isPMOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>

                    {isPMOpen && (
                        <div className="space-y-1 mt-1 animate-in fade-in slide-in-from-top-1 duration-200">
                            {pmSubItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => onNavigate(item.id)}
                                    className={cn(
                                        "w-full flex items-center space-x-3 px-8 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer",
                                        active === item.id
                                            ? "bg-white/20 text-white shadow-lg backdrop-blur-sm"
                                            : "text-white/70 hover:bg-white/10 hover:text-white"
                                    )}
                                >
                                    <item.icon className="w-4 h-4" />
                                    <span>{item.label}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="h-px bg-white/10 my-4 mx-2" />

                {/* Top Level Modules */}
                {topLevelItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => onNavigate(item.id)}
                        className={cn(
                            "w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer",
                            active === item.id
                                ? "bg-white/20 text-white shadow-lg backdrop-blur-sm"
                                : "text-white/70 hover:bg-white/10 hover:text-white"
                        )}
                    >
                        <item.icon className="w-5 h-5" />
                        <span>{item.label}</span>
                    </button>
                ))}
            </nav>

            <div className="p-4 border-t border-white/20 relative group/footer">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-xs font-bold">
                            ATC
                        </div>
                        <div>
                            <p className="text-sm font-medium text-white">Smart Lab Tech</p>
                            <p className="text-xs text-white/60 font-medium">Administrator</p>
                        </div>
                    </div>
                    {/* DevTools Trigger */}
                    <button
                        onClick={() => setShowDevTools(true)}
                        className="text-white/20 hover:text-white transition-colors p-1 opacity-0 group-hover/footer:opacity-100"
                        title="Open Data Management Tool"
                    >
                        <Database className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* DevTools Modal */}
            {showDevTools && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-slate-800">
                        <div className="bg-slate-800 p-4 flex justify-between items-center text-white">
                            <div className="flex items-center gap-2">
                                <Database className="w-5 h-5 text-teal-400" />
                                <h3 className="font-bold">Data Management Tool</h3>
                            </div>
                            <button onClick={() => setShowDevTools(false)} className="text-white/60 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            {/* Master Data */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                    <Settings className="w-4 h-4" /> PM/CAL Master
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => exportData('master')}
                                        className="flex items-center justify-center gap-2 p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold transition-colors"
                                    >
                                        <Download className="w-3 h-3" /> Export JSON
                                    </button>
                                    <button
                                        onClick={() => masterImportRef.current.click()}
                                        className="flex items-center justify-center gap-2 p-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-colors"
                                    >
                                        <Upload className="w-3 h-3" /> Import JSON
                                    </button>
                                    <input type="file" ref={masterImportRef} onChange={(e) => importData('master', e)} className="hidden" accept=".json" />
                                </div>
                            </div>

                            {/* List Data */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                    <Calendar className="w-4 h-4" /> PM/CAL List
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => exportData('list')}
                                        className="flex items-center justify-center gap-2 p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold transition-colors"
                                    >
                                        <Download className="w-3 h-3" /> Export JSON
                                    </button>
                                    <button
                                        onClick={() => listImportRef.current.click()}
                                        className="flex items-center justify-center gap-2 p-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-colors"
                                    >
                                        <Upload className="w-3 h-3" /> Import JSON
                                    </button>
                                    <input type="file" ref={listImportRef} onChange={(e) => importData('list', e)} className="hidden" accept=".json" />
                                </div>
                            </div>

                            {/* Report Data */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4" /> Abnormality Reports
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => exportData('report')}
                                        className="flex items-center justify-center gap-2 p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold transition-colors"
                                    >
                                        <Download className="w-3 h-3" /> Export JSON
                                    </button>
                                    <button
                                        onClick={() => reportImportRef.current.click()}
                                        className="flex items-center justify-center gap-2 p-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-colors"
                                    >
                                        <Upload className="w-3 h-3" /> Import JSON
                                    </button>
                                    <input type="file" ref={reportImportRef} onChange={(e) => importData('report', e)} className="hidden" accept=".json" />
                                </div>
                            </div>
                        </div>
                        <div className="bg-slate-50 p-3 border-t border-slate-100 space-y-2">
                            <button
                                onClick={clearAllData}
                                className="w-full flex items-center justify-center gap-2 p-2.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-bold transition-colors border border-red-200"
                            >
                                <X className="w-3.5 h-3.5" /> Clear All Data & Reset
                            </button>
                            <p className="text-[10px] text-slate-400 text-center">Advanced Developer Tool - Use with Caution</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
