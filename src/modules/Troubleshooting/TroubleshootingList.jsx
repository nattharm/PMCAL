import React, { useState } from 'react';
import { useLab } from '../../context/LabContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Search, Plus, AlertCircle, CheckCircle2, Clock, Filter, ChevronRight, User } from 'lucide-react';
import TroubleshootingForm from './TroubleshootingForm';

export default function TroubleshootingList() {
    const { state } = useLab();
    const { troubleshootingCases } = state;
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);

    const filteredCases = troubleshootingCases.filter(c =>
        c.Title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.Equipment.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.EquipmentCode.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusColor = (status) => {
        switch (status) {
            case 'Resolved': return 'bg-green-100 text-green-700 border-green-200';
            case 'In Progress': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'Open': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Resolved': return <CheckCircle2 className="w-4 h-4" />;
            case 'In Progress': return <Clock className="w-4 h-4" />;
            case 'Open': return <AlertCircle className="w-4 h-4" />;
            default: return null;
        }
    };

    if (showForm) {
        return <TroubleshootingForm onCancel={() => setShowForm(false)} />;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Troubleshooting Cases</h2>
                    <p className="text-slate-500">Track and manage equipment technical issues</p>
                </div>
                <Button
                    onClick={() => setShowForm(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" /> Issue New Case
                </Button>
            </div>

            <div className="flex gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by title, equipment or code..."
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button variant="ghost" className="border border-slate-200 bg-white flex items-center gap-2">
                    <Filter className="w-4 h-4" /> Filter
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {filteredCases.length > 0 ? (
                    filteredCases.map((c) => (
                        <Card key={c.id} className="hover:shadow-md transition-shadow cursor-pointer border-slate-200 group">
                            <CardContent className="p-0">
                                <div className="p-5 flex items-start justify-between">
                                    <div className="space-y-3 flex-1">
                                        <div className="flex items-center gap-3">
                                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${getStatusColor(c.Status)} flex items-center gap-1`}>
                                                {getStatusIcon(c.Status)} {c.Status}
                                            </span>
                                            <span className="text-xs font-mono text-slate-400">{c.id}</span>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{c.Title}</h3>
                                            <p className="text-sm text-slate-500 mt-1 line-clamp-1">{c.Problem}</p>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-slate-500">
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                                                <span className="font-medium text-slate-700">{c.Equipment}</span>
                                                <span className="text-slate-400">({c.EquipmentCode})</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <User className="w-3.5 h-3.5" />
                                                <span>{c.Technician}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="w-3.5 h-3.5" />
                                                <span>{new Date(c.Date).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="pl-4 self-center text-slate-300 group-hover:text-blue-400 transition-colors">
                                        <ChevronRight className="w-6 h-6" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
                        <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900">No cases found</h3>
                        <p className="text-slate-500">Try adjusting your search or issue a new case.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
