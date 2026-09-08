'use client';

import { useId, useRef, useState } from 'react';
import { API_BASE_URL } from '@/lib/api';
import {
  Collection,
  CustomEndpointAction,
  CustomEndpointAuthType,
  CustomEndpointInput,
  HttpMethod,
  ValidatePasswordMode,
} from '@/types/apiGen';

const HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
const ACTIONS: CustomEndpointAction[] = ['list', 'get', 'create', 'update', 'delete', 'findBy', 'validate'];
const ID_ACTIONS: CustomEndpointAction[] = ['get', 'update', 'delete'];
const VALIDATE_PASSWORD_MODES: { value: ValidatePasswordMode; label: string }[] = [
  { value: 'bcrypt', label: 'Hashed (bcrypt)' },
  { value: 'plain', label: 'Plain text' },
];
const AUTH_TYPES: { value: CustomEndpointAuthType; label: string }[] = [
  { value: 'none', label: 'No Auth' },
  { value: 'basic', label: 'Basic Auth' },
  { value: 'bearer', label: 'Bearer Token' },
];
const DEFAULT_ACTION: Record<HttpMethod, CustomEndpointAction> = {
  GET: 'list',
  POST: 'create',
  PUT: 'update',
  PATCH: 'update',
  DELETE: 'delete',
};

interface InputRow {
  id: string;
  requestField: string;
  recordField: string;
  required: boolean;
  isPasswordField: boolean;
}

interface ResponseRow {
  id: string;
  recordField: string;
  responseField: string;
}

interface TransformRow {
  id: string;
  field: string;
  expression: string;
}

export interface EndpointFormValues {
  name: string;
  method: HttpMethod;
  action: CustomEndpointAction;
  path: string;
  collectionId: string;
  inputMapping: InputRow[];
  transformSteps: TransformRow[];
  responseMapping: ResponseRow[];
  validatePasswordMode: ValidatePasswordMode;
  authType: CustomEndpointAuthType;
  authUsername: string;
  authPassword: string;
  authToken: string;
}

function emptyInputRow(id: string): InputRow {
  return { id, requestField: '', recordField: '', required: false, isPasswordField: false };
}

function emptyResponseRow(id: string): ResponseRow {
  return { id, recordField: '', responseField: '' };
}

function emptyTransformRow(id: string): TransformRow {
  return { id, field: '', expression: '' };
}

export function defaultFormValues(): EndpointFormValues {
  return {
    name: '',
    method: 'GET',
    action: 'list',
    path: '',
    collectionId: '',
    inputMapping: [],
    transformSteps: [],
    responseMapping: [],
    validatePasswordMode: 'bcrypt',
    authType: 'none',
    authUsername: '',
    authPassword: '',
    authToken: '',
  };
}

export function toFormValues(input: CustomEndpointInput, idPrefix: string): EndpointFormValues {
  return {
    name: input.name,
    method: input.method,
    action: input.action,
    path: input.path,
    collectionId: input.collectionId,
    inputMapping: input.inputMapping.map((r, i) => ({ id: `${idPrefix}-in-${i}`, isPasswordField: false, ...r })),
    transformSteps: (input.transformSteps ?? []).map((r, i) => ({ id: `${idPrefix}-tf-${i}`, ...r })),
    responseMapping: input.responseMapping.map((r, i) => ({ id: `${idPrefix}-out-${i}`, ...r })),
    validatePasswordMode: input.validatePasswordMode ?? 'bcrypt',
    authType: input.authType ?? 'none',
    authUsername: input.authUsername ?? '',
    authPassword: '',
    authToken: '',
  };
}

function normalizePathPreview(path: string): string {
  return path
    .split('/')
    .map((s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''))
    .filter(Boolean)
    .join('/');
}

interface EndpointFormProps {
  collections: Collection[];
  initialValues?: EndpointFormValues;
  submitLabel: string;
  saving: boolean;
  error: string | null;
  onSubmit: (payload: CustomEndpointInput) => void;
}

export default function EndpointForm({
  collections,
  initialValues,
  submitLabel,
  saving,
  error,
  onSubmit,
}: EndpointFormProps) {
  const idPrefix = useId();
  const [values, setValues] = useState<EndpointFormValues>(initialValues ?? defaultFormValues());
  const [initialAuthType] = useState(values.authType);
  const inputRowCounter = useRef(values.inputMapping.length);
  const transformRowCounter = useRef(values.transformSteps.length);
  const responseRowCounter = useRef(values.responseMapping.length);

  function update(patch: Partial<EndpointFormValues>) {
    setValues((prev) => ({ ...prev, ...patch }));
  }

  function handleMethodChange(method: HttpMethod) {
    update({ method, action: DEFAULT_ACTION[method] });
  }

  function addInputRow() {
    update({
      inputMapping: [...values.inputMapping, emptyInputRow(`${idPrefix}-in-${inputRowCounter.current++}`)],
    });
  }
  function updateInputRow(id: string, patch: Partial<InputRow>) {
    update({ inputMapping: values.inputMapping.map((r) => (r.id === id ? { ...r, ...patch } : r)) });
  }
  function removeInputRow(id: string) {
    update({ inputMapping: values.inputMapping.filter((r) => r.id !== id) });
  }

  function addTransformRow() {
    update({
      transformSteps: [
        ...values.transformSteps,
        emptyTransformRow(`${idPrefix}-tf-${transformRowCounter.current++}`),
      ],
    });
  }
  function updateTransformRow(id: string, patch: Partial<TransformRow>) {
    update({ transformSteps: values.transformSteps.map((r) => (r.id === id ? { ...r, ...patch } : r)) });
  }
  function removeTransformRow(id: string) {
    update({ transformSteps: values.transformSteps.filter((r) => r.id !== id) });
  }

  function addResponseRow() {
    update({
      responseMapping: [
        ...values.responseMapping,
        emptyResponseRow(`${idPrefix}-out-${responseRowCounter.current++}`),
      ],
    });
  }
  function updateResponseRow(id: string, patch: Partial<ResponseRow>) {
    update({ responseMapping: values.responseMapping.map((r) => (r.id === id ? { ...r, ...patch } : r)) });
  }
  function removeResponseRow(id: string) {
    update({ responseMapping: values.responseMapping.filter((r) => r.id !== id) });
  }

  const selectedCollection = collections.find((c) => c.id === values.collectionId);
  const showInputMapping =
    values.action === 'create' ||
    values.action === 'update' ||
    values.action === 'findBy' ||
    values.action === 'validate';
  const showResponseMapping = values.action !== 'delete';
  const showTransformSteps = values.action !== 'delete';
  const isValidateAction = values.action === 'validate';
  const keepsExistingSecret = initialAuthType === values.authType && initialAuthType !== 'none';
  const normalizedPath = normalizePathPreview(values.path);
  const previewPath = ID_ACTIONS.includes(values.action) ? `${normalizedPath}/:id` : normalizedPath;

  function handleSubmit() {
    const payload: CustomEndpointInput = {
      name: values.name.trim(),
      method: values.method,
      action: values.action,
      path: values.path,
      collectionId: values.collectionId,
      inputMapping: values.inputMapping
        .filter((r) => r.requestField.trim() || r.recordField.trim())
        .map(({ requestField, recordField, required, isPasswordField }) => ({
          requestField,
          recordField,
          required,
          ...(isValidateAction ? { isPasswordField } : {}),
        })),
      transformSteps: values.transformSteps
        .filter((r) => r.field.trim() || r.expression.trim())
        .map(({ field, expression }) => ({ field, expression })),
      responseMapping: values.responseMapping
        .filter((r) => r.recordField.trim() || r.responseField.trim())
        .map(({ recordField, responseField }) => ({ recordField, responseField })),
      ...(isValidateAction ? { validatePasswordMode: values.validatePasswordMode } : {}),
      authType: values.authType,
      authUsername: values.authType === 'basic' ? values.authUsername.trim() : null,
      ...(values.authPassword.trim() ? { authPassword: values.authPassword.trim() } : {}),
      ...(values.authToken.trim() ? { authToken: values.authToken.trim() } : {}),
    };
    onSubmit(payload);
  }

  const canSubmit =
    values.name.trim().length > 0 && values.path.trim().length > 0 && values.collectionId.length > 0;

  const inputClass =
    'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500';
  const rowInputClass =
    'flex-1 rounded-lg border border-slate-300 px-2 py-1.5 text-sm shadow-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500';

  return (
    <div className="space-y-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Name</label>
          <input
            value={values.name}
            onChange={(e) => update({ name: e.target.value })}
            placeholder="e.g. Active orders"
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Collection</label>
          <select
            value={values.collectionId}
            onChange={(e) => update({ collectionId: e.target.value })}
            className={inputClass}
          >
            <option value="">Select a collection...</option>
            {collections.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">HTTP method</label>
          <select
            value={values.method}
            onChange={(e) => handleMethodChange(e.target.value as HttpMethod)}
            className={inputClass}
          >
            {HTTP_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Action</label>
          <select
            value={values.action}
            onChange={(e) => update({ action: e.target.value as CustomEndpointAction })}
            className={inputClass}
          >
            {ACTIONS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
        <div className="col-span-2">
          <label className="mb-1 block text-sm font-medium text-slate-700">Path</label>
          <input
            value={values.path}
            onChange={(e) => update({ path: e.target.value })}
            placeholder="e.g. orders-summary"
            className={inputClass}
          />
        </div>
      </div>

      <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4 text-sm">
        <p className="font-medium text-indigo-800">Route preview</p>
        <p className="mt-1 font-mono text-indigo-900">
          <span className="font-semibold">{values.method}</span> {API_BASE_URL}/api/v2/{previewPath || '...'}
        </p>
      </div>

      {selectedCollection && (
        <p className="text-xs text-slate-500">
          Fields in <span className="font-medium text-slate-700">{selectedCollection.name}</span>:{' '}
          {selectedCollection.fields.map((f) => f.name).join(', ') || 'none'}
        </p>
      )}

      {showInputMapping && (
        <div className="space-y-2 border-t border-slate-100 pt-5">
          <label className="block text-sm font-medium text-slate-700">
            Input mapping{' '}
            <span className="font-normal text-slate-400">
              {values.action === 'findBy'
                ? '(request field → record field to match on, AND-combined)'
                : isValidateAction
                  ? '(non-password rows = lookup match; the password row compares against the stored field)'
                  : '(request body field → record field)'}
            </span>
          </label>
          {values.inputMapping.map((row) => (
            <div key={row.id} className="flex items-center gap-2">
              <input
                value={row.requestField}
                onChange={(e) => updateInputRow(row.id, { requestField: e.target.value })}
                placeholder={row.isPasswordField ? 'e.g. password' : 'request field'}
                className={rowInputClass}
              />
              <span className="text-slate-400">&rarr;</span>
              <input
                value={row.recordField}
                onChange={(e) => updateInputRow(row.id, { recordField: e.target.value })}
                placeholder="record field"
                list={`${idPrefix}-collection-fields`}
                className={rowInputClass}
              />
              {isValidateAction && (
                <label className="flex items-center gap-1 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={row.isPasswordField}
                    onChange={(e) => updateInputRow(row.id, { isPasswordField: e.target.checked })}
                    className="accent-indigo-600"
                  />
                  password
                </label>
              )}
              {!isValidateAction && (
                <label className="flex items-center gap-1 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={row.required}
                    onChange={(e) => updateInputRow(row.id, { required: e.target.checked })}
                    className="accent-indigo-600"
                  />
                  required
                </label>
              )}
              <button
                type="button"
                onClick={() => removeInputRow(row.id)}
                className="text-sm text-slate-400 hover:text-red-600"
                aria-label="Remove mapping"
              >
                &times;
              </button>
            </div>
          ))}
          <button type="button" onClick={addInputRow} className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
            + Add input mapping
          </button>
          {values.action === 'findBy' && (
            <p className="text-xs text-slate-400">Leave empty to match all records (same as List).</p>
          )}
          {isValidateAction && (
            <>
              <div className="flex items-center gap-2 pt-1">
                <label className="text-xs font-medium text-slate-600">Stored password format</label>
                <select
                  value={values.validatePasswordMode}
                  onChange={(e) => update({ validatePasswordMode: e.target.value as ValidatePasswordMode })}
                  className="rounded-lg border border-slate-300 px-2 py-1 text-xs shadow-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  {VALIDATE_PASSWORD_MODES.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-slate-400">
                Mark exactly one row as &ldquo;password&rdquo; (e.g. password &rarr; password); all other rows must match
                exactly (e.g. username &rarr; username) to find the record. Returns 401 for either a missing record or a
                wrong password &mdash; the response never includes the password field.
              </p>
              {values.method === 'GET' && (
                <p className="text-xs text-amber-600">
                  ⚠ GET sends field values via the query string, which can end up in server/browser logs. Use POST for
                  login-style validation instead.
                </p>
              )}
            </>
          )}
          {values.action !== 'findBy' && !isValidateAction && (
            <p className="text-xs text-slate-400">Leave empty to pass the request body through as-is.</p>
          )}
        </div>
      )}

      {showTransformSteps && (
        <div className="space-y-2 border-t border-slate-100 pt-5">
          <label className="block text-sm font-medium text-slate-700">
            Transform steps{' '}
            <span className="font-normal text-slate-400">
              (compute a field with an expression, run in order before response mapping)
            </span>
          </label>
          {values.transformSteps.map((row) => (
            <div key={row.id} className="flex items-center gap-2">
              <input
                value={row.field}
                onChange={(e) => updateTransformRow(row.id, { field: e.target.value })}
                placeholder="field name"
                className={rowInputClass}
              />
              <span className="text-slate-400">=</span>
              <input
                value={row.expression}
                onChange={(e) => updateTransformRow(row.id, { expression: e.target.value })}
                placeholder='e.g. price * quantity, or age >= 18 ? "adult" : "minor"'
                className={`${rowInputClass} flex-[2] font-mono`}
              />
              <button
                type="button"
                onClick={() => removeTransformRow(row.id)}
                className="text-sm text-slate-400 hover:text-red-600"
                aria-label="Remove transform step"
              >
                &times;
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addTransformRow}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            + Add transform step
          </button>
          <p className="text-xs text-slate-400">
            Expressions can reference record fields and earlier transform steps (e.g. <code>total = price * quantity</code>).
          </p>
        </div>
      )}

      {showResponseMapping && (
        <div className="space-y-2 border-t border-slate-100 pt-5">
          <label className="block text-sm font-medium text-slate-700">
            Response mapping <span className="font-normal text-slate-400">(record field &rarr; response field)</span>
          </label>
          {values.responseMapping.map((row) => (
            <div key={row.id} className="flex items-center gap-2">
              <input
                value={row.recordField}
                onChange={(e) => updateResponseRow(row.id, { recordField: e.target.value })}
                placeholder="record field"
                list={`${idPrefix}-collection-fields`}
                className={rowInputClass}
              />
              <span className="text-slate-400">&rarr;</span>
              <input
                value={row.responseField}
                onChange={(e) => updateResponseRow(row.id, { responseField: e.target.value })}
                placeholder="response field"
                className={rowInputClass}
              />
              <button
                type="button"
                onClick={() => removeResponseRow(row.id)}
                className="text-sm text-slate-400 hover:text-red-600"
                aria-label="Remove mapping"
              >
                &times;
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addResponseRow}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            + Add response mapping
          </button>
          <p className="text-xs text-slate-400">Leave empty to return the full record.</p>
        </div>
      )}

      <div className="space-y-3 border-t border-slate-100 pt-5">
        <label className="block text-sm font-medium text-slate-700">Authorization</label>
        <select
          value={values.authType}
          onChange={(e) => update({ authType: e.target.value as CustomEndpointAuthType })}
          className={inputClass}
        >
          {AUTH_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>

        {values.authType === 'basic' && (
          <div className="flex items-center gap-2">
            <input
              value={values.authUsername}
              onChange={(e) => update({ authUsername: e.target.value })}
              placeholder="username"
              className={rowInputClass}
            />
            <input
              type="password"
              value={values.authPassword}
              onChange={(e) => update({ authPassword: e.target.value })}
              placeholder={keepsExistingSecret ? 'Leave blank to keep existing password' : 'password'}
              className={rowInputClass}
            />
          </div>
        )}

        {values.authType === 'bearer' && (
          <input
            type="password"
            value={values.authToken}
            onChange={(e) => update({ authToken: e.target.value })}
            placeholder={keepsExistingSecret ? 'Leave blank to keep existing token' : 'token'}
            className={rowInputClass}
          />
        )}

        <p className="text-xs text-slate-400">
          Callers must include a matching Authorization header when calling this endpoint.
        </p>
      </div>

      <datalist id={`${idPrefix}-collection-fields`}>
        <option value="id" />
        <option value="createdAt" />
        <option value="updatedAt" />
        {selectedCollection?.fields.map((f) => <option key={f.name} value={f.name} />)}
      </datalist>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={!canSubmit || saving}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:opacity-50"
      >
        {saving ? 'Saving...' : submitLabel}
      </button>
    </div>
  );
}
