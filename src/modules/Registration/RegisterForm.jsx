import React, { useState, useEffect } from 'react';
import { useLab } from '../../context/LabContext';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../components/ui/Card';
import { Label } from '../../components/ui/Label';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';

export default function RegisterForm() {
    const { state, registerMaster, bulkImportMaster } = useLab();
    const { capabilities, equipmentMaster, pmCalMaster } = state;

    // File input reference for import
    const fileInputRef = React.useRef(null);

    // Capability Mapping Dictionary for Auto-Correction
    const CAPABILITY_MAPPINGS = {
        "Thermal Analysis": "Microstructure",
        "Microscopy": "Imaging",
        "Spectroscopy": "Small molecules",
        "Chromatography": "Small molecules",
        "Mechanical Testing": "Mesostructure",
        "Physical Testing": "Mesostructure"
    };

    const [separateDetails, setSeparateDetails] = useState(false);
    const [formData, setFormData] = useState({
        CapabilityName: '',
        Equipment: '',
        EquipmentCode: '',
        DocumentCode: '',
        Action: '',
        Frequency: 12,
        ServiceTime: 1,
        NextDueDate: '',
        PM: false,
        CAL: false,
        PMby: 'Vendor Service',
        // Additional fields for split details
        FrequencyPM: 12,
        NextDueDatePM: '',
        FrequencyCAL: 6,
        NextDueDateCAL: ''
    });

    const [filteredEquipments, setFilteredEquipments] = useState([]);

    // Filter Equipment based on Context
    useEffect(() => {
        if (formData.CapabilityName) {
            const filtered = equipmentMaster.filter(e => e.CapabilityName === formData.CapabilityName);
            setFilteredEquipments(filtered);
        } else {
            setFilteredEquipments([]);
        }
    }, [formData.CapabilityName, equipmentMaster]);

    // Auto-fill codes
    useEffect(() => {
        if (formData.Equipment) {
            const selected = equipmentMaster.find(e => e.EquipmentName === formData.Equipment);
            if (selected) {
                setFormData(prev => ({
                    ...prev,
                    EquipmentCode: selected.EquipmentCode,
                    DocumentCode: selected.operationDocument || selected.DocumentCode || ''
                }));
            }
        } else {
            setFormData(prev => ({
                ...prev,
                EquipmentCode: '',
                DocumentCode: ''
            }));
        }
    }, [formData.Equipment, equipmentMaster]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Check if form is valid (all required fields filled)
    const isFormValid = () => {
        const basicValid = (
            formData.CapabilityName &&
            formData.Equipment &&
            formData.Action &&
            formData.ServiceTime > 0 &&
            (formData.PM || formData.CAL)
        );

        if (!basicValid) return false;

        if (separateDetails && formData.PM && formData.CAL) {
            return (
                formData.FrequencyPM > 0 &&
                formData.NextDueDatePM &&
                formData.FrequencyCAL > 0 &&
                formData.NextDueDateCAL
            );
        } else {
            return formData.Frequency > 0 && formData.NextDueDate;
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (separateDetails && formData.PM && formData.CAL) {
            // Register as two separate items
            const itemPM = {
                ...formData,
                Action: `${formData.Action} (PM)`,
                PM: true,
                CAL: false,
                Frequency: formData.FrequencyPM,
                NextDueDate: formData.NextDueDatePM
            };

            const itemCAL = {
                ...formData,
                Action: `${formData.Action} (CAL)`,
                PM: false,
                CAL: true,
                Frequency: formData.FrequencyCAL,
                NextDueDate: formData.NextDueDateCAL
            };

            // Clean up temporary fields
            delete itemPM.FrequencyPM; delete itemPM.NextDueDatePM;
            delete itemPM.FrequencyCAL; delete itemPM.NextDueDateCAL;
            delete itemCAL.FrequencyPM; delete itemCAL.NextDueDatePM;
            delete itemCAL.FrequencyCAL; delete itemCAL.NextDueDateCAL;

            bulkImportMaster([itemPM, itemCAL]);
            alert("Registered 2 separate schedules successfully!");

        } else {
            // Register as single item
            if (formData.Frequency <= 0) {
                alert("Frequency must be greater than 0");
                return;
            }
            registerMaster(formData);
            alert("Maintenance Logic Registered Successfully!");
        }

        // Reset form
        setFormData({
            CapabilityName: '',
            Equipment: '',
            EquipmentCode: '',
            DocumentCode: '',
            Action: '',
            Frequency: 12,
            ServiceTime: 1,
            NextDueDate: '',
            PM: false,
            CAL: false,
            PMby: 'Vendor Service',
            FrequencyPM: 12,
            NextDueDatePM: '',
            FrequencyCAL: 6,
            NextDueDateCAL: ''
        });
        setSeparateDetails(false);
    };

    // Handle Import from JSON file
    const handleImport = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);

                // Ensure data is an array
                const dataArray = Array.isArray(data) ? data : [data];

                // Apply capability mapping to each item
                const correctedData = dataArray.map(item => {
                    const correctedItem = { ...item };

                    // Auto-correct CapabilityName if it exists
                    if (correctedItem.CapabilityName && CAPABILITY_MAPPINGS[correctedItem.CapabilityName]) {
                        correctedItem.CapabilityName = CAPABILITY_MAPPINGS[correctedItem.CapabilityName];
                    }

                    // Auto-correct Capability if it exists (for backwards compatibility)
                    if (correctedItem.Capability && CAPABILITY_MAPPINGS[correctedItem.Capability]) {
                        correctedItem.Capability = CAPABILITY_MAPPINGS[correctedItem.Capability];
                    }

                    return correctedItem;
                });

                // Bulk import the corrected data
                bulkImportMaster(correctedData);

                alert(`Successfully imported ${correctedData.length} master record(s) with auto-corrected capability names!`);

                // Reset file input
                event.target.value = '';
            } catch (error) {
                console.error('Import error:', error);
                alert('Error importing file. Please ensure it is a valid JSON file.');
            }
        };

        reader.readAsText(file);
    };

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="gradient-atc p-6 rounded-xl shadow-lg">
                <div className="flex items-center justify-between text-white">
                    <div>
                        <h2 className="text-2xl font-bold">Register PM/CAL</h2>
                        <p className="text-sm text-white/90 mt-1">Create new maintenance schedule for equipment</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Import and Masters count removed as requested */}
                    </div>
                </div>
            </div>

            {/* Form Card */}
            <Card className="border-0 shadow-md ring-1 ring-slate-200 overflow-hidden">
                <form onSubmit={handleSubmit}>
                    <CardContent className="p-8 space-y-8">
                        {/* Equipment Selection Section */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                                <div className="w-1 h-5 bg-teal-500 rounded-full" />
                                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Equipment Details</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-slate-700">Capability <span className="text-red-500">*</span></Label>
                                    <Select
                                        name="CapabilityName"
                                        value={formData.CapabilityName}
                                        onChange={handleChange}
                                        required
                                        className="border-slate-300 focus:border-teal-500 focus:ring-teal-500"
                                    >
                                        <option value="">Select Capability</option>
                                        {capabilities.map(c => {
                                            const val = typeof c === 'string' ? c : c.capabilityName;
                                            return <option key={val} value={val}>{val}</option>;
                                        })}
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-slate-700">Equipment <span className="text-red-500">*</span></Label>
                                    <Select
                                        name="Equipment"
                                        value={formData.Equipment}
                                        onChange={handleChange}
                                        required
                                        disabled={!formData.CapabilityName}
                                        className="border-slate-300 focus:border-teal-500 focus:ring-teal-500 disabled:bg-slate-50 disabled:text-slate-400"
                                    >
                                        <option value="">Select Equipment</option>
                                        {filteredEquipments.map(e => <option key={e.id} value={e.EquipmentName}>{e.EquipmentName}</option>)}
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-slate-700">Equipment Code</Label>
                                    <Input
                                        value={formData.EquipmentCode}
                                        readOnly
                                        className="bg-slate-50 text-slate-500 border-slate-200 font-mono text-sm"
                                        placeholder="Auto-filled"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-slate-700">Document Code</Label>
                                    <Input
                                        value={formData.DocumentCode}
                                        readOnly
                                        className="bg-slate-50 text-slate-500 border-slate-200 font-mono text-sm"
                                        placeholder="Auto-filled"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Maintenance Details Section */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                                <div className="w-1 h-5 bg-purple-500 rounded-full" />
                                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Maintenance Schedule</h3>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-slate-700">Action / Task Name <span className="text-red-500">*</span></Label>
                                <Input
                                    name="Action"
                                    value={formData.Action}
                                    onChange={handleChange}
                                    placeholder="e.g. Full Calibration & Mainetance"
                                    required
                                    className="border-slate-300 focus:border-teal-500 focus:ring-teal-500"
                                />
                            </div>

                            {/* Type Selection */}
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-slate-700">Type <span className="text-red-500">*</span></Label>
                                <div className="flex flex-wrap items-center gap-6 pt-2 bg-slate-50 p-4 rounded-lg border border-slate-200">
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            name="PM"
                                            checked={formData.PM}
                                            onChange={handleChange}
                                            className="w-5 h-5 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer transition-all"
                                        />
                                        <span className="text-sm font-bold text-slate-700 group-hover:text-teal-600 transition-colors">PM</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            name="CAL"
                                            checked={formData.CAL}
                                            onChange={handleChange}
                                            className="w-5 h-5 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer transition-all"
                                        />
                                        <span className="text-sm font-bold text-slate-700 group-hover:text-teal-600 transition-colors">CAL</span>
                                    </label>

                                    {formData.PM && formData.CAL && (
                                        <>
                                            <div className="h-6 w-px bg-slate-300 mx-2" />
                                            <label className="flex items-center gap-2 cursor-pointer group animate-in fade-in zoom-in duration-300">
                                                <div className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        className="sr-only peer"
                                                        checked={separateDetails}
                                                        onChange={(e) => setSeparateDetails(e.target.checked)}
                                                    />
                                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                                                </div>
                                                <span className="text-sm font-bold text-slate-700">Diff Frequency?</span>
                                                <span className="text-xs text-slate-400 font-normal ml-1">(Split into 2 records)</span>
                                            </label>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Separate Settings UI */}
                            {separateDetails && formData.PM && formData.CAL ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-top-4 duration-300">
                                    {/* PM Settings */}
                                    <div className="space-y-4 p-5 bg-blue-50/50 rounded-xl border border-blue-100">
                                        <h4 className="font-bold text-blue-800 flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                                            PM Settings
                                        </h4>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-semibold text-slate-500 uppercase">Frequency (Months)</Label>
                                            <Input
                                                type="number"
                                                name="FrequencyPM"
                                                value={formData.FrequencyPM}
                                                onChange={handleChange}
                                                min="1"
                                                className="bg-white border-blue-200 focus:border-blue-500 focus:ring-blue-200"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-semibold text-slate-500 uppercase">Next Due (Start)</Label>
                                            <Input
                                                type="date"
                                                name="NextDueDatePM"
                                                value={formData.NextDueDatePM}
                                                onChange={handleChange}
                                                className="bg-white border-blue-200 focus:border-blue-500 focus:ring-blue-200"
                                            />
                                        </div>
                                    </div>

                                    {/* CAL Settings */}
                                    <div className="space-y-4 p-5 bg-purple-50/50 rounded-xl border border-purple-100">
                                        <h4 className="font-bold text-purple-800 flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-purple-500" />
                                            CAL Settings
                                        </h4>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-semibold text-slate-500 uppercase">Frequency (Months)</Label>
                                            <Input
                                                type="number"
                                                name="FrequencyCAL"
                                                value={formData.FrequencyCAL}
                                                onChange={handleChange}
                                                min="1"
                                                className="bg-white border-purple-200 focus:border-purple-500 focus:ring-purple-200"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-semibold text-slate-500 uppercase">Next Due (Start)</Label>
                                            <Input
                                                type="date"
                                                name="NextDueDateCAL"
                                                value={formData.NextDueDateCAL}
                                                onChange={handleChange}
                                                className="bg-white border-purple-200 focus:border-purple-500 focus:ring-purple-200"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* Normal Single Frequency UI */
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold text-slate-700">Frequency (Months) <span className="text-red-500">*</span></Label>
                                        <Input
                                            type="number"
                                            name="Frequency"
                                            value={formData.Frequency}
                                            onChange={handleChange}
                                            min="1"
                                            required={!separateDetails}
                                            className="border-slate-300 focus:border-teal-500 focus:ring-teal-500"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold text-slate-700">Next Due Date (Start Plan) <span className="text-red-500">*</span></Label>
                                        <Input
                                            type="date"
                                            name="NextDueDate"
                                            value={formData.NextDueDate}
                                            onChange={handleChange}
                                            required={!separateDetails}
                                            className="border-slate-300 focus:border-teal-500 focus:ring-teal-500"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-slate-700">Service Time (Days) <span className="text-red-500">*</span></Label>
                                    <Input
                                        type="number"
                                        name="ServiceTime"
                                        value={formData.ServiceTime}
                                        onChange={handleChange}
                                        min="1"
                                        required
                                        className="border-slate-300 focus:border-teal-500 focus:ring-teal-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-slate-700">Performed By</Label>
                                    <Select
                                        name="PMby"
                                        value={formData.PMby}
                                        onChange={handleChange}
                                        className="border-slate-300 focus:border-teal-500 focus:ring-teal-500"
                                    >
                                        <option value="Vendor Service">Vendor service</option>
                                        <option value="In-house">Self PM in-house</option>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </CardContent>

                    {/* Footer */}
                    <CardFooter className="flex justify-between items-center bg-slate-50 p-6 border-t border-slate-200">
                        <div className="text-sm text-slate-500">
                            <span className="font-medium">Fields marked with </span>
                            <span className="text-red-500 font-bold">*</span>
                            <span className="font-medium"> are required</span>
                        </div>
                        <div className="flex gap-3">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => {
                                    setFormData({
                                        CapabilityName: '',
                                        Equipment: '',
                                        EquipmentCode: '',
                                        DocumentCode: '',
                                        Action: '',
                                        Frequency: 12,
                                        ServiceTime: 1,
                                        NextDueDate: '',
                                        PM: false,
                                        CAL: false,
                                        PMby: 'Vendor Service',
                                        FrequencyPM: 12,
                                        NextDueDatePM: '',
                                        FrequencyCAL: 6,
                                        NextDueDateCAL: ''
                                    });
                                    setSeparateDetails(false);
                                }}
                                className="hover:bg-slate-100"
                            >
                                Reset
                            </Button>
                            <button
                                type="submit"
                                disabled={!isFormValid()}
                                className={`px-8 py-2.5 rounded-xl font-bold text-sm shadow-lg transition-all duration-300 ${isFormValid()
                                    ? 'gradient-atc hover:gradient-atc-hover text-white cursor-pointer hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0'
                                    : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                                    }`}
                            >
                                Submit Registration
                            </button>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
