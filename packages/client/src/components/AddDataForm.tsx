import { useState, type SyntheticEvent } from 'react';
import type { Patient } from '../trpc';
import { trpc } from '../trpc';
import { BIOMARKERS } from '../biomarkers';

interface AddDataFormProps {
  patients: Patient[];
  onSuccess: () => void;
}

const DEFAULT_FORM = {
  clientId: '',
  dateTesting: '',
  birthdate: '',
  gender: '1',
  ethnicity: '1',
  creatine: '',
  creatineUnit: 'mgdl',
  chloride: '',
  chlorideUnit: 'mmoll',
  fastingGlucose: '',
  fastingGlucoseUnit: 'mgdl',
  potassium: '',
  potassiumUnit: 'mmoll',
  sodium: '',
  sodiumUnit: 'mmoll',
  totalCalcium: '',
  totalCalciumUnit: 'mgdl',
  totalProtein: '',
  totalProteinUnit: 'gdl',
};

type FormState = typeof DEFAULT_FORM;

const inputBase = 'px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

export function AddDataForm({ patients, onSuccess }: AddDataFormProps) {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const isExistingPatient = patients.some(p => p.clientId === form.clientId);

  const addData = trpc.patient.addData.useMutation({
    onSuccess: () => {
      onSuccess();
      setForm(prev => {
        const next = { ...prev, dateTesting: '' };
        for (const { key } of BIOMARKERS) next[key] = '';
        return next;
      });
    },
  });

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function handlePatientSelect(clientId: string) {
    const existing = patients.find(p => p.clientId === clientId);
    if (!existing) return;
    setForm(prev => ({
      ...prev,
      clientId,
      birthdate: existing.birthdate.toISOString().slice(0, 10),
      gender: String(existing.gender),
      ethnicity: String(existing.ethnicity),
    }));
  }

  function parseGender(v: string): 1 | 2 {
    return v === '2' ? 2 : 1;
  }

  function parseEthnicity(v: string): 1 | 2 | 3 | 4 | 5 {
    switch (v) {
      case '2': return 2;
      case '3': return 3;
      case '4': return 4;
      case '5': return 5;
      default: return 1;
    }
  }

  function handleSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    addData.mutate({
      clientId: form.clientId,
      dateTesting: form.dateTesting,
      birthdate: form.birthdate,
      gender: parseGender(form.gender),
      ethnicity: parseEthnicity(form.ethnicity),
      creatine: Number(form.creatine),
      creatineUnit: form.creatineUnit,
      chloride: Number(form.chloride),
      chlorideUnit: form.chlorideUnit,
      fastingGlucose: Number(form.fastingGlucose),
      fastingGlucoseUnit: form.fastingGlucoseUnit,
      potassium: Number(form.potassium),
      potassiumUnit: form.potassiumUnit,
      sodium: Number(form.sodium),
      sodiumUnit: form.sodiumUnit,
      totalCalcium: Number(form.totalCalcium),
      totalCalciumUnit: form.totalCalciumUnit,
      totalProtein: Number(form.totalProtein),
      totalProteinUnit: form.totalProteinUnit,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
      <h3 className="font-semibold text-gray-900 mb-4">Add Test Result</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div>
          <label htmlFor="clientId" className="block text-xs font-medium text-gray-600 mb-1">Patient ID</label>
          <div className="flex gap-2">
            <input
              id="clientId"
              type="text"
              value={form.clientId}
              onChange={e => updateField('clientId', e.target.value)}
              placeholder="e.g. abc123"
              required
              className={`${inputBase} flex-1`}
            />
            {patients.length > 0 && (
              <select
                value=""
                onChange={e => handlePatientSelect(e.target.value)}
                aria-label="Select existing patient"
                className={inputBase}
              >
                <option value="">Pick</option>
                {patients.map(p => (
                  <option key={p.id} value={p.clientId}>{p.clientId}</option>
                ))}
              </select>
            )}
          </div>
        </div>
        <div>
          <label htmlFor="dateTesting" className="block text-xs font-medium text-gray-600 mb-1">Test Date</label>
          <input
            id="dateTesting"
            type="date"
            value={form.dateTesting}
            onChange={e => updateField('dateTesting', e.target.value)}
            required
            className={`${inputBase} w-full`}
          />
        </div>
        <div>
          <label htmlFor="birthdate" className="block text-xs font-medium text-gray-600 mb-1">Birthdate</label>
          <input
            id="birthdate"
            type="date"
            value={form.birthdate}
            onChange={e => updateField('birthdate', e.target.value)}
            required
            disabled={isExistingPatient}
            className={`${inputBase} w-full disabled:bg-gray-50 disabled:text-gray-500`}
          />
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label htmlFor="gender" className="block text-xs font-medium text-gray-600 mb-1">Gender</label>
            <select
              id="gender"
              value={form.gender}
              onChange={e => updateField('gender', e.target.value)}
              disabled={isExistingPatient}
              className={`${inputBase} w-full disabled:bg-gray-50 disabled:text-gray-500`}
            >
              <option value="1">Male</option>
              <option value="2">Female</option>
            </select>
          </div>
          <div className="flex-1">
            <label htmlFor="ethnicity" className="block text-xs font-medium text-gray-600 mb-1">Ethnicity</label>
            <select
              id="ethnicity"
              value={form.ethnicity}
              onChange={e => updateField('ethnicity', e.target.value)}
              disabled={isExistingPatient}
              className={`${inputBase} w-full disabled:bg-gray-50 disabled:text-gray-500`}
            >
              <option value="1">White</option>
              <option value="2">Black or African American</option>
              <option value="3">Asian</option>
              <option value="4">Hispanic or Latino</option>
              <option value="5">Other</option>
            </select>
          </div>
        </div>
      </div>

      {isExistingPatient && (
        <p className="text-xs text-gray-500 mb-4">
          Existing patient — demographics are locked.
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        {BIOMARKERS.map(({ key, unitKey, label, units }) => (
          <div key={key} className="flex gap-2">
            <div className="flex-1">
              <label htmlFor={key} className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
              <input
                id={key}
                type="number"
                step="0.01"
                value={form[key]}
                onChange={e => updateField(key, e.target.value)}
                required
                className={`${inputBase} w-full`}
              />
            </div>
            <div className="w-24">
              <label htmlFor={unitKey} className="block text-xs font-medium text-gray-600 mb-1">Unit</label>
              <select
                id={unitKey}
                value={form[unitKey]}
                onChange={e => updateField(unitKey, e.target.value)}
                className={`${inputBase} w-full`}
              >
                {units.map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 items-center">
        <button
          type="submit"
          disabled={addData.isPending}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {addData.isPending ? 'Saving...' : 'Save'}
        </button>
        {addData.isError && (
          <p className="text-red-600 text-sm self-center">{addData.error.message}</p>
        )}
        {addData.isSuccess && (
          <p className="text-green-600 text-sm self-center">Saved. Add another result?</p>
        )}
      </div>
    </form>
  );
}
