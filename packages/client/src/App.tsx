import { useState, useEffect } from 'react';
import { trpc } from './trpc';
import { PatientList } from './components/PatientList';
import { BiomarkerCharts } from './components/BiomarkerCharts';
import { AddDataForm } from './components/AddDataForm';

export function App() {
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [confirmingReset, setConfirmingReset] = useState(false);

  const patients = trpc.patient.getAll.useQuery();
  const utils = trpc.useUtils();

  const fetchFromApi = trpc.patient.fetchFromApi.useMutation({
    onSuccess: () => {
      void utils.patient.getAll.invalidate();
    },
  });

  const reset = trpc.patient.reset.useMutation({
    onSuccess: () => {
      void utils.patient.getAll.invalidate();
      setSelectedPatientId(null);
      setConfirmingReset(false);
      fetchFromApi.reset();
    },
    onError: () => {
      setConfirmingReset(false);
    },
  });

  const isMutating = fetchFromApi.isPending || reset.isPending;

  useEffect(() => {
    if (!confirmingReset) return;
    const timer = setTimeout(() => setConfirmingReset(false), 3000);
    return () => clearTimeout(timer);
  }, [confirmingReset]);

  const selectedPatient = patients.data?.find(p => p.id === selectedPatientId);

  function handleResetClick() {
    if (confirmingReset) {
      reset.mutate();
    } else {
      setConfirmingReset(true);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Patient Biomarker Data
        </h1>

        <div className="flex flex-wrap gap-3 mb-2">
          <button
            type="button"
            onClick={() => {
              setConfirmingReset(false);
              fetchFromApi.mutate();
            }}
            disabled={isMutating}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {fetchFromApi.isPending ? 'Fetching...' : 'Fetch from API'}
          </button>
          <button
            type="button"
            onClick={() => {
              setConfirmingReset(false);
              setShowAddForm(prev => !prev);
            }}
            className="px-4 py-2 bg-gray-700 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            {showAddForm ? 'Cancel' : 'Add Data'}
          </button>
          <button
            type="button"
            onClick={handleResetClick}
            disabled={isMutating || !patients.data?.length}
            className={`px-4 py-2 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors ${
              confirmingReset
                ? 'bg-orange-600 hover:bg-orange-700'
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {reset.isPending ? 'Resetting...' : confirmingReset ? 'Confirm Reset' : 'Reset'}
          </button>
        </div>

        {fetchFromApi.isSuccess && (
          <p className="text-green-600 text-sm mb-2">
            Imported {fetchFromApi.data?.imported ?? 0} records
          </p>
        )}

        {(patients.isError || fetchFromApi.isError || reset.isError) && (
          <div className="mb-4">
            {patients.isError && (
              <p className="text-red-600 text-sm">Failed to load patients: {patients.error.message}</p>
            )}
            {fetchFromApi.isError && (
              <p className="text-red-600 text-sm">{fetchFromApi.error.message}</p>
            )}
            {reset.isError && (
              <p className="text-red-600 text-sm">{reset.error.message}</p>
            )}
          </div>
        )}

        {showAddForm && (
          <div className="mb-6">
            <AddDataForm
              patients={patients.data ?? []}
              onSuccess={() => {
                void utils.patient.getAll.invalidate();
              }}
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <PatientList
              patients={patients.data ?? []}
              selectedId={selectedPatientId}
              onSelect={setSelectedPatientId}
              isLoading={patients.isLoading}
            />
          </div>
          <div className="lg:col-span-3">
            {selectedPatient ? (
              <BiomarkerCharts patient={selectedPatient} />
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center text-gray-400">
                {patients.data?.length
                  ? 'Select a patient to view biomarker trends'
                  : 'No data loaded. Click "Fetch from API" to start.'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
