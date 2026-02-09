import React, { useState, useEffect } from 'react';
import { useLab } from '../../context/LabContext';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../components/ui/Card';
import { Label } from '../../components/ui/Label';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { AlertCircle, CheckCircle2, Clock } from 'lucide-react';

export default function TroubleshootingForm({ onCancel }) {
    const { state, createTroubleshooting } = useLab();
    const { capabilities, equipmentMaster } = state;

    const [formData, setFormData] = useState({
        id: `CASE-${Math.floor(1000 + Math.random() * 9000)}`,
        Title: '',
        Date: new Date().toISOString().split('T')[0],
        CapabilityName: '',
        Equipment: '',
        EquipmentCode: '',
        Problem: '',
        RootCause: '',
        Countermeasure: '',
        Status: 'Open',
        Technician: ''
    });

    const [filteredEquipments, setFilteredEquipments] = useState([]);

    useEffect(() => {
        if (formData.CapabilityName) {
            const filtered = equipmentMaster.filter(e => e.CapabilityName === formData.CapabilityName);
            setFilteredEquipments(filtered);
        } else {
            setFilteredEquipments([]);
        }
    }, [formData.CapabilityName, equipmentMaster]);

    useEffect(() => {
        if (formData.Equipment) {
            const selected = equipmentMaster.find(e => e.EquipmentName === formData.Equipment);
            if (selected) {
                setFormData(prev => ({ ...prev, EquipmentCode: selected.EquipmentCode }));
            }
        }
    }, [formData.Equipment, equipmentMaster]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const isFormValid = () => {
        return (
            formData.Title &&
            formData.CapabilityName &&
            formData.Equipment &&
            formData.Problem &&
            formData.Status &&
            formData.Technician
        );
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        createTroubleshooting(formData);
        alert("Troubleshooting Case Issued Successfully!");
        if (onCancel) onCancel();
    };

    return (
        <Card className="border-blue-100 shadow-lg">
            <CardHeader className="bg-slate-50/50">
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="text-blue-700">Issue Troubleshooting Case</CardTitle>
                        <p className="text-sm text-slate-500 mt-1">Document equipment issues and resolution steps</p>
                    </div>
                    <div className="text-right">
                        <span className="text-xs font-mono bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            {formData.id}
                        </span>
                    </div>
                </div>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-6 pt-6">
                    <div className="space-y-2">
                        <Label>Case Title</Label>
                        <Input
                            name="Title"
                            value={formData.Title}
                            onChange={handleChange}
                            placeholder="Briefly describe the issue (e.g. Pump leak, Calibration error)"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label>Date</Label>
                            <Input
                                type="date"
                                name="Date"
                                value={formData.Date}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Technician / Reporter</Label>
                            <Input
                                name="Technician"
                                value={formData.Technician}
                                onChange={handleChange}
                                placeholder="Your name"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label>Capability</Label>
                            <Select name="CapabilityName" value={formData.CapabilityName} onChange={handleChange} required>
                                <option value="">Select Capability</option>
                                {capabilities.map((c, i) => {
                                    const val = typeof c === 'string' ? c : c.capabilityName;
                                    return <option key={i} value={val}>{val}</option>;
                                })}
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Equipment</Label>
                            <Select name="Equipment" value={formData.Equipment} onChange={handleChange} required disabled={!formData.CapabilityName}>
                                <option value="">Select Equipment</option>
                                {filteredEquipments.map(e => <option key={e.id} value={e.EquipmentName}>{e.EquipmentName}</option>)}
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label>Equipment Code</Label>
                            <Input value={formData.EquipmentCode} readOnly className="bg-slate-50 text-slate-500" />
                        </div>
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select name="Status" value={formData.Status} onChange={handleChange} required>
                                <option value="Open">Open</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Resolved">Resolved</option>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Problem Description (Symptoms)</Label>
                        <textarea
                            name="Problem"
                            value={formData.Problem}
                            onChange={handleChange}
                            className="w-full min-h-[100px] p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                            placeholder="What happened? What were the symptoms?"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label>Root Cause (Optional)</Label>
                            <textarea
                                name="RootCause"
                                value={formData.RootCause}
                                onChange={handleChange}
                                className="w-full min-h-[80px] p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                                placeholder="Root cause if known..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Countermeasure (Optional)</Label>
                            <textarea
                                name="Countermeasure"
                                value={formData.Countermeasure}
                                onChange={handleChange}
                                className="w-full min-h-[80px] p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                                placeholder="Steps taken to fix the issue..."
                            />
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end space-x-4 bg-slate-50/50 p-6 rounded-b-xl border-t border-slate-100">
                    <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
                    <Button type="submit" disabled={!isFormValid()} className="bg-blue-600 hover:bg-blue-700 text-white">Issue Case</Button>
                </CardFooter>
            </form>
        </Card>
    );
}
