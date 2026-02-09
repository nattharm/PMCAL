import React, { useState, useMemo } from 'react';
import { useLab } from '../../context/LabContext';
import { Input } from '../../components/ui/Input';
import { cn } from '../../lib/utils';
import UpdateModal from './UpdateModal';
import KPIMetrics from './KPIMetrics';
import CompletionChart from './CompletionChart';
import { parseISO, isAfter, isBefore, endOfMonth, format, isValid } from 'date-fns';
import { FileText, Search, ArrowRightLeft, ArrowRight } from 'lucide-react';

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

export default function DashboardView({ onNavigate }) {
    const { state, updateSchedule } = useLab();
    const { pmCalList, capabilities, equipmentMaster, pmCalMaster } = state;

    const [year, setYear] = useState(new Date().getFullYear());
    const [selectedCap, setSelectedCap] = useState('All');
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [initialPostponeDate, setInitialPostponeDate] = useState(null);
    const [viewMode, setViewMode] = useState('calendar'); // 'calendar' or 'list'
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('All');

    const handleDragStart = (e, event) => {
        e.dataTransfer.setData("eventId", event.id);
    };

    const handleDragOver = (e) => {
        e.preventDefault(); // Allow drop
    };

    const handleDrop = (e, targetMonthName) => {
        e.preventDefault();
        const eventId = e.dataTransfer.getData("eventId");
        const event = pmCalList.find(item => item.id == eventId);

        if (event && event.Month !== targetMonthName) {
            // Find the month index to calculate the date
            const monthIndex = MONTHS.indexOf(targetMonthName);
            if (monthIndex !== -1) {
                // Create a date for the 1st of the target month in the current year
                const targetDate = new Date(year, monthIndex, 1);
                // Get the last day of that month
                const lastDayOfMonth = endOfMonth(targetDate);
                const newDueDate = format(lastDayOfMonth, 'yyyy-MM-dd');

                setInitialPostponeDate(newDueDate);
                setSelectedEvent(event);
            }
        }
    };


    // Helper to resolve Code/DocCode for an event (Centralized Logic)
    const resolveMetadata = (event) => {
        // 1. Direct on Event
        if (event.EquipmentCode) {
            return { code: event.EquipmentCode, docCode: event.DocumentCode || '-' };
        }

        // 2. Linked Master
        if (event.MasterID) {
            const master = pmCalMaster.find(m => m.id === event.MasterID);
            if (master) {
                return { code: master.EquipmentCode || '-', docCode: master.DocumentCode || '-' };
            }
        }

        // 3. Name Match fallback
        const masterByName = equipmentMaster.find(e => e.EquipmentName === event.EquipmentName);
        if (masterByName) {
            return { code: masterByName.EquipmentCode || '-', docCode: masterByName.DocumentCode || '-' };
        }

        return { code: '-', docCode: '-' };
    };

    // Filter events based on year and selected capability
    const filteredEvents = useMemo(() => {
        return pmCalList.filter(item => {
            const matchYear = item.Year === year;
            const itemCap = item.CapabilityName || item.Capability;
            const matchCap = selectedCap === 'All' ? true : itemCap === selectedCap;

            let matchSearch = true;
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                const meta = resolveMetadata(item);

                const nameMatch = item.EquipmentName?.toLowerCase().includes(term);
                const codeMatch = meta.code?.toLowerCase().includes(term);
                const actionMatch = item.Action?.toLowerCase().includes(term);

                matchSearch = nameMatch || codeMatch || actionMatch;
            }
            let matchStatus = true;
            const isCompleted = item.Status === 'Completed';
            const isOverdue = !isCompleted && isAfter(new Date(), parseISO(item.DueDate));
            const isPendingApproval = item.Status === 'Pending Leader Approval';

            if (selectedStatus === 'Completed') matchStatus = isCompleted;
            else if (selectedStatus === 'Pending') matchStatus = !isCompleted && !isOverdue && !isPendingApproval;
            else if (selectedStatus === 'Overdue') matchStatus = isOverdue;
            else if (selectedStatus === 'Pending Approval') matchStatus = isPendingApproval;

            return matchYear && matchCap && matchSearch && matchStatus;
        });
    }, [pmCalList, year, selectedCap, searchTerm, selectedStatus]);

    // Prepare Equipment Rows with details (Grouped by Name + Code)
    const equipmentRows = useMemo(() => {
        const rowMap = new Map();

        filteredEvents.forEach(event => {
            const meta = resolveMetadata(event);
            const key = `${event.EquipmentName}|${meta.code}`;

            if (!rowMap.has(key)) {
                rowMap.set(key, {
                    name: event.EquipmentName,
                    code: meta.code,
                    docCode: meta.docCode,
                    key: key
                });
            }
        });

        // Convert to array and sort by Name then Code
        return Array.from(rowMap.values()).sort((a, b) => {
            return a.name.localeCompare(b.name) || a.code.localeCompare(b.code);
        });
    }, [filteredEvents, equipmentMaster, pmCalMaster]);

    const getEventsForCell = (eqRow, monthName) => {
        return filteredEvents.filter(item => {
            const meta = resolveMetadata(item);
            return item.EquipmentName === eqRow.name &&
                item.Month === monthName &&
                meta.code === eqRow.code;
        });
    };

    const getStatusColor = (item) => {
        if (item.Status === 'Completed') return 'bg-emerald-100 text-emerald-700 border-emerald-300 hover:bg-emerald-200 hover:shadow-md';
        if (item.Status === 'Pending Leader Approval') return 'bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-200 hover:shadow-md';

        const isOverdue = isAfter(new Date(), parseISO(item.DueDate));
        // Only red if overdue AND not completed
        if (item.Status !== 'Completed' && isOverdue) return 'bg-rose-100 text-rose-700 border-rose-300 hover:bg-rose-200 hover:shadow-md animate-pulse';

        return 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200 hover:shadow-md';
    };

    // Helper to safely parse dates in various formats
    const safeParseDate = (dateString) => {
        if (!dateString) return null;

        // Try standard Date constructor first (handles MM/DD/YYYY, YYYY-MM-DD etc.)
        const date = new Date(dateString);
        if (isValid(date)) return date;

        // Fallback to parseISO just in case
        const isoDate = parseISO(dateString);
        if (isValid(isoDate)) return isoDate;

        return null;
    };

    // New Helper for Displaying Dates as M/dd/yyyy
    const formatDisplayDate = (dateString) => {
        const date = safeParseDate(dateString);
        if (!date) return dateString; // Return original if parsing fails
        return format(date, 'M/dd/yyyy');
    };

    // KPI Calculation Functions
    const kpiMetrics = useMemo(() => {
        const completedEvents = filteredEvents.filter(item => item.Status === 'Completed');

        // Completed on original plan: Status is Completed AND explicitly Postponed is empty/null/undefined
        // User Request: "Completed on Original Plan ONLY items that have status='completed' AND Postponed=''"
        const completedOnOriginal = completedEvents.filter(item => {
            // Strict check: Postponed must be falsy or empty string (ignoring whitespace)
            const postponedVal = item.Postponed;
            return !postponedVal || String(postponedVal).trim() === '';
        }).length;

        // Postponed cases: Count case postpone when Postponed = "yes" OR true
        const postponedCases = filteredEvents.filter(item => {
            const val = item.Postponed;
            if (val === true) return true; // Direct boolean check
            if (!val) return false;
            const sVal = String(val).toLowerCase().trim();
            return sVal === 'yes' || sVal === 'true';
        }).length;

        // % completed within original plan
        const originalPlanPercent = filteredEvents.length > 0
            ? Math.round((completedOnOriginal / filteredEvents.length) * 100)
            : 0;

        // % completed within new plan (all completed / total)
        const newPlanPercent = filteredEvents.length > 0
            ? Math.round((completedEvents.length / filteredEvents.length) * 100)
            : 0;

        return {
            completedOnOriginal,
            postponedCases,
            originalPlanPercent,
            newPlanPercent,
            totalEvents: filteredEvents.length
        };
    }, [filteredEvents]);

    // Monthly chart data
    const monthlyChartData = useMemo(() => {
        return MONTHS.map(month => {
            const monthEvents = filteredEvents.filter(item => item.Month === month);
            const completedEvents = monthEvents.filter(item => item.Status === 'Completed');

            // Original plan: Status is Completed AND explicitly Postponed is empty
            const completedOnOriginal = completedEvents.filter(item => {
                const postponedVal = item.Postponed;
                return !postponedVal || String(postponedVal).trim() === '';
            }).length;

            const originalPlanPercent = monthEvents.length > 0
                ? (completedOnOriginal / monthEvents.length) * 100
                : 0;

            const newPlanPercent = monthEvents.length > 0
                ? (completedEvents.length / monthEvents.length) * 100
                : 0;

            return {
                month: month.substring(0, 3),
                originalPlanPercent,
                newPlanPercent
            };
        });
    }, [filteredEvents]);

    // Intelligent Label Helper
    const getEventLabel = (event) => {
        // Helper: Returns boolean if value is valid, or null if missing/invalid
        const parseFlag = (val) => {
            if (val === null || val === undefined) return null;

            const sVal = String(val).toLowerCase().trim();
            if (sVal === 'true' || sVal === '1' || sVal === 'yes') return true;
            if (sVal === 'false' || sVal === '0' || sVal === 'no') return false;

            return null; // Value exists but is not a recognized boolean flag
        };

        // 1. Try to get explicit status from Transaction List
        let isPM = parseFlag(event.PM);
        let isCAL = parseFlag(event.CAL);

        // 2. Fallback: Only if status is MISSING (null), check Master Data
        if (event.MasterID) {
            const master = pmCalMaster.find(m => m.id === event.MasterID);
            if (master) {
                if (isPM === null) isPM = parseFlag(master.PM);
                if (isCAL === null) isCAL = parseFlag(master.CAL);
            }
        }

        // 3. Render
        if (isPM === true && isCAL === true) return 'PM/CAL';
        if (isPM === true) return 'PM';
        if (isCAL === true) return 'CAL';

        // 4. Default: Show Full Action
        return event.Action || 'Job';
    };

    return (
        <div className="space-y-6">
            {/* ... Header and Filters ... */}
            <div className="gradient-atc p-6 rounded-xl shadow-lg">
                <div className="flex justify-between items-center text-white">
                    <div>
                        <h2 className="text-2xl font-bold">ATC SMART LAB</h2>
                        <p className="text-sm text-white/90 mt-1">Annual PM/Calibration Schedule Dashboard</p>
                    </div>
                    <div className="flex items-center space-x-3 bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <Input
                                type="text"
                                placeholder="Search..."
                                className="pl-9 w-48 bg-white text-slate-900 border-0 focus:ring-2 focus:ring-teal-500/50 text-xs h-9 placeholder:text-slate-400"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="h-6 w-px bg-white/20 mx-1" />
                        <span className="text-sm font-medium">Year:</span>
                        <Input
                            type="number"
                            className="w-24 bg-white text-slate-900 border-0 focus:ring-2 focus:ring-teal-500/50"
                            value={year}
                            onChange={e => setYear(parseInt(e.target.value))}
                        />
                        <div className="h-6 w-px bg-white/20 mx-2" />
                        <span className="text-sm font-medium">Status:</span>
                        <select
                            className="bg-white/10 border-0 rounded text-xs text-white placeholder-white/70 focus:ring-2 focus:ring-white/50 [&>option]:text-slate-900"
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                        >
                            <option value="All">All Status</option>
                            <option value="Completed">Completed</option>
                            <option value="Pending">Pending</option>
                            <option value="Overdue">Overdue</option>
                            <option value="Pending Approval">Pending Approval</option>
                        </select>
                        <div className="h-6 w-px bg-white/20 mx-2" />
                        <div className="flex bg-white/10 rounded-lg p-1 gap-1">
                            <button
                                onClick={() => setViewMode('calendar')}
                                className={cn(
                                    "px-3 py-1 text-xs font-semibold rounded-md transition-all",
                                    viewMode === 'calendar' ? "bg-white text-teal-600 shadow-sm" : "text-white/70 hover:text-white"
                                )}
                            >
                                Calendar
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={cn(
                                    "px-3 py-1 text-xs font-semibold rounded-md transition-all",
                                    viewMode === 'list' ? "bg-white text-teal-600 shadow-sm" : "text-white/70 hover:text-white"
                                )}
                            >
                                List View
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center space-x-2 overflow-x-auto pb-1 custom-scrollbar no-scrollbar">
                    <button
                        onClick={() => setSelectedCap('All')}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap cursor-pointer",
                            selectedCap === 'All'
                                ? "gradient-atc text-white shadow-md shadow-teal-500/20"
                                : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                        )}
                    >
                        All Capabilities
                    </button>
                    <div className="flex flex-wrap gap-2">
                        {capabilities.filter(cap => {
                            // Only show capabilities that have at least one event in the current year
                            const capName = typeof cap === 'string' ? cap : cap.capabilityName;
                            return pmCalList.some(item =>
                                item.Year === year &&
                                (item.CapabilityName === capName || item.Capability === capName)
                            );
                        }).map(cap => {
                            const val = typeof cap === 'string' ? cap : cap.capabilityName;
                            return (
                                <button
                                    key={val}
                                    onClick={() => setSelectedCap(val)}
                                    className={cn(
                                        "px-3 py-1 text-xs font-bold rounded-full transition-all border",
                                        selectedCap === val
                                            ? "bg-teal-500 text-white border-teal-600 shadow-md transform scale-105"
                                            : "bg-white text-slate-600 border-slate-200 hover:border-teal-300 hover:bg-teal-50"
                                    )}
                                >
                                    {val}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {viewMode === 'calendar' && (<>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-auto max-h-[70vh] relative">
                        <table className="w-full text-sm text-left border-collapse table-fixed relative">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-medium sticky top-0 z-20 shadow-sm">
                                <tr>
                                    <th className="px-2 py-3 border-b border-r border-slate-200 w-[18%] sticky left-0 top-0 bg-slate-50 z-30 shadow-[2px_2px_5px_-2px_rgba(0,0,0,0.1)]">Equipment Code / Name</th>
                                    {MONTHS.map(m => (
                                        <th key={m} className="px-1 py-3 border-b border-slate-200 text-center text-[10px] bg-slate-50">{m.substring(0, 3)}</th>
                                    ))}
                                    <th className="px-2 py-3 border-b border-l border-slate-200 w-[12%] text-center text-[10px] bg-slate-50">Remark (Doc)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {equipmentRows.length === 0 ? (
                                    <tr>
                                        <td colSpan={14} className="px-6 py-12 text-center text-slate-400">
                                            No schedules found for {year}
                                        </td>
                                    </tr>
                                ) : (
                                    equipmentRows.map((eq) => (
                                        <tr key={eq.key} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-2 py-3 border-r border-slate-100 sticky left-0 bg-white z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-teal-700 text-xs">{eq.code}</span>
                                                    <span className="text-[11px] text-slate-600 truncate" title={eq.name}>{eq.name}</span>
                                                </div>
                                            </td>
                                            {MONTHS.map(month => {
                                                const events = getEventsForCell(eq, month);
                                                return (
                                                    <td
                                                        key={month}
                                                        className="px-1 py-2 text-center border-r border-slate-50 last:border-r-0 relative align-top"
                                                        onDragOver={handleDragOver}
                                                        onDrop={(e) => handleDrop(e, month)}
                                                    >
                                                        <div className="flex flex-col gap-1">
                                                            {events.map(event => (
                                                                <button
                                                                    key={event.id}
                                                                    draggable
                                                                    onDragStart={(e) => handleDragStart(e, event)}
                                                                    onClick={() => {
                                                                        setInitialPostponeDate(null);
                                                                        setSelectedEvent(event);
                                                                    }}
                                                                    className={cn(
                                                                        "px-1 py-1 rounded border text-[10px] font-bold transition-all duration-200 w-full text-center truncate flex justify-center items-center cursor-pointer hover:scale-105 shadow-sm min-h-[22px]",
                                                                        getStatusColor(event)
                                                                    )}
                                                                    title={`${event.Action || 'Maintenance'}\n${event.Postponed ? '⚠️ เลื่อนแผนมา' : '✓ แผนเดิม'}`}
                                                                >
                                                                    <span className="flex items-center gap-1 justify-center w-full">
                                                                        {event.Postponed && <ArrowRightLeft className="w-3 h-3 shrink-0 text-orange-600" />}
                                                                        {event.HasAttachment && <FileText className="w-3 h-3 shrink-0" />}
                                                                        <span className="truncate">{getEventLabel(event)}</span>
                                                                    </span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </td>
                                                );
                                            })}
                                            {/* Remark Column */}
                                            <td className="px-2 py-3 border-l border-slate-100 text-center text-[10px] text-slate-500 font-mono">
                                                {eq.docCode}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="flex space-x-6 text-xs text-slate-500 px-2 justify-center pt-2">
                    <div className="flex items-center"><span className="w-3 h-3 bg-slate-100 border border-slate-200 rounded mr-2"></span> Pending</div>
                    <div className="flex items-center"><span className="w-3 h-3 bg-green-100 border border-green-200 rounded mr-2"></span> Completed</div>
                    <div className="flex items-center"><span className="w-3 h-3 bg-red-100 border border-red-200 rounded mr-2"></span> Overdue</div>
                    <div className="flex items-center"><span className="w-3 h-3 bg-yellow-100 border border-yellow-200 rounded mr-2"></span> Pending Approval</div>
                </div>
            </>)}

            {/* Refined List View */}
            {viewMode === 'list' && (
                <div className="bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden animate-in fade-in duration-300">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Equipment Code</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Equipment Name</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Document Code</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Due Date</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredEvents.map(event => {
                                const meta = resolveMetadata(event);
                                const isCompleted = event.Status === 'Completed';
                                const isPendingApproval = event.Status === 'Pending Leader Approval';
                                const isOverdue = !isCompleted && !isPendingApproval && isAfter(new Date(), parseISO(event.DueDate));

                                let statusLabel = 'Pending';
                                let statusClass = 'bg-slate-100 text-slate-600 border-slate-200';

                                if (isCompleted) {
                                    statusLabel = 'Completed';
                                    statusClass = 'bg-emerald-100 text-emerald-700 border-emerald-200';
                                } else if (isPendingApproval) {
                                    statusLabel = 'Pending Approval';
                                    statusClass = 'bg-amber-100 text-amber-700 border-amber-200';
                                } else if (isOverdue) {
                                    statusLabel = 'Overdue';
                                    statusClass = 'bg-rose-100 text-rose-700 border-rose-200 animate-pulse';
                                } else {
                                    statusLabel = 'Upcoming';
                                    statusClass = 'bg-blue-50 text-blue-700 border-blue-200';
                                }

                                return (
                                    <tr
                                        key={event.id}
                                        className="hover:bg-slate-50/80 transition-all cursor-pointer group"
                                        onClick={() => {
                                            setInitialPostponeDate(null);
                                            setSelectedEvent(event);
                                        }}
                                    >
                                        <td className="p-4">
                                            <span className="font-mono text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">
                                                {meta.code}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-bold text-slate-800 text-sm group-hover:text-teal-600 transition-colors">
                                                {event.EquipmentName}
                                            </div>
                                            <div className="text-xs text-slate-500 mt-0.5">{getEventLabel(event)}</div>
                                        </td>
                                        <td className="p-4 font-mono text-xs text-slate-500">{meta.docCode}</td>
                                        <td className="p-4">
                                            {event.Postponed && event.PostponedFrom ? (
                                                <div className="flex items-center gap-3 bg-white p-2 border border-slate-200 rounded-lg shadow-sm w-fit">
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Original</span>
                                                        <span className="text-xs font-medium text-slate-400 line-through decoration-slate-400">
                                                            {format(new Date(event.PostponedFrom), 'yyyy-MM-dd')}
                                                        </span>
                                                    </div>
                                                    <ArrowRight className="w-3 h-3 text-slate-300" />
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-[10px] font-bold text-teal-600 uppercase tracking-wider">Revised</span>
                                                        <span className="text-xs font-bold text-teal-700">
                                                            {format(new Date(event.DueDate), 'yyyy-MM-dd')}
                                                        </span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className={`text-sm font-medium ${isOverdue ? 'text-rose-600' : 'text-slate-700'}`}>
                                                    {format(new Date(event.DueDate), 'MMM d, yyyy')}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={cn(
                                                "px-3 py-1 rounded-full text-xs font-bold border shadow-sm inline-flex items-center gap-1.5",
                                                statusClass
                                            )}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${isCompleted ? 'bg-emerald-500' : isOverdue ? 'bg-rose-500' : isPendingApproval ? 'bg-amber-500' : 'bg-blue-500'}`}></span>
                                                {statusLabel}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-center gap-3">
                                                {event.Postponed && (
                                                    <div className="group/icon relative">
                                                        <ArrowRightLeft className="w-4 h-4 text-amber-500" />
                                                        <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover/icon:opacity-100 transition-opacity whitespace-nowrap">
                                                            Postponed
                                                        </span>
                                                    </div>
                                                )}
                                                {event.HasAttachment && (
                                                    <div className="group/icon relative">
                                                        <FileText className="w-4 h-4 text-slate-400" />
                                                        <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover/icon:opacity-100 transition-opacity whitespace-nowrap">
                                                            Attachment
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredEvents.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="p-12 text-center text-slate-400 bg-slate-50/50">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Search className="w-8 h-8 opacity-20" />
                                            <p>No events found matching your criteria.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
            <div className="mt-8">
                <h2 className="text-xl font-bold text-slate-900 mb-6 px-2">KPI Monitoring</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left: KPI Metrics */}
                    <div>
                        <KPIMetrics metrics={kpiMetrics} />
                    </div>

                    {/* Right: Completion Chart */}
                    <div>
                        <CompletionChart monthlyData={monthlyChartData} />
                    </div>
                </div>
            </div>

            {
                selectedEvent && (
                    <UpdateModal
                        event={selectedEvent}
                        initialPostponeDate={initialPostponeDate}
                        onClose={() => {
                            setSelectedEvent(null);
                            setInitialPostponeDate(null);
                        }}
                        onUpdate={updateSchedule}
                        onNavigate={onNavigate}
                    />
                )
            }
        </div >
    );
}
