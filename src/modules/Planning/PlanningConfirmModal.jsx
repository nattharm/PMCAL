import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { X, Calendar, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';

export default function PlanningConfirmModal({ items, year, onConfirm, onCancel }) {
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [expandedMonths, setExpandedMonths] = useState({});

    const toggleMonth = (month) => {
        setExpandedMonths(prev => ({
            ...prev,
            [month]: !prev[month]
        }));
    };
    // Group items by month
    const byMonth = items.reduce((acc, item) => {
        acc[item.Month] = (acc[item.Month] || []).concat(item);
        return acc;
    }, {});

    const months = Object.keys(byMonth).sort((a, b) => {
        const monthOrder = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        return monthOrder.indexOf(a) - monthOrder.indexOf(b);
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gradient-to-br from-slate-900/60 to-slate-900/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="gradient-atc-light border-b border-slate-100 p-6">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="bg-teal-100 p-2 rounded-lg">
                                <Calendar className="w-6 h-6 text-teal-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Confirm Schedule Submission</h3>
                                <p className="text-sm text-slate-600">Year {year}</p>
                            </div>
                        </div>
                        <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-amber-800">
                            <p className="font-medium">Are you sure you want to submit this plan?</p>
                            <p className="mt-1">You are about to create <strong>{items.length} PM/CAL schedule items</strong> for the year {year}.</p>
                        </div>
                    </div>

                    <div className="max-h-80 overflow-y-auto custom-scrollbar">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 sticky top-0">
                                <tr className="border-b border-slate-200">
                                    <th className="text-left p-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">Month</th>
                                    <th className="text-right p-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">Items</th>
                                    <th className="text-right p-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">PM</th>
                                    <th className="text-right p-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">CAL</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {months.map(month => {
                                    const monthItems = byMonth[month];
                                    const pmCount = monthItems.filter(i => i.PM).length;
                                    const calCount = monthItems.filter(i => i.CAL).length;
                                    const isExpanded = expandedMonths[month];

                                    return (
                                        <React.Fragment key={month}>
                                            <tr
                                                className="hover:bg-slate-50 cursor-pointer transition-colors"
                                                onClick={() => toggleMonth(month)}
                                            >
                                                <td className="p-3 font-medium text-slate-900">
                                                    <div className="flex items-center gap-2">
                                                        {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                                                        {month}
                                                    </div>
                                                </td>
                                                <td className="p-3 text-right text-slate-600 font-semibold">{monthItems.length}</td>
                                                <td className="p-3 text-right">
                                                    {pmCount > 0 && <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-bold">{pmCount}</span>}
                                                </td>
                                                <td className="p-3 text-right">
                                                    {calCount > 0 && <span className="inline-block px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-[10px] font-bold">{calCount}</span>}
                                                </td>
                                            </tr>
                                            {isExpanded && (
                                                <tr className="bg-slate-50/50">
                                                    <td colSpan={4} className="p-0 border-b border-slate-100">
                                                        <div className="px-10 py-3 space-y-1.5 animate-in slide-in-from-top-2 duration-200">
                                                            {monthItems.map((item, idx) => (
                                                                <div key={idx} className="flex justify-between items-center text-xs">
                                                                    <span className="text-slate-700 font-medium">{item.EquipmentName}</span>
                                                                    <div className="flex gap-1">
                                                                        {item.PM && <span className="text-[9px] text-blue-500 uppercase font-black">PM</span>}
                                                                        {item.CAL && <span className="text-[9px] text-purple-500 uppercase font-black">CAL</span>}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                            <tfoot className="border-t-2 border-slate-300 bg-slate-50">
                                <tr className="font-bold">
                                    <td className="p-3 text-slate-900">Total</td>
                                    <td className="p-3 text-right text-slate-900">{items.length}</td>
                                    <td className="p-3 text-right">
                                        <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                            {items.filter(i => i.PM).length}
                                        </span>
                                    </td>
                                    <td className="p-3 text-right">
                                        <span className="inline-block px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                                            {items.filter(i => i.CAL).length}
                                        </span>
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
                    <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative flex items-center">
                            <input
                                type="checkbox"
                                className="w-5 h-5 rounded border-slate-300 text-teal-600 focus:ring-teal-500 transition-all cursor-pointer"
                                checked={isConfirmed}
                                onChange={(e) => setIsConfirmed(e.target.checked)}
                            />
                        </div>
                        <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">
                            I have reviewed the <strong>{items.length} items</strong> and <strong>Year {year}</strong> for this plan.
                        </span>
                    </label>
                </div>

                <div className="p-6 bg-white border-t border-slate-200 flex justify-end space-x-3">
                    <Button type="button" variant="ghost" onClick={onCancel}>
                        Cancel
                    </Button>
                    <button
                        onClick={onConfirm}
                        disabled={!isConfirmed}
                        className={`font-bold px-8 py-2.5 rounded-xl shadow-lg transition-all duration-300 focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 ${!isConfirmed
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                            : 'gradient-atc hover:gradient-atc-hover text-white cursor-pointer hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0'
                            }`}
                    >
                        Confirm & Submit Plan
                    </button>
                </div>
            </div>
        </div>
    );
}
