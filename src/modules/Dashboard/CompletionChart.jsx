import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

export default function CompletionChart({ monthlyData }) {
    return (
        <div className="bg-white p-6 rounded-xl border-2 border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Monthly Completion Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                        dataKey="month"
                        stroke="#64748b"
                        style={{ fontSize: '12px', fontWeight: '500' }}
                    />
                    <YAxis
                        stroke="#64748b"
                        style={{ fontSize: '12px', fontWeight: '500' }}
                        domain={[0, 100]}
                        ticks={[0, 20, 40, 60, 80, 100]}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#ffffff',
                            border: '2px solid #e2e8f0',
                            borderRadius: '8px',
                            fontSize: '12px'
                        }}
                        formatter={(value) => `${value.toFixed(1)}%`}
                    />
                    <Legend
                        wrapperStyle={{ fontSize: '12px', fontWeight: '600' }}
                    />

                    {/* KPI Reference Lines */}
                    <ReferenceLine
                        y={80}
                        stroke="#10b981"
                        strokeDasharray="5 5"
                        label={{ value: 'Original Plan Target (80%)', position: 'right', fill: '#10b981', fontSize: 10 }}
                    />
                    <ReferenceLine
                        y={100}
                        stroke="#3b82f6"
                        strokeDasharray="5 5"
                        label={{ value: 'New Plan Target (100%)', position: 'right', fill: '#3b82f6', fontSize: 10 }}
                    />

                    <Bar
                        dataKey="originalPlanPercent"
                        fill="#10b981"
                        name="% Complete (Original Plan)"
                        radius={[4, 4, 0, 0]}
                    />
                    <Bar
                        dataKey="newPlanPercent"
                        fill="#3b82f6"
                        name="% Complete (New Plan)"
                        radius={[4, 4, 0, 0]}
                    />
                </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-3 bg-emerald-500 rounded"></div>
                    <span className="text-slate-600">Original Plan: Completed by initial due date</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-3 bg-blue-500 rounded"></div>
                    <span className="text-slate-600">New Plan: Completed by postponed due date</span>
                </div>
            </div>
        </div>
    );
}
