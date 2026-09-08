'use client';
// Custom renderers for the basic leaf controls (text/number/integer/boolean/date/textarea/enum).
// Project convention: don't rely on @jsonforms/vanilla-renderers' standard Control+Cell dispatch
// for these — render the input widget directly so markup/behavior stays fully in our control.
// Ranked above vanilla's generic `inputControlTester` (rank 1) and `radioGroupControlTester`
// (rank 3) so these take over; Array/Categorization/Label still fall through to vanilla.
import type { ReactNode } from 'react';
import type { ControlProps, RankedTester } from '@jsonforms/core';
import {
  and, isBooleanControl, isDateControl, isEnumControl, isIntegerControl,
  isMultiLineControl, isNumberControl, isStringControl, not, rankWith,
} from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import type { UiActionStep } from '@/types/flowUi';
import { useActionRunner } from './actionRunner';

const CONTROL_RANK = 5;

const fieldCls = 'space-y-1';
const labelCls = 'block text-xs font-semibold text-slate-500 uppercase tracking-wide';
const inputCls = 'w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm bg-white disabled:opacity-60 disabled:cursor-not-allowed';
const descCls = 'text-xs text-slate-400';
const errorCls = 'text-xs text-red-600';

function ControlField({ label, required, description, errors, children }: { label: string; required?: boolean; description?: string; errors?: string; children: ReactNode }) {
  return (
    <div className={fieldCls}>
      {label && (
        <label className={labelCls}>
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      {children}
      {errors ? <p className={errorCls}>{errors}</p> : description ? <p className={descCls}>{description}</p> : null}
    </div>
  );
}

function TextControlComponent({ uischema, data, label, required, description, errors, enabled, visible, path, handleChange }: ControlProps) {
  if (!visible) return null;
  const inputType = (uischema as { options?: { inputType?: string } }).options?.inputType;
  const htmlType = inputType === 'password' ? 'password' : inputType === 'number' ? 'number' : 'text';
  return (
    <ControlField label={label} required={required} description={description} errors={errors}>
      <input type={htmlType} className={inputCls} value={(data as string) ?? ''} disabled={!enabled} onChange={e => handleChange(path, e.target.value)} />
    </ControlField>
  );
}

function TextareaControlComponent({ data, label, required, description, errors, enabled, visible, path, handleChange }: ControlProps) {
  if (!visible) return null;
  return (
    <ControlField label={label} required={required} description={description} errors={errors}>
      <textarea className={`${inputCls} resize-none`} rows={3} value={(data as string) ?? ''} disabled={!enabled} onChange={e => handleChange(path, e.target.value)} />
    </ControlField>
  );
}

function numericInput({ data, label, required, description, errors, enabled, visible, path, handleChange }: ControlProps, step: number | 'any') {
  if (!visible) return null;
  return (
    <ControlField label={label} required={required} description={description} errors={errors}>
      <input
        type="number"
        step={step}
        className={inputCls}
        value={data === undefined || data === null ? '' : (data as number)}
        disabled={!enabled}
        onChange={e => handleChange(path, e.target.value === '' ? undefined : Number(e.target.value))}
      />
    </ControlField>
  );
}

const NumberControlComponent = (props: ControlProps) => numericInput(props, 'any');
const IntegerControlComponent = (props: ControlProps) => numericInput(props, 1);

function BooleanControlComponent({ data, label, required, description, errors, enabled, visible, path, handleChange }: ControlProps) {
  if (!visible) return null;
  return (
    <div className={fieldCls}>
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" checked={Boolean(data)} disabled={!enabled} onChange={e => handleChange(path, e.target.checked)} />
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {errors ? <p className={errorCls}>{errors}</p> : description ? <p className={descCls}>{description}</p> : null}
    </div>
  );
}

function DateControlComponent({ data, label, required, description, errors, enabled, visible, path, handleChange }: ControlProps) {
  if (!visible) return null;
  return (
    <ControlField label={label} required={required} description={description} errors={errors}>
      <input type="date" className={inputCls} value={(data as string) ?? ''} disabled={!enabled} onChange={e => handleChange(path, e.target.value || undefined)} />
    </ControlField>
  );
}

function EnumControlComponent({ schema, uischema, data, label, required, description, errors, enabled, visible, path, handleChange }: ControlProps) {
  const runner = useActionRunner();
  if (!visible) return null;
  const options = (schema.enum ?? []) as (string | number)[];
  const nodeOptions = (uischema as { options?: { format?: string; onChangeSteps?: UiActionStep[] } }).options;
  const isRadio = nodeOptions?.format === 'radio';
  const onChangeSteps = nodeOptions?.onChangeSteps;

  function change(value: unknown) {
    handleChange(path, value);
    if (onChangeSteps?.length) runner?.runSteps(onChangeSteps);
  }

  if (isRadio) {
    return (
      <ControlField label={label} required={required} description={description} errors={errors}>
        <div className="flex flex-col gap-1.5">
          {options.map(opt => (
            <label key={String(opt)} className="flex items-center gap-2 text-sm text-slate-700">
              <input type="radio" name={path} checked={data === opt} disabled={!enabled} onChange={() => change(opt)} />
              {String(opt)}
            </label>
          ))}
        </div>
      </ControlField>
    );
  }

  return (
    <ControlField label={label} required={required} description={description} errors={errors}>
      <select className={inputCls} value={(data as string) ?? ''} disabled={!enabled} onChange={e => change(e.target.value)}>
        <option value="" disabled>เลือก...</option>
        {options.map(opt => <option key={String(opt)} value={opt}>{String(opt)}</option>)}
      </select>
    </ControlField>
  );
}

export const textControlTester: RankedTester = rankWith(CONTROL_RANK, and(isStringControl, not(isEnumControl), not(isMultiLineControl), not(isDateControl)));
export const textareaControlTester: RankedTester = rankWith(CONTROL_RANK, and(isStringControl, isMultiLineControl, not(isDateControl)));
export const numberControlTester: RankedTester = rankWith(CONTROL_RANK, isNumberControl);
export const integerControlTester: RankedTester = rankWith(CONTROL_RANK, isIntegerControl);
export const booleanControlTester: RankedTester = rankWith(CONTROL_RANK, isBooleanControl);
export const dateControlTester: RankedTester = rankWith(CONTROL_RANK, and(isStringControl, isDateControl));
export const enumControlTester: RankedTester = rankWith(CONTROL_RANK, isEnumControl);

export const TextControl = withJsonFormsControlProps(TextControlComponent);
export const TextareaControl = withJsonFormsControlProps(TextareaControlComponent);
export const NumberControl = withJsonFormsControlProps(NumberControlComponent);
export const IntegerControl = withJsonFormsControlProps(IntegerControlComponent);
export const BooleanControl = withJsonFormsControlProps(BooleanControlComponent);
export const DateControl = withJsonFormsControlProps(DateControlComponent);
export const EnumControl = withJsonFormsControlProps(EnumControlComponent);

export const customControlRenderers = [
  { tester: textareaControlTester, renderer: TextareaControl },
  { tester: dateControlTester, renderer: DateControl },
  { tester: enumControlTester, renderer: EnumControl },
  { tester: booleanControlTester, renderer: BooleanControl },
  { tester: integerControlTester, renderer: IntegerControl },
  { tester: numberControlTester, renderer: NumberControl },
  { tester: textControlTester, renderer: TextControl },
];
