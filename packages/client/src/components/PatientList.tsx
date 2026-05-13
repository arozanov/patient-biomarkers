import type { Patient } from '../trpc';
import { formatDate } from '../utils/format';

interface PatientListProps {
  patients: Patient[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  isLoading: boolean;
}

export function PatientList({ patients, selectedId, onSelect, isLoading }: PatientListProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900">
          Patients{patients.length > 0 && ` (${patients.length})`}
        </h2>
      </div>
      {patients.length === 0 ? (
        <p className="p-4 text-gray-400 text-sm">No patients loaded</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {patients.map(patient => (
            <li key={patient.id}>
              <button
                type="button"
                onClick={() => onSelect(patient.id)}
                className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                  selectedId === patient.id ? 'bg-blue-50 border-l-2 border-blue-600' : ''
                }`}
              >
                <div className="font-mono text-sm text-gray-900">
                  {patient.clientId}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  Born: {formatDate(patient.birthdate)}
                  {' / '}
                  {patient.gender === 1 ? 'M' : patient.gender === 2 ? 'F' : '?'}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {patient.testResults.length} result{patient.testResults.length !== 1 ? 's' : ''}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
