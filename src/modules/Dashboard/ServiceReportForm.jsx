import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Select } from '../../components/ui/Select';
import { Card } from '../../components/ui/Card';
import { Plus, Trash2, Upload, FileText, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function ServiceReportForm({ event, onSubmit, onCancel, initialData }) {
    const [reportData, setReportData] = useState(initialData || {
        reportType: event.PM && event.CAL ? 'PM/CAL' : (event.CAL ? 'Calibration' : 'PM'),
        serviceDate: format(new Date(), 'yyyy-MM-dd'),
        method: '',
        recorder: '',
        recorderDate: format(new Date(), 'yyyy-MM-dd'),
        verifier: '',
        verifierDate: '',
        approver: '',
        approverDate: '',
        standardReferences: '',
        results: [
            { id: 1, standard: '', indicated: '', error: '', uncertainty: '', tolerance: '', result: 'Pass' }
        ],
        files: []
    });

    const handleResultChange = (id, field, value) => {
        setReportData(prev => ({
            ...prev,
            results: prev.results.map(row =>
                row.id === id ? { ...row, [field]: value } : row
            )
        }));
    };

    const addResultRow = () => {
        setReportData(prev => ({
            ...prev,
            results: [
                ...prev.results,
                { id: Date.now(), standard: '', indicated: '', error: '', uncertainty: '', tolerance: '', result: 'Pass' }
            ]
        }));
    };

    const removeResultRow = (id) => {
        setReportData(prev => ({
            ...prev,
            results: prev.results.filter(row => row.id !== id)
        }));
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const newFile = e.target.files[0];
            setReportData(prev => ({
                ...prev,
                files: [...prev.files, newFile]
            }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(reportData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Header / Info */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="flex flex-wrap gap-6 mb-4">
                    <div className="flex items-center gap-2">
                        <input
                            type="radio"
                            id="type-cal"
                            name="reportType"
                            value="Calibration"
                            checked={reportData.reportType === 'Calibration'}
                            onChange={e => setReportData({ ...reportData, reportType: e.target.value })}
                            className="text-teal-600 focus:ring-teal-500"
                        />
                        <Label htmlFor="type-cal" className="cursor-pointer">Calibration</Label>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="radio"
                            id="type-pm"
                            name="reportType"
                            value="PM"
                            checked={reportData.reportType === 'PM'}
                            onChange={e => setReportData({ ...reportData, reportType: e.target.value })}
                            className="text-teal-600 focus:ring-teal-500"
                        />
                        <Label htmlFor="type-pm" className="cursor-pointer">PM</Label>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <Label>Equipment No.</Label>
                        <div className="p-2 bg-white rounded border border-slate-200 text-sm font-medium">{event.EquipmentCode || '-'}</div>
                    </div>
                    <div className="space-y-1">
                        <Label>Equipment Name</Label>
                        <div className="p-2 bg-white rounded border border-slate-200 text-sm font-medium">{event.EquipmentName}</div>
                    </div>
                    <div className="space-y-1">
                        <Label>PM/CAL Date</Label>
                        <Input
                            type="date"
                            value={reportData.serviceDate}
                            onChange={e => setReportData({ ...reportData, serviceDate: e.target.value })}
                        />
                    </div>
                    <div className="space-y-1">
                        <Label>Method / Provider</Label>
                        <Input
                            placeholder="e.g. Thai Korea Calibration Center Co., Ltd."
                            value={reportData.method}
                            onChange={e => setReportData({ ...reportData, method: e.target.value })}
                        />
                    </div>
                </div>
            </div>

            {/* Staff Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label className="text-xs uppercase text-slate-500 font-bold">Recorder (ผู้บันทึก)</Label>
                    <Input
                        placeholder="Name"
                        value={reportData.recorder}
                        onChange={e => setReportData({ ...reportData, recorder: e.target.value })}
                    />
                    <Input
                        type="date"
                        value={reportData.recorderDate}
                        onChange={e => setReportData({ ...reportData, recorderDate: e.target.value })}
                        className="text-xs"
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-xs uppercase text-slate-500 font-bold">Verifier (ผู้ตรวจสอบ)</Label>
                    <Input
                        placeholder="Name (Head of Dept)"
                        value={reportData.verifier}
                        onChange={e => setReportData({ ...reportData, verifier: e.target.value })}
                    />
                    <Input
                        type="date"
                        value={reportData.verifierDate}
                        onChange={e => setReportData({ ...reportData, verifierDate: e.target.value })}
                        className="text-xs"
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-xs uppercase text-slate-500 font-bold">Approver (ผู้อนุมัติ)</Label>
                    <Input
                        placeholder="Name (Manager/Director)"
                        value={reportData.approver}
                        onChange={e => setReportData({ ...reportData, approver: e.target.value })}
                    />
                    <Input
                        type="date"
                        value={reportData.approverDate}
                        onChange={e => setReportData({ ...reportData, approverDate: e.target.value })}
                        className="text-xs"
                    />
                </div>
            </div>

            {/* Standard Reference */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <Label className="flex items-center gap-2 mb-2 font-bold text-slate-700">
                    <FileText className="w-4 h-4" />
                    Standard Reference (Equipment/Material) Used:
                </Label>
                <textarea
                    className="w-full min-h-[60px] p-3 text-sm rounded-md border border-slate-300 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="Traceable to..."
                    value={reportData.standardReferences}
                    onChange={e => setReportData({ ...reportData, standardReferences: e.target.value })}
                />
            </div>

            {/* Results Table */}
            <div className="border rounded-lg overflow-hidden">
                <div className="bg-slate-100 p-3 border-b border-slate-200 flex justify-between items-center">
                    <h4 className="font-bold text-slate-700 text-sm">Measurement Results</h4>
                    <Button type="button" size="sm" onClick={addResultRow} variant="outline" className="h-7 text-xs gap-1">
                        <Plus className="w-3 h-3" /> Add Row
                    </Button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                            <tr>
                                <th className="p-2 border-b">Std Value</th>
                                <th className="p-2 border-b">Indicated</th>
                                <th className="p-2 border-b">Error</th>
                                <th className="p-2 border-b">Uncertainty (±)</th>
                                <th className="p-2 border-b">Tolerance</th>
                                <th className="p-2 border-b">Result</th>
                                <th className="p-2 border-b w-8"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {reportData.results.map((row) => (
                                <tr key={row.id}>
                                    <td className="p-2">
                                        <Input
                                            className="h-8 text-xs"
                                            value={row.standard}
                                            onChange={e => handleResultChange(row.id, 'standard', e.target.value)}
                                        />
                                    </td>
                                    <td className="p-2">
                                        <Input
                                            className="h-8 text-xs"
                                            value={row.indicated}
                                            onChange={e => handleResultChange(row.id, 'indicated', e.target.value)}
                                        />
                                    </td>
                                    <td className="p-2">
                                        <Input
                                            className="h-8 text-xs"
                                            value={row.error}
                                            onChange={e => handleResultChange(row.id, 'error', e.target.value)}
                                        />
                                    </td>
                                    <td className="p-2">
                                        <Input
                                            className="h-8 text-xs"
                                            value={row.uncertainty}
                                            onChange={e => handleResultChange(row.id, 'uncertainty', e.target.value)}
                                        />
                                    </td>
                                    <td className="p-2">
                                        <Input
                                            className="h-8 text-xs"
                                            value={row.tolerance}
                                            onChange={e => handleResultChange(row.id, 'tolerance', e.target.value)}
                                        />
                                    </td>
                                    <td className="p-2">
                                        <Select
                                            className="h-8 text-xs w-24"
                                            value={row.result}
                                            onChange={e => handleResultChange(row.id, 'result', e.target.value)}
                                        >
                                            <option value="Pass">Pass</option>
                                            <option value="Fail">Fail</option>
                                        </Select>
                                    </td>
                                    <td className="p-2 text-center">
                                        <button
                                            type="button"
                                            onClick={() => removeResultRow(row.id)}
                                            className="text-slate-400 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Attachments */}
            <div>
                <Label className="flex items-center gap-2 mb-2">
                    <Upload className="w-4 h-4" /> Attached Images
                </Label>
                <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors cursor-pointer relative text-center">
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileChange} accept="image/*" />
                    <p className="text-xs text-slate-500">Click to upload images</p>
                </div>
                {reportData.files.length > 0 && (
                    <div className="mt-2 space-y-1">
                        {reportData.files.map((f, i) => (
                            <div key={i} className="text-xs flex items-center gap-2 text-slate-600 bg-slate-50 p-1.5 rounded">
                                <FileText className="w-3 h-3" /> {f.name}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
                <Button type="submit" className="gradient-atc text-white hover:shadow-lg">
                    Save Report & Complete
                </Button>
            </div>
        </form>
    );
}
