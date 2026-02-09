import React, { useState, useRef } from 'react';
import { useLab } from '../../context/LabContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Database, Table as TableIcon, Code, Download, Upload, Trash2, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function DatabaseView() {
    const { state, overwriteDatabase, addCapability, deleteCapability, addEquipment, updateEquipment, deleteEquipment } = useLab();
    const { pmCalMaster, pmCalList, capabilities, equipmentMaster } = state;

    const [activeTab, setActiveTab] = useState('master'); // 'master', 'list', 'equipment', 'capability'
    const [viewMode, setViewMode] = useState('table'); // 'table' or 'json'
    const [editingItem, setEditingItem] = useState(null); // For Equipment Master Edit
    const [isAddModalOpen, setIsAddModalOpen] = useState(false); // For Equipment Master Add
    const [newCapability, setNewCapability] = useState(''); // For Capability Add

    const fileInputRef = useRef(null);

    // Determine active data based on tab
    let activeData = [];
    if (activeTab === 'master') activeData = pmCalMaster;
    else if (activeTab === 'list') {
        activeData = (pmCalList || []).map(item => ({
            // ... existing mapping logic ...
            EquipmentName: item.EquipmentName,
            EquipmentCode: item.EquipmentCode,
            Capability: item.Capability,
            Action: item.Action,
            PMby: item.PMby || pmCalMaster?.find(m => m.id === item.MasterID)?.PMby || '-',
            Month: item.Month,
            Year: item.Year,
            DueDate: item.DueDate,
            NewDueDate: item.NewDueDate || item.DueDate,
            CompleteDate: item.CompleteDate || '-',
            CompletedBy: item.CompletedBy || item.CompleteBy || '-',
            ApprovedBy: item.ApprovedBy || '-',
            DetailsOfComplete: item.DetailsOfComplete || item.EquipmentStatus || '-',
            Remark: item.Remark || '-',
            Reason: item.Reason || '-',
            Postponed: item.Postponed ? 'TRUE' : 'FALSE',
            PostponedBy: item.PostponedBy || '-',
            LeaderApprove: item.LeaderApprove ? 'TRUE' : 'FALSE',
            ...item,
            NewDueDate: item.NewDueDate || item.DueDate
        }));
    } else if (activeTab === 'equipment') {
        activeData = equipmentMaster;
    } else if (activeTab === 'capability') {
        activeData = capabilities; // Objects or Strings, TableView handles both
    }

    const exportData = () => {
        const data = activeTab === 'master' ? pmCalMaster
            : activeTab === 'list' ? pmCalList
                : activeTab === 'equipment' ? equipmentMaster
                    : capabilities;

        const filename = activeTab === 'master' ? 'pmCalMaster.json'
            : activeTab === 'list' ? 'pmCalList.json'
                : activeTab === 'equipment' ? 'equipmentMaster.json'
                    : 'capabilities.json';

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

    const importData = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target.result);
                let updates = {};

                if (activeTab === 'master') {
                    if (Array.isArray(json)) updates.pmCalMaster = json;
                    else throw new Error("File content must be an array of Master records");
                } else if (activeTab === 'list') {
                    if (Array.isArray(json)) {
                        updates.pmCalList = json.map(item => {
                            // Sanitize and derive missing fields (Ported from Sidebar logic)
                            let derivedMonth = item.Month;
                            let derivedYear = item.Year;

                            if (item.DueDate) {
                                const date = new Date(item.DueDate);
                                if (!isNaN(date.getTime())) {
                                    const monthName = date.toLocaleString('en-US', { month: 'long' });
                                    if (!derivedMonth || derivedMonth !== monthName) derivedMonth = monthName;
                                    if (!derivedYear || derivedYear !== date.getFullYear()) derivedYear = date.getFullYear();
                                }
                            }

                            return {
                                ...item,
                                Month: derivedMonth,
                                Year: Number(derivedYear),
                                NewDueDate: item.NewDueDate || item.DueDate
                            };
                        });
                    }
                    else throw new Error("File content must be an array of List items");
                } else if (activeTab === 'equipment') {
                    if (Array.isArray(json)) {
                        // Smart Mapping for External Structure (camelCase -> PascalCase)
                        const normalizedData = json.map(item => {
                            // Check if it matches the external structure (camelCase)
                            if (item.equipmentCode || item.equipmentName) {
                                // Try to resolve Capability Name from ID if possible
                                let capName = item.capabilityName || item.Capability;
                                if (!capName && item.capabilityId && capabilities.length > 0) {
                                    // loose comparison for string/number IDs
                                    const foundCap = capabilities.find(c => c._id == item.capabilityId || c.id == item.capabilityId);
                                    if (foundCap) capName = foundCap.capabilityName || foundCap.Capability || (typeof foundCap === 'string' ? foundCap : null);
                                }

                                return {
                                    ...item,
                                    // Enforce PascalCase for App Core Logic
                                    EquipmentName: item.equipmentName || item.EquipmentName,
                                    EquipmentCode: item.equipmentCode || item.EquipmentCode,
                                    Capability: capName || item.capabilityName || '-',
                                    CapabilityName: capName || item.capabilityName || '-',

                                    // Map Frequencies for handy display
                                    Frequency: item.pmFreq ? `${item.pmFreq} Months` : (item.calFreq ? `${item.calFreq} Months` : '-'),
                                    Model: item.model || item.Model,
                                    Manufacturer: item.manufacturer || item.Manufacturer
                                };
                            }
                            return item;
                        });
                        updates.equipmentMaster = normalizedData;
                    }
                    else throw new Error("File content must be an array of Equipment objects");
                } else if (activeTab === 'capability') {
                    if (Array.isArray(json)) updates.capabilities = json;
                    else throw new Error("File content must be an array of Capability objects or strings");
                }

                overwriteDatabase(updates);
                alert(`Successfully imported ${activeTab} data! (${json.length} records)`);
            } catch (error) {
                console.error("Import Error:", error);
                alert(`Failed to import: ${error.message}`);
            }
        };
        reader.readAsText(file);
        event.target.value = ''; // Reset input
    };

    const handleDelete = (item) => {
        if (!window.confirm("Are you sure you want to delete this item?")) return;

        if (activeTab === 'capability') {
            deleteCapability(item.Capability);
        } else if (activeTab === 'equipment') {
            deleteEquipment(item.id);
        }
        // Master/List delete logic not implemented per row yet, only clear all
    };

    const handleSaveEquipment = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());

        if (editingItem) {
            updateEquipment(editingItem.id, data);
        } else {
            addEquipment(data);
        }
        setEditingItem(null);
        setIsAddModalOpen(false);
    };

    const handleExportSource = () => {
        // Construct file content to match src/data/mockData.js format
        const fileContent = `export const dbCapabilitylist = ${JSON.stringify(capabilities, null, 4)};

export const dbLeaderGroup = {
    'Polymer structure': { name: 'Thermal & Polymer structure Group', emails: 'nattharm@scg.com' },
    'Rheology': { name: 'Flow & Rheology Group', emails: 'nattharm@scg.com' },
    'Morphology and FM': { name: 'Microscopy & Morphology and FM Group', emails: 'nattharm@scg.com' },
    'Small molecules': { name: 'Spectroscopy Group', emails: 'nattharm@scg.com' },
    'Morphology and FM': { name: 'Mechanical & Physical Group', emails: 'nattharm@scg.com' },
    'Thermal Analysis': { name: 'Thermal Analysis Group', emails: 'nattharm@scg.com' },
    'Mechanical Testing': { name: 'Mechanical Testing Group', emails: 'nattharm@scg.com' },
    'Microscopy': { name: 'Microscopy Group', emails: 'nattharm@scg.com' }
};

export const dbEquipmentMaster = ${JSON.stringify(equipmentMaster, null, 4)};

export const initialPMCALMaster = ${JSON.stringify(pmCalMaster, null, 4)};

export const initialPMCALlist = ${JSON.stringify(pmCalList, null, 4)};
`;

        const blob = new Blob([fileContent], { type: 'text/javascript' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'mockData.js';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleFactoryReset = () => {
        if (window.confirm("⚠️ FACTORY RESET WARNING ⚠️\n\nThis will wipe ALL data in your browser's LocalStorage and reload it from the 'mockData.js' file.\n\nUse this if you have updated the code/file and want to see the changes.\n\nAre you sure?")) {
            // Clear specific keys related to this app
            localStorage.removeItem('atc_pmCalMaster');
            localStorage.removeItem('atc_pmCalList');
            localStorage.removeItem('atc_capabilities');
            localStorage.removeItem('atc_equipmentMaster');
            localStorage.removeItem('atc_abnormalityReports');
            localStorage.removeItem('atc_troubleshootingCases');

            window.location.reload();
        }
    };

    const handleAddCapability = (e) => {
        e.preventDefault();
        if (newCapability.trim()) {
            addCapability(newCapability.trim());
            setNewCapability('');
        }
    };

    const TableView = ({ data }) => {
        if (!data || data.length === 0) {
            return (
                <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-lg border border-slate-200 border-dashed">
                    No records found in this database.
                </div>
            );
        }

        // Dynamic Header Generation
        let headers = [];
        if (activeTab === 'capability') {
            const allKeys = new Set();
            data.forEach(item => {
                if (typeof item === 'object') {
                    Object.keys(item).forEach(key => key !== 'id' && key !== '_id' && key !== '__v' && allKeys.add(key));
                } else {
                    allKeys.add('Capability');
                }
            });
            const priority = ['capabilityName', 'shortName', 'capabilityDesc', 'Capability'];
            const sortedKeys = Array.from(allKeys).sort((a, b) => {
                const idxA = priority.indexOf(a);
                const idxB = priority.indexOf(b);
                if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                if (idxA !== -1) return -1;
                if (idxB !== -1) return 1;
                return a.localeCompare(b);
            });
            headers = [...sortedKeys, 'Actions'];
        } else if (activeTab === 'equipment') {
            // Collect all unique keys from all records to handle sparse data/new columns
            const allKeys = new Set();
            data.forEach(item => Object.keys(item).forEach(key => key !== 'id' && allKeys.add(key)));

            // Prioritize specific fields for better UX
            const priority = ['EquipmentName', 'EquipmentCode', 'Capability', 'Frequency', 'Model', 'Manufacturer', 'CapabilityName'];
            const sortedKeys = Array.from(allKeys).sort((a, b) => {
                const idxA = priority.indexOf(a);
                const idxB = priority.indexOf(b);
                if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                if (idxA !== -1) return -1;
                if (idxB !== -1) return 1;
                return a.localeCompare(b);
            });
            headers = [...sortedKeys, 'Actions'];
        } else {
            headers = Object.keys(data[0] || {});
        }

        return (
            <div className="border rounded-lg overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50">
                            {headers.map(header => (
                                <TableHead key={header} className="whitespace-nowrap font-bold text-slate-700">
                                    {header}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((row, i) => (
                            <TableRow key={i} className="hover:bg-slate-50">
                                {headers.map(header => {
                                    if (header === 'Actions') {
                                        if (activeTab === 'capability') {
                                            return (
                                                <TableCell key={`${i}-actions`} className="whitespace-nowrap">
                                                    <button onClick={() => handleDelete(row)} className="text-red-500 hover:text-red-700 p-1">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </TableCell>
                                            );
                                        } else if (activeTab === 'equipment') {
                                            return (
                                                <TableCell key={`${i}-actions`} className="flex gap-2 whitespace-nowrap">
                                                    <button
                                                        onClick={() => { setEditingItem(row); setIsAddModalOpen(true); }}
                                                        className="text-blue-500 hover:text-blue-700 p-1 text-xs font-bold border border-blue-200 rounded px-2"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button onClick={() => handleDelete(row)} className="text-red-500 hover:text-red-700 p-1">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </TableCell>
                                            );
                                        }
                                        return null; // Should not happen if headers are correctly generated
                                    } else {
                                        let cellContent;
                                        if (activeTab === 'capability' && typeof row === 'string' && header === 'Capability') {
                                            cellContent = row;
                                        } else {
                                            cellContent = row[header];
                                        }
                                        return (
                                            <TableCell key={`${i}-${header}`} className="whitespace-nowrap max-w-[200px] truncate">
                                                {typeof cellContent === 'object' && cellContent !== null ? JSON.stringify(cellContent) : String(cellContent || '-')}
                                            </TableCell>
                                        );
                                    }
                                })}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        );
    };

    const JsonView = ({ data }) => (
        <div className="bg-slate-900 text-green-400 p-6 rounded-lg shadow-inner overflow-auto max-h-[600px] font-mono text-xs">
            <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
    );

    return (
        <div className="space-y-6 relative">
            <div className="gradient-atc p-6 rounded-xl shadow-lg">
                <div className="flex items-center justify-between text-white">
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <Database className="w-6 h-6" /> Database Management
                        </h2>
                        <p className="text-sm text-white/90 mt-1">View and Manage Master Data & Transactions</p>
                    </div>
                    {/* View Toggles */}
                    <div className="flex gap-2">
                        <button onClick={() => setViewMode('table')} className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all", viewMode === 'table' ? "bg-white text-slate-800 shadow-lg" : "bg-white/10 text-white hover:bg-white/20")}>
                            <TableIcon className="w-4 h-4" /> Table
                        </button>
                        <button onClick={() => setViewMode('json')} className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all", viewMode === 'json' ? "bg-white text-slate-800 shadow-lg" : "bg-white/10 text-white hover:bg-white/20")}>
                            <Code className="w-4 h-4" /> JSON
                        </button>
                    </div>
                </div>
            </div>

            <Card className="border-slate-200 shadow-sm">
                <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-0">
                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-0">
                        {/* Tabs */}
                        <div className="flex gap-1 overflow-x-auto pb-0">
                            {['master', 'list', 'equipment', 'capability'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={cn(
                                        "px-4 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap capitalize",
                                        activeTab === tab ? "border-teal-500 text-teal-700 bg-teal-50/50" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                                    )}
                                >
                                    {tab === 'master' ? 'PM/CAL Master' : tab === 'list' ? 'Transaction List' : tab === 'equipment' ? 'Equipment Master' : 'Capability'}
                                    <span className="ml-2 text-xs opacity-60">
                                        ({tab === 'master' ? pmCalMaster?.length : tab === 'list' ? pmCalList?.length : tab === 'equipment' ? equipmentMaster?.length : capabilities?.length})
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pb-2 items-center">
                            {/* Add New Button for Equipment/Capability */}
                            {(activeTab === 'equipment' || activeTab === 'capability') && (
                                <button
                                    onClick={() => {
                                        if (activeTab === 'equipment') {
                                            setEditingItem(null);
                                            setIsAddModalOpen(true);
                                        } else {
                                            // Capability add logic inline or modal? Inline is simpler for single field
                                            const name = prompt("Enter new Capability Name:");
                                            if (name) addCapability(name);
                                        }
                                    }}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-teal-500 text-white rounded-md text-xs font-bold hover:bg-teal-600 shadow-sm transition-colors mr-2"
                                >
                                    + Add New {activeTab === 'equipment' ? 'Equipment' : 'Capability'}
                                </button>
                            )}

                            {/* Clear Data */}
                            {(activeTab === 'master' || activeTab === 'list') && (
                                <button
                                    onClick={() => {
                                        if (window.confirm(`Delete ALL records in ${activeTab}?`)) {
                                            const updates = activeTab === 'master' ? { pmCalMaster: [] } : { pmCalList: [] };
                                            overwriteDatabase(updates);
                                        }
                                    }}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-md text-xs font-bold hover:bg-red-100 transition-colors mr-2"
                                >
                                    <Trash2 className="w-3.5 h-3.5" /> Clear
                                </button>
                            )}

                            {/* Import */}
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-md text-xs font-bold hover:bg-slate-50 hover:text-teal-600 transition-colors mr-2"
                            >
                                <Upload className="w-3.5 h-3.5" /> Import
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={importData}
                                accept=".json"
                                className="hidden"
                            />

                            {/* Export */}
                            <button onClick={exportData} className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-md text-xs font-bold hover:bg-slate-200 transition-colors">
                                <Download className="w-3.5 h-3.5" /> Export JSON
                            </button>

                            {/* --- New Persistence Tools --- */}
                            <div className="h-6 w-px bg-slate-200 mx-2" />

                            <button
                                onClick={handleExportSource}
                                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-md text-xs font-bold hover:bg-indigo-100 transition-colors"
                                title="Download mockData.js to replace source file"
                            >
                                <Code className="w-3.5 h-3.5" /> Save to Code
                            </button>

                            <button
                                onClick={handleFactoryReset}
                                className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-md text-xs font-bold hover:bg-red-100 transition-colors"
                                title="Clear Browser Storage and Reload from File"
                            >
                                <Trash2 className="w-3.5 h-3.5" /> Factory Reset
                            </button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    {viewMode === 'table' ? <TableView data={activeData} /> : <JsonView data={activeData} />}
                </CardContent>
            </Card>

            {/* Equipment Add/Edit Modal */}
            {isAddModalOpen && activeTab === 'equipment' && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800">{editingItem ? 'Edit Equipment' : 'Add New Equipment'}</h3>
                            <button onClick={() => setIsAddModalOpen(false)}><X className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
                        </div>
                        <form onSubmit={handleSaveEquipment} className="p-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Equipment Name <span className="text-red-500">*</span></label>
                                <input name="EquipmentName" defaultValue={editingItem?.EquipmentName} required className="w-full border-slate-300 rounded-md focus:ring-teal-500 focus:border-teal-500" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Equipment Code <span className="text-red-500">*</span></label>
                                <input name="EquipmentCode" defaultValue={editingItem?.EquipmentCode} required className="w-full border-slate-300 rounded-md focus:ring-teal-500 focus:border-teal-500" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Capability <span className="text-red-500">*</span></label>
                                <select name="CapabilityName" defaultValue={editingItem?.CapabilityName || editingItem?.Capability} required className="w-full border-slate-300 rounded-md focus:ring-teal-500 focus:border-teal-500">
                                    <option value="">Select Capability</option>
                                    {capabilities.map((c, i) => {
                                        const val = typeof c === 'string' ? c : c.capabilityName;
                                        return <option key={i} value={val}>{val}</option>;
                                    })}
                                </select>
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 rounded-lg">Cancel</button>
                                <button type="submit" className="px-4 py-2 text-sm bg-teal-500 text-white font-bold rounded-lg hover:bg-teal-600">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
