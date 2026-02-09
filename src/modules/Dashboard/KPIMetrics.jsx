import React from 'react';
import { TrendingUp, TrendingDown, Clock, RefreshCw } from 'lucide-react';

export default function KPIMetrics({ metrics }) {
    const {
        completedOnOriginal,
        postponedCases,
        originalPlanPercent,
        newPlanPercent,
        totalEvents
    } = metrics;

    const kpiData = [
        {
            label: 'Completed on Original Plan',
            value: completedOnOriginal,
            unit: '',
            icon: TrendingUp,
            color: 'emerald'
        },
        {
            label: 'Postponed Cases',
            value: postponedCases,
            unit: '',
            icon: RefreshCw,
            color: 'amber'
        },
        {
            label: '% Completed within Original Plan',
            value: originalPlanPercent,
            unit: '%',
            icon: Clock,
            color: originalPlanPercent >= 80 ? 'emerald' : 'rose',
            target: 80,
            isAboveTarget: originalPlanPercent >= 80
        },
        {
            label: '% Completed within New Plan',
            value: newPlanPercent,
            unit: '%',
            icon: TrendingUp,
            color: newPlanPercent >= 100 ? 'emerald' : 'rose',
            target: 100,
            isAboveTarget: newPlanPercent >= 100
        }
    ];

    const getColorClasses = (color) => {
        const colors = {
            emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            amber: 'bg-amber-50 text-amber-700 border-amber-200',
            rose: 'bg-rose-50 text-rose-700 border-rose-200'
        };
        return colors[color] || colors.emerald;
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {kpiData.map((kpi, index) => {
                const Icon = kpi.icon;
                return (
                    <div
                        key={index}
                        className={`p-5 rounded-xl border-2 transition-all hover:shadow-md ${getColorClasses(kpi.color)}`}
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                                <p className="text-xs font-medium opacity-75 uppercase tracking-wide mb-1">
                                    {kpi.label}
                                </p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-bold">
                                        {kpi.value}
                                    </span>
                                    <span className="text-lg font-semibold opacity-70">
                                        {kpi.unit}
                                    </span>
                                </div>
                            </div>
                            <div className={`p-3 rounded-lg ${kpi.color === 'emerald' ? 'bg-emerald-100' : kpi.color === 'amber' ? 'bg-amber-100' : 'bg-rose-100'}`}>
                                <Icon className="w-6 h-6" />
                            </div>
                        </div>

                        {kpi.target && (
                            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-current/20">
                                <div className={`flex items-center gap-1 text-xs font-semibold`}>
                                    {kpi.isAboveTarget ? (
                                        <>
                                            <TrendingUp className="w-3 h-3" />
                                            <span>Above Target ({kpi.target}%)</span>
                                        </>
                                    ) : (
                                        <>
                                            <TrendingDown className="w-3 h-3" />
                                            <span>Below Target ({kpi.target}%)</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
