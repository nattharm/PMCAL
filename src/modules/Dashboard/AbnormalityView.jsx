import React, { useState } from 'react';
import { useLab } from '../../context/LabContext';
import { cn } from '../../lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Select } from '../../components/ui/Select';
import { AlertCircle, Calendar, Clock, ArrowRight, CheckCircle, Send, X, FileText, User, Mail } from 'lucide-react';
import { dbLeaderGroup } from '../../data/mockData';

export default function AbnormalityView() {
    const { state, updateAbnormality } = useLab();
    const { abnormalityReports } = state;
    const [selectedReport, setSelectedReport] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formData, setFormData] = useState({
        RootCause: '',
        ActionPlan: '',
        Impact: 'Low',
        VerifiedBy: ''
    });

    const handleOpenCase = (report) => {
        setSelectedReport(report);
        setIsFormOpen(true);
    };

    const handleSubmitCase = (e) => {
        e.preventDefault();

        // Find Leader email
        const leaderInfo = dbLeaderGroup[selectedReport.Capability] || { name: 'Capability Leader', emails: 'nattharm@scg.com' };

        // Simulate Email
        const emailSubject = `[URGENT] New Abnormality Case: ${selectedReport.EquipmentName}`;
        const emailBody = `
Dear ${leaderInfo.name},

An abnormality case has been officially reported for:
Equipment: ${selectedReport.EquipmentName} (${selectedReport.EquipmentCode})
Original Date: ${selectedReport.OriginalDate}
New Date: ${selectedReport.NewDate}

Root Cause: ${formData.RootCause}
Action Plan: ${formData.ActionPlan}
Impact Level: ${formData.Impact}

Please review and verify the case in ATC SMART LAB.
        `.trim();

        console.log("SENDING ABNORMALITY EMAIL...", {
            to: leaderInfo.emails,
            subject: emailSubject,
            body: emailBody
        });

        alert(`Abnormality Case Submitted!\n\nNotification sent to: ${leaderInfo.name} (${leaderInfo.emails})`);

        // Update Status in Context
        updateAbnormality(selectedReport.id, {
            ...formData,
            Status: 'Reported',
            SubmittedAt: new Date().toISOString()
        });

        setIsFormOpen(false);
        setSelectedReport(null);
        setFormData({ RootCause: '', ActionPlan: '', Impact: 'Low', VerifiedBy: '' });
    };

    return (
        <div className="space-y-6">
            <div className="gradient-atc p-6 rounded-xl shadow-lg">
                <div className="flex justify-between items-center text-white">
                    <div>
                        <h2 className="text-2xl font-bold">Abnormality Reports</h2>
                        <p className="text-sm text-white/90 mt-1">Formalize and track schedule deviations</p>
                    </div>
                    <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm">
                        <AlertCircle className="w-6 h-6" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* List Section */}
                <div className="lg:col-span-12 space-y-4">
                    {abnormalityReports.length === 0 ? (
                        <Card className="border-none shadow-sm bg-slate-50">
                            <CardContent className="flex flex-col items-center py-12 text-slate-400">
                                <Clock className="w-12 h-12 mb-4 opacity-20" />
                                <p>No abnormality cases reported yet.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        [...abnormalityReports].reverse().map((report) => (
                            <Card key={report.id} className={cn(
                                "hover:shadow-md transition-all border-l-4",
                                report.Status === 'Draft' ? "border-l-amber-500 bg-amber-50/30" : "border-l-emerald-500"
                            )}>
                                <CardContent className="p-6">
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                        <div className="space-y-1 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="text-lg font-bold text-slate-900">{report.EquipmentName}</h3>
                                                <span className={cn(
                                                    "px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider",
                                                    report.Status === 'Draft' ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                                                )}>
                                                    {report.Status}
                                                </span>
                                                <span className={cn(
                                                    "px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider",
                                                    report.Type === 'Troubleshooting' ? "bg-rose-100 text-rose-700" : "bg-blue-100 text-blue-700"
                                                )}>
                                                    {report.Type || 'Postpone'}
                                                </span>
                                                {report.EquipmentStatus && (
                                                    <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-purple-100 text-purple-700 uppercase tracking-wider">
                                                        {report.EquipmentStatus}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500 font-medium">
                                                {report.Capability} • {report.EquipmentCode} • Reported on {new Date(report.CreatedAt || Date.now()).toLocaleDateString()}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-4 bg-white/50 p-2 rounded-lg border border-slate-100 shadow-sm">
                                            <div className="text-center px-2">
                                                <span className="text-[9px] uppercase text-slate-400 font-bold block">Original</span>
                                                <span className="text-xs font-semibold text-slate-400 line-through">{report.OriginalDate}</span>
                                            </div>
                                            <ArrowRight className="w-4 h-4 text-slate-300" />
                                            <div className="text-center px-2">
                                                <span className="text-[9px] uppercase text-teal-600 font-bold block">Revised</span>
                                                <span className="text-xs font-bold text-teal-700">{report.NewDate}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {report.Status === 'Draft' ? (
                                                <Button
                                                    onClick={() => handleOpenCase(report)}
                                                    className="bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-200"
                                                    size="sm"
                                                >
                                                    <Send className="w-4 h-4 mr-2" />
                                                    Open Case
                                                </Button>
                                            ) : (
                                                <div className="flex items-center text-emerald-600 font-bold text-xs bg-emerald-50 px-3 py-2 rounded-full border border-emerald-100">
                                                    <CheckCircle className="w-4 h-4 mr-2" />
                                                    Case Reported
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                                        <div className="space-y-1">
                                            <span className="text-[10px] uppercase text-slate-400 font-bold flex items-center gap-1">
                                                <AlertCircle className="w-3 h-3" /> Initial Reason
                                            </span>
                                            <p className="text-xs text-slate-600 italic">"{report.Reason}"</p>
                                        </div>
                                        {report.Status === 'Reported' && (
                                            <div className="space-y-1">
                                                <span className="text-[10px] uppercase text-emerald-600 font-bold flex items-center gap-1">
                                                    <CheckCircle className="w-3 h-3" /> Action Plan
                                                </span>
                                                <p className="text-xs text-slate-700 font-medium">{report.ActionPlan}</p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>

            {/* Abnormality Reporting Form Modal */}
            {isFormOpen && selectedReport && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <Card className="w-full max-w-xl shadow-2xl animate-in zoom-in-95 duration-200">
                        <CardHeader className="gradient-atc text-white rounded-t-xl py-6 relative">
                            <button
                                onClick={() => setIsFormOpen(false)}
                                className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                            <CardTitle className="flex items-center gap-3">
                                <FileText className="w-6 h-6" />
                                Reporting Abnormality Case
                            </CardTitle>
                            <p className="text-white/80 text-xs mt-1">Please provide formal details for QA/QC verification.</p>
                        </CardHeader>
                        <CardContent className="p-6">
                            <form onSubmit={handleSubmitCase} className="space-y-5">
                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-600 grid grid-cols-2 gap-4">
                                    <div><span className="font-bold text-slate-800">Equipment:</span> {selectedReport.EquipmentName}</div>
                                    <div><span className="font-bold text-slate-800">Capability:</span> {selectedReport.Capability}</div>
                                    <div><span className="font-bold text-slate-800">Original Date:</span> {selectedReport.OriginalDate}</div>
                                    <div><span className="font-bold text-slate-800">Reason:</span> {selectedReport.Reason}</div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4 text-rose-500" />
                                        Root Cause Analysis <span className="text-rose-500">*</span>
                                    </Label>
                                    <textarea
                                        className="w-full min-h-[80px] p-3 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                                        placeholder="Detailed analysis of why the deviation occurred..."
                                        value={formData.RootCause}
                                        onChange={e => setFormData({ ...formData, RootCause: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-teal-500" />
                                        Correction & Action Plan <span className="text-teal-500">*</span>
                                    </Label>
                                    <textarea
                                        className="w-full min-h-[80px] p-3 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                                        placeholder="Steps taken to prevent recurrence and mitigation plan..."
                                        value={formData.ActionPlan}
                                        onChange={e => setFormData({ ...formData, ActionPlan: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Impact Level</Label>
                                        <Select value={formData.Impact} onChange={e => setFormData({ ...formData, Impact: e.target.value })}>
                                            <option value="Low">Low - No impact on production</option>
                                            <option value="Medium">Medium - Minimal schedule impact</option>
                                            <option value="High">High - Critical operation impact</option>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Point of Contact</Label>
                                        <Input
                                            placeholder="Your Name"
                                            value={formData.VerifiedBy}
                                            onChange={e => setFormData({ ...formData, VerifiedBy: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
                                    <Mail className="w-5 h-5 text-blue-500 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-bold text-blue-800">Final Submission Approval</p>
                                        <p className="text-[10px] text-blue-600 mt-1">
                                            Upon clicking "Confirm & Send Report", an official email case will be sent to the Capability Leader for formal verification and schedule override.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <Button variant="ghost" type="button" onClick={() => setIsFormOpen(false)}>Cancel</Button>
                                    <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white px-8 font-bold shadow-lg shadow-teal-100">
                                        Confirm & Send Report
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
