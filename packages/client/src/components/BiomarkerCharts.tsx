import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { Patient } from '../trpc';
import { BIOMARKERS } from '../biomarkers';
import { formatDate } from '../utils/format';

interface BiomarkerChartsProps {
  patient: Patient;
}

export function BiomarkerCharts({ patient }: BiomarkerChartsProps) {
  const sorted = [...patient.testResults].sort(
    (a, b) => a.dateTesting.getTime() - b.dateTesting.getTime()
  );

  if (sorted.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center text-gray-400">
        No test results for this patient
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Patient {patient.clientId}
      </h2>

      <div className="bg-white rounded-lg shadow mb-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left p-3 font-medium text-gray-600">Date</th>
              {BIOMARKERS.map(bm => (
                <th key={bm.key} className="text-right p-3 font-medium text-gray-600">
                  {bm.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sorted.map(tr => (
              <tr key={tr.id} className="hover:bg-gray-50">
                <td className="p-3 text-gray-900 whitespace-nowrap">
                  {formatDate(tr.dateTesting)}
                </td>
                {BIOMARKERS.map(bm => (
                  <td key={bm.key} className="p-3 text-right text-gray-700 tabular-nums whitespace-nowrap">
                    {tr[bm.key].toFixed(2)}{' '}
                    <span className="text-gray-400">{tr[bm.unitKey]}</span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {BIOMARKERS.map(bm => {
          const distinctUnits = new Set(sorted.map(tr => tr[bm.unitKey]));
          const isMixed = distinctUnits.size > 1;
          const data = sorted.map(tr => ({
            date: formatDate(tr.dateTesting),
            value: tr[bm.key],
          }));

          return (
            <div key={bm.key} className="bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                {bm.label} ({isMixed ? [...distinctUnits].join(', ') : sorted[0]?.[bm.unitKey] ?? ''})
              </h3>
              {isMixed ? (
                <p className="text-xs text-amber-600 py-12 text-center">
                  Mixed units across records — refer to table above.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={bm.color}
                      strokeWidth={2}
                      dot={{ r: 3, fill: bm.color }}
                      name={bm.label}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
