import React, { useState, useMemo } from 'react';
import { useLab } from '../../context/LabContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Search, ArrowRight, X, Calendar as CalIcon, Table, Grid } from 'lucide-react';
import { format, addYears, endOfMonth } from 'date-fns';
import { cn } from '../../lib/utils';
import PlanningConfirmModal from './PlanningConfirmModal';
import { getDueDatesInYear } from '../../utils/planningUtils';

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

export default function PlanningView() {
    const { state, addSchedule } = useLab();
    const { pmCalMaster, pmCalList, capabilities } = state;

    const [stagingItems, setStagingItems] = useState([]);
    const [filterCap, setFilterCap] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [planningYear, setPlanningYear] = useState(new Date().getFullYear());
    const [viewMode, setViewMode] = useState('table'); // 'table' or 'calendar'
    const [isExpanded, setIsExpanded] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [draggedItem, setDraggedItem] = useState(null);

    // Filter Master List
    const filteredMaster = useMemo(() => {
        return pmCalMaster.filter(item => {
            const matchCap = filterCap ? item.CapabilityName === filterCap : true;
            const matchSearch = searchTerm
                ? item.Equipment.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.Action.toLowerCase().includes(searchTerm.toLowerCase())
                : true;

            // Check if item is actually due in the selected year
            const expectedDates = getDueDatesInYear(item, pmCalList, planningYear);
            const isDueThisYear = expectedDates.length > 0;

            return matchCap && matchSearch && isDueThisYear;
        });
    }, [pmCalMaster, pmCalList, filterCap, searchTerm, planningYear]);

    // Get current assignment counts
    const getAssignedCount = (masterId) => {
        return pmCalList.filter(i => i.MasterID === masterId && i.Year === planningYear).length;
    };

    // Staging Count (pending submit)
    const getStagingCount = (masterId) => {
        return stagingItems.filter(i => i.MasterID === masterId).length;
    };

    const handleAddToPlan = (masterItem) => {
        // Calculate target based on actual dates due this year
        const expectedDates = getDueDatesInYear(masterItem, pmCalList, planningYear);
        const targetCount = expectedDates.length;

        // Safety check: Don't add if already full
        const planned = getAssignedCount(masterItem.id);
        const staged = getStagingCount(masterItem.id);

        if (planned + staged >= targetCount) {
            alert(`${masterItem.Equipment} already has the maximum required maintenance items (${targetCount}) planned for ${planningYear}.`);
            return;
        }

        // Try to suggest the correct due date
        // Find the first expected date that isn't covered by existing plans
        // This is a simple approximation; ideal logic would match dates exactly, but strictly counting is safer for now.
        const nextDateIndex = planned + staged;
        const suggestedDate = expectedDates[nextDateIndex] || new Date();

        const newItem = {
            MasterID: masterItem.id,
            EquipmentName: masterItem.Equipment,
            EquipmentCode: masterItem.EquipmentCode, // Persist Code
            DocumentCode: masterItem.DocumentCode,   // Persist DocCode
            Capability: masterItem.CapabilityName,
            Action: masterItem.Action,
            DueDate: format(suggestedDate, 'yyyy-MM-dd'),
            Month: format(suggestedDate, 'MMMM'),
            Year: planningYear,
            // Parse flags to ensure boolean (handle "True"/"False" strings)
            PM: String(masterItem.PM).toLowerCase() === 'true' || masterItem.PM === true,
            CAL: String(masterItem.CAL).toLowerCase() === 'true' || masterItem.CAL === true,
            PMby: masterItem.PMby || '-', // Persist PMby (Vendor/In-house)
            NewDueDate: format(suggestedDate, 'yyyy-MM-dd'), // Initialize NewDueDate
            Assignee: '', // New Field: Assignee
            tempId: Date.now()
        };
        setStagingItems([...stagingItems, newItem]);
    };

    const handleDateChange = (tempId, date) => {
        setStagingItems(stagingItems.map(item => {
            if (item.tempId === tempId) {
                const d = new Date(date);
                return {
                    ...item,
                    DueDate: date,
                    Month: format(d, 'MMMM'),
                    Year: parseInt(format(d, 'yyyy'))
                };
            }
            return item;
        }));
    };

    const handleRemoveStaged = (tempId) => {
        setStagingItems(stagingItems.filter(i => i.tempId !== tempId));
    };

    const handleDuplicateLastYear = () => {
        const lastYear = planningYear - 1;
        let lastYearItems = pmCalList.filter(i => i.Year === lastYear);

        // Filter by selected Capability if one is selected
        if (filterCap) {
            lastYearItems = lastYearItems.filter(i => i.Capability === filterCap);
        }

        if (lastYearItems.length === 0) {
            const msg = filterCap
                ? `No data found for ${filterCap} in year ${lastYear}`
                : `No data found for year ${lastYear}`;
            alert(msg);
            return;
        }

        const duplicated = lastYearItems.map(item => {
            const oldDate = new Date(item.DueDate);
            const newDate = addYears(oldDate, 1);
            return {
                ...item,
                Action: item.Action,
                DueDate: format(newDate, 'yyyy-MM-dd'),
                Month: format(newDate, 'MMMM'),
                Year: planningYear,
                Status: 'Pending',
                // Explicitly valid flags
                PM: String(item.PM).toLowerCase() === 'true' || item.PM === true,
                CAL: String(item.CAL).toLowerCase() === 'true' || item.CAL === true,
                PMby: item.PMby || '-', // Ensure PMby carries over
                NewDueDate: format(newDate, 'yyyy-MM-dd'),
                tempId: Date.now() + Math.random()
            };
        });

        setStagingItems([...stagingItems, ...duplicated]);
        const capMsg = filterCap ? ` for ${filterCap}` : '';
        alert(`Duplicated ${duplicated.length} items from ${lastYear}${capMsg}`);
    };

    // Calendar View Helpers
    const uniqueEquipment = useMemo(() => {
        return [...new Set(stagingItems.map(i => i.EquipmentName))].sort();
    }, [stagingItems]);

    const getItemsForCell = (equipmentName, monthName) => {
        return stagingItems.filter(
            i => i.EquipmentName === equipmentName && i.Month === monthName
        );
    };

    // Drag and Drop Handlers
    const handleDragStart = (e, item) => {
        setDraggedItem(item);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e, targetMonthName) => {
        e.preventDefault();

        if (!draggedItem || draggedItem.Month === targetMonthName) {
            setDraggedItem(null);
            return;
        }

        // Calculate end of month date
        const monthIndex = MONTHS.indexOf(targetMonthName);
        const targetDate = new Date(planningYear, monthIndex + 1, 0); // Last day of month
        const newDueDate = format(targetDate, 'yyyy-MM-dd');

        // Update the item
        setStagingItems(stagingItems.map(item => {
            if (item.tempId === draggedItem.tempId) {
                return {
                    ...item,
                    DueDate: newDueDate,
                    Month: targetMonthName,
                    Year: planningYear
                };
            }
            return item;
        }));

        setDraggedItem(null);
    };

    const handleSubmit = () => {
        if (stagingItems.length === 0) return;
        setShowConfirmModal(true);
    };

    const handleConfirmSubmit = () => {
        addSchedule(stagingItems);
        setStagingItems([]);
        setShowConfirmModal(false);
        setViewMode('table');
        alert("Plan Submitted Successfully!");
    };

    return (
        <div className="space-y-6 flex flex-col pb-8">
            {/* Header Section */}
            <div className="gradient-atc p-6 rounded-xl shadow-lg shrink-0">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 text-white">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <CalIcon className="w-5 h-5 text-white/80" />
                            Assign Master Plan
                        </h2>
                        <p className="text-xs text-white/90 mt-1">Drag and drop master items to schedule maintenance</p>
                    </div>

                    <div className="flex items-center gap-3 w-full lg:w-auto bg-white/10 backdrop-blur-sm p-1.5 rounded-lg border border-white/20">
                        <div className="relative group">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-white/60 group-focus-within:text-white transition-colors" />
                            <input
                                placeholder="Search..."
                                className="pl-9 pr-4 py-2 bg-transparent text-sm text-white placeholder:text-white/60 border-none focus:ring-0 w-32 lg:w-48 transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="h-6 w-px bg-white/20 mx-1" />
                        <select
                            value={filterCap}
                            onChange={(e) => setFilterCap(e.target.value)}
                            className="bg-transparent text-sm font-medium text-white border-none focus:ring-0 cursor-pointer [&>option]:text-slate-900"
                        >
                            <option value="All">All Capabilities</option>
                            {capabilities.map((c, i) => {
                                const val = typeof c === 'string' ? c : c.capabilityName;
                                return <option key={i} value={val}>{val}</option>;
                            })}
                        </select>
                        <div className="h-6 w-px bg-white/20 mx-1" />
                        <div className="flex items-center gap-2 px-2">
                            <span className="text-[10px] font-medium text-white/80 uppercase tracking-wider">Year</span>
                            <div className="relative">
                                <input
                                    type="number"
                                    className="w-16 bg-white/20 text-white text-center font-bold rounded border-none focus:ring-1 focus:ring-white/50 py-1 text-xs"
                                    value={planningYear}
                                    onChange={(e) => setPlanningYear(parseInt(e.target.value))}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left: Source (Master List) */}
                {!isExpanded && (
                    <Card className="lg:col-span-4 flex flex-col border-0 shadow-md ring-1 ring-slate-200 overflow-hidden bg-white/50 backdrop-blur-sm lg:sticky lg:top-6 h-[calc(100vh-2rem)] lg:h-[calc(100vh-8rem)]">
                        <CardHeader className="pb-3 border-b border-slate-100 bg-white px-5 pt-5 shrink-0">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                    <div className="w-1.5 h-4 bg-teal-500 rounded-full" />
                                    Master Data
                                </CardTitle>
                                <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                                    {filteredMaster.length} Items
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-auto p-4 space-y-3 custom-scrollbar bg-slate-50/30">
                            {filteredMaster.map((item) => {
                                const expectedDates = getDueDatesInYear(item, pmCalList, planningYear);
                                const targetCount = expectedDates.length;
                                const planned = getAssignedCount(item.id);
                                const staged = getStagingCount(item.id);
                                const total = planned + staged;
                                const isComplete = total >= targetCount;

                                return (
                                    <div
                                        key={item.id}
                                        className={cn(
                                            "p-4 rounded-xl border transition-all duration-200 group relative",
                                            isComplete
                                                ? "bg-slate-50 border-slate-100 opacity-70"
                                                : "bg-white border-slate-200 hover:border-teal-300 hover:shadow-md hover:shadow-teal-500/5 hover:-translate-y-0.5"
                                        )}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex-1 min-w-0 pr-3">
                                                <h4 className={cn("font-bold text-xs truncate", isComplete ? "text-slate-500" : "text-slate-900")}>
                                                    {item.Equipment}
                                                </h4>
                                                <p className="text-[10px] text-slate-500 mt-0.5">{item.Action}</p>
                                            </div>
                                            <div className={cn(
                                                "shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                                                isComplete ? "bg-slate-200 text-slate-400" : "bg-teal-50 text-teal-600 group-hover:bg-teal-500 group-hover:text-white"
                                            )}>
                                                <button
                                                    onClick={() => handleAddToPlan(item)}
                                                    disabled={isComplete}
                                                    className="w-full h-full flex items-center justify-center cursor-pointer"
                                                >
                                                    {isComplete ? <X className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-50">
                                            <div className="flex items-center gap-1.5">
                                                <span className={cn(
                                                    "w-2 h-2 rounded-full",
                                                    item.PM ? "bg-blue-400" : "bg-slate-200"
                                                )} title="PM" />
                                                <span className={cn(
                                                    "w-2 h-2 rounded-full",
                                                    item.CAL ? "bg-purple-400" : "bg-slate-200"
                                                )} title="CAL" />
                                                <span className="text-slate-400 ml-1">{item.CapabilityName}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="flex flex-col items-end">
                                                    <span className={cn(
                                                        "font-bold",
                                                        isComplete ? "text-slate-400" : (total > 0 ? "text-amber-500" : "text-emerald-600")
                                                    )}>
                                                        {total} / {targetCount}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100 overflow-hidden rounded-b-xl">
                                            <div
                                                className={cn("h-full transition-all duration-500", isComplete ? "bg-slate-300" : "gradient-atc")}
                                                style={{ width: `${targetCount > 0 ? Math.min((total / targetCount) * 100, 100) : 100}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>
                )}

                {/* Right: Target (Schedule) */}
                <Card className={cn("flex flex-col border-0 shadow-md ring-1 ring-slate-200 overflow-hidden bg-white h-auto transition-all duration-300", isExpanded ? "lg:col-span-12" : "lg:col-span-8")}>
                    <CardHeader className="pb-3 border-b border-slate-100 px-5 pt-5">
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                            <div className="flex items-center gap-3">
                                <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                    <div className="w-1.5 h-4 bg-purple-500 rounded-full" />
                                    New Schedule
                                </CardTitle>
                                {stagingItems.length > 0 && (
                                    <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
                                        {stagingItems.length} Drafts
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-200">
                                <button
                                    onClick={() => setViewMode('table')}
                                    className={cn(
                                        "px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5",
                                        viewMode === 'table'
                                            ? "bg-white shadow-sm text-slate-900"
                                            : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                                    )}
                                >
                                    <Table className="h-3.5 w-3.5" />
                                    List
                                </button>
                                <button
                                    onClick={() => setViewMode('calendar')}
                                    className={cn(
                                        "px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5",
                                        viewMode === 'calendar'
                                            ? "bg-white shadow-sm text-slate-900"
                                            : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                                    )}
                                >
                                    <Grid className="h-3.5 w-3.5" />
                                    Board
                                </button>
                                <div className="w-px h-4 bg-slate-300 mx-1" />
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-xs hover:bg-white hover:text-red-600 text-slate-500"
                                    onClick={() => setStagingItems([])}
                                    disabled={stagingItems.length === 0}
                                >
                                    Clear All
                                </Button>
                                <div className="w-px h-4 bg-slate-300 mx-1" />
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-xs hover:bg-white hover:text-slate-900 text-slate-500"
                                    onClick={() => setIsExpanded(!isExpanded)}
                                >
                                    {isExpanded ? 'Collapse' : 'Expand'}
                                </Button>
                                <div className="w-px h-4 bg-slate-300 mx-1" />
                                <Button
                                    size="sm"
                                    className="text-[10px] bg-purple-600 hover:bg-purple-700 text-white shadow-sm border border-transparent h-7 px-2"
                                    onClick={handleDuplicateLastYear}
                                >
                                    Duplicate Last Year
                                </Button>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0 bg-slate-50 min-h-[500px]">
                        {stagingItems.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                    <ArrowRight className="w-8 h-8 text-slate-300" />
                                </div>
                                <p className="font-medium text-slate-600 text-sm">Ready to plan?</p>
                                <p className="text-xs mt-1">Select items from the master list to start scheduling.</p>
                            </div>
                        ) : viewMode === 'calendar' ? (
                            /* Calendar View */
                            <div className="overflow-x-auto w-full">
                                <table className="w-full text-sm border-collapse min-w-[1000px]">
                                    <thead className="bg-white sticky top-0 z-20 shadow-sm">
                                        <tr>
                                            <th className="text-left p-3 font-bold text-slate-800 text-xs uppercase tracking-wider sticky left-0 bg-white z-30 w-56 border-r border-b border-slate-200 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)]">
                                                Equipment
                                            </th>
                                            {MONTHS.map(m => (
                                                <th key={m} className="text-center p-2 font-bold text-slate-500 text-[10px] uppercase tracking-wider border-b border-r border-slate-100 min-w-[80px]">
                                                    {m.substring(0, 3)}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {uniqueEquipment.map(eq => (
                                            <tr key={eq} className="group hover:bg-white transition-colors bg-slate-50/30">
                                                <td className="p-3 font-medium text-slate-700 text-xs sticky left-0 bg-slate-50 group-hover:bg-white transition-colors z-20 border-r border-slate-200 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.05)]">
                                                    <div className="truncate w-full" title={eq}>{eq}</div>
                                                </td>
                                                {MONTHS.map(month => {
                                                    const items = getItemsForCell(eq, month);
                                                    return (
                                                        <td
                                                            key={month}
                                                            className="p-1 text-center border-r border-slate-200/50 align-top relative transition-colors bg-transparent"
                                                            onDragOver={(e) => {
                                                                e.preventDefault();
                                                                e.currentTarget.classList.add('bg-teal-50');
                                                            }}
                                                            onDragLeave={(e) => e.currentTarget.classList.remove('bg-teal-50')}
                                                            onDrop={(e) => {
                                                                e.currentTarget.classList.remove('bg-teal-50');
                                                                handleDrop(e, month);
                                                            }}
                                                        >
                                                            <div className="flex flex-col gap-1 min-h-[2.5rem] h-full justify-center">
                                                                {items.map(item => (
                                                                    <div
                                                                        key={item.tempId}
                                                                        draggable
                                                                        onDragStart={(e) => handleDragStart(e, item)}
                                                                        className={cn(
                                                                            "px-2 py-1.5 rounded-md text-[10px] font-bold transition-all duration-200 w-full text-center flex justify-center items-center gap-1 cursor-grab active:cursor-grabbing shadow-sm hover:scale-105 hover:shadow-md hover:z-10 relative group",
                                                                            item.PM ? "bg-blue-100 text-blue-700 border border-blue-200" : "bg-purple-100 text-purple-700 border border-purple-200"
                                                                        )}
                                                                        title={`Code: ${item.EquipmentCode || '-'}\n${item.Action}\nDue: ${item.DueDate}`}
                                                                    >
                                                                        {item.PM && <span>PM</span>}
                                                                        {item.PM && item.CAL && <span className="opacity-50">/</span>}
                                                                        {item.CAL && <span>CAL</span>}

                                                                        {/* Remove Button */}
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleRemoveStaged(item.tempId);
                                                                            }}
                                                                            className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-600 z-20"
                                                                            title="Remove"
                                                                        >
                                                                            <X className="w-2.5 h-2.5" />
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            /* Table View */
                            <div className="overflow-x-auto w-full">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-white sticky top-0 z-10 shadow-sm text-slate-500">
                                        <tr>
                                            <th className="p-4 font-bold text-[10px] uppercase tracking-wider border-b border-slate-200">Equipment</th>
                                            <th className="p-4 font-bold text-[10px] uppercase tracking-wider border-b border-slate-200">Action</th>
                                            <th className="p-4 font-bold text-[10px] uppercase tracking-wider border-b border-slate-200 w-40">Due Date</th>
                                            <th className="p-4 font-bold text-[10px] uppercase tracking-wider border-b border-slate-200">Assignee</th>
                                            <th className="p-4 font-bold text-[10px] uppercase tracking-wider border-b border-slate-200 w-24 text-center">Type</th>
                                            <th className="p-4 font-bold text-[10px] uppercase tracking-wider border-b border-slate-200 w-16"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                        {stagingItems.map((item, idx) => (
                                            <tr key={item.tempId} className="hover:bg-slate-50 transition-colors group">
                                                <td className="p-4">
                                                    <div className="font-bold text-slate-800 text-xs">{item.EquipmentName}</div>
                                                    <div className="text-[10px] text-slate-500 mt-0.5">{item.Capability}</div>
                                                </td>
                                                <td className="p-4 text-slate-600 text-[10px] font-medium">{item.Action}</td>
                                                <td className="p-4">
                                                    <input
                                                        type="date"
                                                        className="text-xs border border-slate-200 rounded-lg px-3 py-2 w-full bg-slate-50 focus:bg-white transition-all outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 font-medium text-slate-700"
                                                        value={item.DueDate}
                                                        onChange={(e) => handleDateChange(item.tempId, e.target.value)}
                                                    />
                                                </td>
                                                <td className="p-4">
                                                    <Input
                                                        type="text"
                                                        className="text-xs h-8"
                                                        placeholder="Assign to..."
                                                        value={item.Assignee || ''}
                                                        onChange={(e) => {
                                                            setStagingItems(stagingItems.map(i =>
                                                                i.tempId === item.tempId ? { ...i, Assignee: e.target.value } : i
                                                            ));
                                                        }}
                                                    />
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        {item.PM && <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-bold">PM</span>}
                                                        {item.CAL && <span className="text-[10px] px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full font-bold">CAL</span>}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <button
                                                        onClick={() => handleRemoveStaged(item.tempId)}
                                                        className="text-slate-300 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50 opacity-0 group-hover:opacity-100"
                                                        title="Remove item"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>

                    <div className="p-4 border-t border-slate-100 bg-white z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                        <Button
                            className="w-full gradient-atc hover:gradient-atc-hover text-white h-12 text-sm font-bold shadow-lg shadow-teal-500/20 rounded-xl transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                            onClick={handleSubmit}
                            disabled={stagingItems.length === 0}
                        >
                            Confirm & Submit Plan ({stagingItems.length} Items)
                        </Button>
                    </div>
                </Card>
            </div>
            {showConfirmModal && (
                <PlanningConfirmModal
                    items={stagingItems}
                    year={planningYear}
                    onConfirm={handleConfirmSubmit}
                    onCancel={() => setShowConfirmModal(false)}
                />
            )}
        </div>
    );
}
