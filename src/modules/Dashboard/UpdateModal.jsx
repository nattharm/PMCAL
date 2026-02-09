import React, { useState } from 'react';
import { useLab } from '../../context/LabContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Select } from '../../components/ui/Select';
import { X, Upload, AlertCircle } from 'lucide-react';
import { format, isAfter, parseISO } from 'date-fns';
import { dbLeaderGroup } from '../../data/mockData';
import ServiceReportForm from './ServiceReportForm';

export default function UpdateModal({ event, onClose, onUpdate, initialPostponeDate, onNavigate }) {
    // Helper to safely parse dates in various formats
    const safeParseDate = (dateString) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        if (!isNaN(date.getTime())) return date;
        const isoDate = parseISO(dateString);
        if (!isNaN(isoDate.getTime())) return isoDate;
        return null;
    };

    const formatDisplayDate = (dateString) => {
        const date = safeParseDate(dateString);
        if (!date) return dateString;
        return format(date, 'M/dd/yyyy');
    };

    const { createAbnormality, updateMaster, state } = useLab();
    const { pmCalMaster } = state;
    const isCompleted = event.Status === 'Completed';
    const [mode, setMode] = useState(isCompleted ? 'view' : (initialPostponeDate ? 'postpone' : 'complete'));
    const [formData, setFormData] = useState({
        // Complete
        CompleteDate: event.CompleteDate || format(new Date(), 'yyyy-MM-dd'),
        Status: event.DetailsOfComplete || 'Successful',
        Remark: event.Remark || '',
        File: null,

        // Postpone
        Reason: event.Reason || '',
        NewDueDate: initialPostponeDate || event.DueDate || '',
        EqStatus: 'Normal'
    });
    const [showReportForm, setShowReportForm] = useState(false);

    const isOverdue = isAfter(new Date(), parseISO(event.DueDate));
    const capability = event.Capability || event.CapabilityName;
    const leaderInfo = dbLeaderGroup[capability] || { name: 'Capability Leader', emails: '-' };

    // Generate automatic remark with optional manual notes appended
    const generateAutoRemark = (evt, masterList) => {
        // Determine work type (PM, CAL, or PM/CAL)
        const isPM = evt.PM === true || evt.PM === 'true' || evt.PM === 'yes';
        const isCAL = evt.CAL === true || evt.CAL === 'true' || evt.CAL === 'yes';
        let workType = '';
        if (isPM && isCAL) workType = 'PM/CAL';
        else if (isPM) workType = 'PM';
        else if (isCAL) workType = 'CAL';
        else workType = 'Maintenance'; // fallback

        // Determine status phrase
        const status = evt.DetailsOfComplete || evt.Status || 'Successful';
        let statusPhrase = '';
        if (status === 'Successful') {
            statusPhrase = 'successfully completed';
        } else if (status === 'Successful with conditions') {
            statusPhrase = 'completed with conditions';
        } else if (status === 'Unsuccessful') {
            statusPhrase = 'was not successfully completed';
        } else {
            statusPhrase = 'completed';
        }

        // Determine performer
        // First try to get PMby from master data via MasterID
        let pmby = '';
        if (evt.MasterID && masterList) {
            const master = masterList.find(m => m.id === evt.MasterID);
            if (master) {
                pmby = master.PMby || '';
            }
        }
        // Fallback to direct field (in case it's stored on the event)
        if (!pmby) {
            pmby = evt.PMby || evt.PMCALby || evt.PMCALBY || '';
        }

        const completedBy = evt.CompletedBy || 'Current User';
        let performer = '';

        if (pmby.toLowerCase().includes('vendor')) {
            performer = 'Vendor';
        } else if (pmby.toLowerCase().includes('self') || pmby.toLowerCase().includes('in-house')) {
            performer = completedBy;
        } else {
            // Fallback: if no PMby info, check if vendor or default to completedBy
            performer = completedBy !== 'Unknown' ? completedBy : 'Vendor';
        }

        // Construct auto-generated message
        const equipmentName = evt.EquipmentName || 'Equipment';
        const autoMessage = `${workType} on ${equipmentName} was ${statusPhrase} by ${performer}.`;

        // Append manual remark if exists
        const manualRemark = evt.Remark && evt.Remark.trim() ? evt.Remark.trim() : '';
        if (manualRemark) {
            return `${autoMessage} ${manualRemark}`;
        }

        return autoMessage;
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setFormData({ ...formData, File: file });
    };

    const calculateStatus = () => {
        if (mode === 'complete') {
            // User Change: ALL completions require Leader Approval
            return 'Pending Leader Approval';
        } else {
            return 'Pending';
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (mode === 'view') {
            if (formData.File) {
                alert(`File "${formData.File.name}" uploaded successfully for ${event.EquipmentName}`);
                // In a real app, we'd update the record with the new file reference
                onUpdate(event.id, {
                    ...event,
                    HasNewAttachment: true
                });
            }
            onClose();
            return;
        }

        if (mode === 'complete') {
            // Validate Remark is required when Status is not "Successful"
            if (formData.Status !== 'Successful' && !formData.Remark.trim()) {
                alert("Please provide a Remark when equipment status is not 'Successful'");
                return;
            }

            const status = calculateStatus();
            if (status === 'Pending Leader Approval') {
                alert(`Job submitted for approval. Email notification sent to ${leaderInfo.name} (${leaderInfo.emails})`);
            }

            // Auto-create Troubleshooting Case for non-successful completions
            if (formData.Status === 'Successful with conditions' || formData.Status === 'Unsuccessful') {
                createAbnormality({
                    EquipmentName: event.EquipmentName,
                    EquipmentCode: event.EquipmentCode || '-',
                    Capability: capability,
                    OriginalDate: event.DueDate,
                    NewDate: formData.CompleteDate,
                    Reason: formData.Remark.trim(),
                    Type: 'Troubleshooting',
                    Status: 'Reported',
                    EquipmentStatus: formData.Status
                });

                alert(
                    `Job marked as "${formData.Status}".\n\n` +
                    `A Troubleshooting Case has been automatically created and can be viewed in the Abnormality module.\n\n` +
                    `Equipment: ${event.EquipmentName}\n` +
                    `Issue: ${formData.Remark}`
                );
            }

            onUpdate(event.id, {
                Status: status,
                CompleteDate: formData.CompleteDate,
                DetailsOfComplete: formData.Status,
                Remark: formData.Remark,
                HasAttachment: !!formData.File || event.HasAttachment,
                CompletedBy: 'Current User', // Placeholder for actual user
                ApprovedBy: status === 'Completed' ? leaderInfo.name : null, // Use leader name if auto-approved
                LeaderApprove: status === 'Completed' // Approved if status is 'Completed'
            });

            // Auto-update Master NextDueDate for year-over-year planning
            if (event.MasterID) {
                const master = pmCalMaster.find(m => m.id === event.MasterID);
                if (master && master.Frequency) {
                    // Extract frequency in months (e.g., "6 months" -> 6)
                    const freqMatch = String(master.Frequency).match(/(\d+)/);
                    const frequencyMonths = freqMatch ? parseInt(freqMatch[0], 10) : 0;

                    if (frequencyMonths > 0) {
                        // Calculate new NextDueDate = CompleteDate + Frequency
                        const newNextDueDate = new Date(formData.CompleteDate);
                        newNextDueDate.setMonth(newNextDueDate.getMonth() + frequencyMonths);

                        updateMaster(master.id, {
                            NextDueDate: newNextDueDate.toISOString().split('T')[0],
                            LastCompletedDate: formData.CompleteDate
                        });
                    }
                }
            }
        } else {
            // Postpone
            if (!formData.NewDueDate) {
                alert("Please select a new due date");
                return;
            }
            if (!formData.Reason.trim()) {
                alert("Please provide a reason for postponement");
                return;
            }

            // ... (Email logic suppressed for brevity if not changing) ...

            // Update Postpone payload
            onUpdate(event.id, {
                DueDate: formData.NewDueDate,
                NewDueDate: formData.NewDueDate,
                Reason: formData.Reason.trim(),
                Status: 'Pending Leader Approval',
                PostponedFrom: event.DueDate,
                Postponed: true,
                PostponedBy: 'Current User', // Placeholder
                LeaderApprove: false
            });
        }
        onClose();
    };

    const handleReportSubmit = (data) => {
        // Merge report data into the main update payload
        // We'll store the full report object in a 'ReportData' field
        const status = 'Pending Leader Approval';

        onUpdate(event.id, {
            Status: status,
            CompleteDate: data.serviceDate,
            DetailsOfComplete: 'Successful', // Reports usually imply success or conditional success
            Remark: `Detailed Report Submitted (Method: ${data.method})`,
            HasAttachment: data.files.length > 0 || event.HasAttachment,
            ReportData: data, // Store the JSON report
            CompletedBy: data.recorder || 'Current User',
            ApprovedBy: null,
            LeaderApprove: false
        });

        alert("Service Report submitted successfully for approval.");
        onClose();
    };

    if (!event) return null;

    if (showReportForm) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gradient-to-br from-slate-900/60 to-slate-900/80 backdrop-blur-md animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                    <div className="gradient-atc-light border-b border-slate-100 p-6 shrink-0">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 mb-1">Service Report Entry</h3>
                                <p className="text-sm text-slate-500">Record detailed calibration/PM results for {event.EquipmentName}</p>
                            </div>
                            <button onClick={() => setShowReportForm(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                    <div className="p-6 overflow-y-auto custom-scrollbar">
                        <ServiceReportForm
                            event={event}
                            onSubmit={handleReportSubmit}
                            onCancel={() => setShowReportForm(false)}
                            initialData={event.ReportData} // Pass existing data if viewing
                        />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gradient-to-br from-slate-900/60 to-slate-900/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="gradient-atc-light border-b border-slate-100 p-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 mb-1">{event.EquipmentName}</h3>
                            <div className="flex flex-col gap-0.5 text-sm text-slate-600">
                                <p><span className="font-semibold text-slate-500">Capability:</span> {event.Capability}</p>

                            </div>
                        </div>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 rounded">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {!isCompleted && (
                    <div className="p-1 bg-slate-100 flex mx-6 mt-6 rounded-lg">
                        <button
                            onClick={() => setMode('complete')}
                            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all cursor-pointer ${mode === 'complete' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Complete Job
                        </button>
                        <button
                            onClick={() => setMode('postpone')}
                            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all cursor-pointer ${mode === 'postpone' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Postpone
                        </button>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="p-6 pt-4 space-y-4">
                    {mode === 'view' ? (
                        /* Read-only View for Completed Jobs */
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-[10px] uppercase text-slate-400">Equipment Code</Label>
                                    <div className="text-sm font-medium text-slate-800">{event.EquipmentCode || '-'}</div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] uppercase text-slate-400">Action / Job</Label>
                                    <div className="text-sm font-medium text-slate-800">{event.Action || 'Scheduled Maintenance'}</div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] uppercase text-slate-400">Due Date</Label>
                                    <div className="text-sm font-medium text-slate-800">{formatDisplayDate(event.NewDueDate || event.DueDate)}</div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] uppercase text-slate-400">Complete Date</Label>
                                    <div className="text-sm font-bold text-emerald-600">{formatDisplayDate(event.CompleteDate)}</div>
                                </div>
                                <div className="space-y-1 col-span-2">
                                    <Label className="text-[10px] uppercase text-slate-400">Remark</Label>
                                    <div className={`text-sm font-medium p-2 rounded border min-h-[40px] ${event.Remark && event.Remark.trim() ? 'text-slate-600 bg-slate-50 border-slate-100' : 'text-slate-500 bg-blue-50 border-blue-100 italic'}`}>
                                        {generateAutoRemark(event, pmCalMaster)}
                                    </div>
                                </div>
                            </div>

                            {/* Postponement Info */}
                            {event.Postponed && (
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
                                    <h4 className="font-bold text-amber-800 flex items-center gap-2 mb-1">
                                        <AlertCircle className="w-4 h-4" />
                                        Plan Postponed
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <span className="text-[10px] uppercase text-amber-600 font-bold">Original plan</span>
                                            <div className="font-medium text-slate-800">
                                                {formatDisplayDate(event.PostponedFrom || event.OriginalDueDate)}
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-[10px] uppercase text-amber-600 font-bold">Reason</span>
                                            <div className="font-medium text-slate-800">
                                                {event.Reason || event.PostponeReason || '-'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Completed By and Approved By Section */}
                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                                <div className="space-y-1">
                                    <Label className="text-[10px] uppercase text-slate-400">Completed By</Label>
                                    <div className="text-sm font-medium text-slate-800">
                                        {event.CompletedBy || event.CompleteBy || 'Unknown'}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] uppercase text-slate-400">Approved By</Label>
                                    <div className="text-sm font-medium text-slate-800">
                                        {event.ApprovedBy || '-'}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100">
                                <Label className="flex items-center gap-2 mb-3">
                                    <Upload className="w-4 h-4 text-slate-400" />
                                    Attachments
                                </Label>

                                <div className="space-y-2 mb-4">
                                    {/* Simulated Existing File */}
                                    <div className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-100 group">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-blue-100 flex items-center justify-center rounded text-blue-600 text-[10px] font-bold">PDF</div>
                                            <div className="text-xs font-medium text-slate-700">service_report_{event.id}.pdf</div>
                                        </div>
                                        <button type="button" className="text-[10px] text-teal-600 font-bold hover:underline cursor-pointer">View</button>
                                    </div>
                                </div>

                                <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center hover:bg-slate-50 transition-colors cursor-pointer relative group">
                                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileChange} />
                                    <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2 group-hover:text-slate-600 transition-colors" />
                                    <p className="text-xs text-slate-500 group-hover:text-slate-700">
                                        {formData.File ? formData.File.name : "Click to upload more files"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : mode === 'complete' ? (
                        <>
                            <div className="space-y-1 mb-3">
                                <Label className="text-sm font-semibold text-slate-700">Action / Job</Label>
                                <div className="text-sm font-medium text-slate-800 p-2 bg-slate-50 rounded border border-slate-200">
                                    {event.Action || 'Scheduled Maintenance'}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Completion Date</Label>
                                <Input type="date" value={formData.CompleteDate} onChange={e => setFormData({ ...formData, CompleteDate: e.target.value })} required />
                                {isAfter(parseISO(formData.CompleteDate), parseISO(event.DueDate)) && (
                                    <p className="text-xs text-amber-600 flex items-center bg-amber-50 p-2 rounded">
                                        <AlertCircle className="w-3 h-3 mr-1" /> Late completion will trigger approval workflow.
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label>Equipment Status</Label>
                                <Select value={formData.Status} onChange={e => setFormData({ ...formData, Status: e.target.value })}>
                                    <option value="Successful">Successful (ใช้งานได้)</option>
                                    <option value="Successful with conditions">Successful with conditions (ใช้งานได้แบบมีเงื่อนไข)</option>
                                    <option value="Unsuccessful">Unsuccessful (ไม่สามารถใช้งานได้)</option>
                                </Select>
                            </div>
                            <div className="space-y-2 animate-in slide-in-from-top-2">
                                <Label>
                                    Remark {formData.Status !== 'Successful' && <span className="text-red-500">*</span>}
                                </Label>
                                <Input
                                    value={formData.Remark}
                                    onChange={e => setFormData({ ...formData, Remark: e.target.value })}
                                    required={formData.Status !== 'Successful'}
                                    placeholder={formData.Status === 'Successful' ? "Optional remark..." : "Explain why status is changed..."}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Attachment (Service Report)</Label>
                                <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center hover:bg-slate-50 transition-colors cursor-pointer relative group">
                                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileChange} />
                                    <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2 group-hover:text-slate-600 transition-colors" />
                                    <p className="text-xs text-slate-500 group-hover:text-slate-700">
                                        {formData.File ? formData.File.name : "Click to upload files"}
                                    </p>
                                </div>
                            </div>
                            {/* Report Form Toggle */}
                            <div className="pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowReportForm(true)}
                                    className="w-full flex items-center justify-center gap-2 p-3 rounded-lg border-2 border-dashed border-teal-200 bg-teal-50 text-teal-700 font-bold hover:bg-teal-100 transition-colors"
                                >
                                    <Upload className="w-4 h-4" />
                                    Fill Detailed Service Report
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="space-y-1 mb-3">
                                <Label className="text-sm font-semibold text-slate-700">Action / Job</Label>
                                <div className="text-sm font-medium text-slate-800 p-2 bg-slate-50 rounded border border-slate-200">
                                    {event.Action || 'Scheduled Maintenance'}
                                </div>
                            </div>
                            <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-700 mb-2 flex justify-between items-center">
                                <span>Current Due Date:</span>
                                <span className="font-semibold">{formatDisplayDate(event.DueDate)}</span>
                            </div>
                            <div className="space-y-2">
                                <Label>New Due Date</Label>
                                <Input type="date" value={formData.NewDueDate} onChange={e => setFormData({ ...formData, NewDueDate: e.target.value })} required min={format(new Date(), 'yyyy-MM-dd')} />
                            </div>
                            <div className="space-y-2">
                                <Label className="flex items-center gap-1">
                                    Reason <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    value={formData.Reason}
                                    onChange={e => setFormData({ ...formData, Reason: e.target.value })}
                                    required
                                    placeholder="Please provide a reason for postponement"
                                    className={!formData.Reason.trim() && mode === 'postpone' ? 'border-red-200' : ''}
                                />
                                {!formData.Reason.trim() && mode === 'postpone' && (
                                    <p className="text-[10px] text-red-500 font-medium italic">Reason is required to send for approval</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label>Equipment Status</Label>
                                <Select value={formData.EqStatus} onChange={e => setFormData({ ...formData, EqStatus: e.target.value })}>
                                    <option>Normal</option>
                                    <option>Breakdown</option>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mt-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                <div className="space-y-1">
                                    <Label className="text-[10px] text-slate-400 uppercase tracking-wider">Owner</Label>
                                    <div className="text-sm font-medium text-slate-700">Current User</div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] text-slate-400 uppercase tracking-wider">Approver</Label>
                                    <div className="text-sm font-medium text-slate-700">{leaderInfo.name}</div>
                                </div>
                            </div>
                        </>
                    )}

                    <div className="flex justify-end space-x-2 pt-4">
                        <Button type="button" variant="ghost" onClick={onClose}>{mode === 'view' ? 'Close' : 'Cancel'}</Button>
                        {(() => {
                            const isSubmitDisabled =
                                (mode === 'postpone' && !formData.Reason.trim()) ||
                                (mode === 'complete' && formData.Status !== 'Successful' && !formData.Remark.trim());

                            return (
                                <button
                                    type="submit"
                                    disabled={isSubmitDisabled}
                                    className={`px-6 py-2 rounded-lg shadow-lg font-bold transition-all duration-300 focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 ${isSubmitDisabled
                                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 shadow-none'
                                        : 'gradient-atc hover:gradient-atc-hover text-white cursor-pointer hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0'
                                        }`}
                                >
                                    {mode === 'view' ? (formData.File ? 'Upload & Save' : 'Confirm') : (mode === 'complete' ? 'Submit Completion' : 'Send for Approval')}
                                </button>
                            );
                        })()}
                    </div>
                </form>
            </div>
        </div>
    );
}
