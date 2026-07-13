'use client';
// Card / Paper / Box / Button aren't part of the core jsonforms UI schema spec — they're
// purely presentational containers/elements with no native renderer, so they're always
// rendered by our own components below (registered at a higher rank than the vanilla ones).
// Group / HorizontalLayout / VerticalLayout ARE native jsonforms types, but we replace their
// vanilla renderer too so `options` (flexDirection/alignItems/justifyContent/gap/className/style)
// set from the Properties panel actually has something to read them.
//
// Everything else (Control, Label, Categorization, array/table controls, ...) keeps using the
// vanilla renderer, but gets custom className/style support via a generic wrapper: when
// `options.className` or `options.style` is present, the wrapper renders a styled `<div>` and
// re-dispatches to the normal renderer with those two keys stripped (so the wrapper's own
// tester no longer matches on the redispatch, avoiding infinite recursion).
import { useRef, useState } from 'react';
import type { JsonFormsProps, JsonSchema, LayoutProps, RankedTester, UISchemaElement } from '@jsonforms/core';
import { rankWith, uiTypeIs } from '@jsonforms/core';
import { JsonFormsDispatch, useJsonForms, withJsonFormsLayoutProps, withJsonFormsRendererProps } from '@jsonforms/react';
import type { UiActionStep } from '@/types/flowUi';
import { useActionRunner } from './actionRunner';

type FlexDirection = 'row' | 'column';
type AlignItems = 'flex-start' | 'center' | 'flex-end' | 'stretch';
type JustifyContent = 'flex-start' | 'center' | 'flex-end' | 'space-between';

interface ContainerOptions {
  className?: string;
  style?: Record<string, string | number>;
  flexDirection?: FlexDirection;
  alignItems?: AlignItems;
  justifyContent?: JustifyContent;
  gap?: number;
}

type ContainerNode = UISchemaElement & {
  elements?: UISchemaElement[];
  label?: string;
  options?: ContainerOptions;
};

function resolveFlexStyle(options: ContainerOptions | undefined, direction: FlexDirection): React.CSSProperties {
  return {
    flexDirection: direction,
    alignItems: options?.alignItems,
    justifyContent: options?.justifyContent,
    gap: options?.gap !== undefined ? `${options.gap}px` : undefined,
    ...options?.style,
  };
}

function renderChildren(elements: UISchemaElement[], schema: JsonSchema, path: string, renderers: unknown, cells: unknown) {
  return elements.map((child, i) => (
    <JsonFormsDispatch
      key={i}
      schema={schema}
      uischema={child}
      path={path}
      renderers={renderers as never}
      cells={cells as never}
    />
  ));
}

// Card / Paper / Box / Group: a framing box (border/background/padding + optional title) around
// an inner flex row/column of children.
function FramedFlexContainer({ schema, uischema, path, visible, frameClassName, defaultDirection }: LayoutProps & { frameClassName: string; defaultDirection: FlexDirection }) {
  const { renderers, cells } = useJsonForms();
  if (!visible) return null;
  const node = uischema as ContainerNode;
  const elements = node.elements ?? [];
  const opts = node.options;
  const direction = opts?.flexDirection ?? defaultDirection;
  const flexClassName = direction === 'row' ? 'horizontal-layout' : 'vertical-layout';
  const outerClassName = [frameClassName, opts?.className].filter(Boolean).join(' ');

  return (
    <div className={outerClassName}>
      {node.label && <h4 className="text-sm font-semibold text-slate-700 mb-3">{node.label}</h4>}
      <div className={flexClassName} style={resolveFlexStyle(opts, direction)}>
        {renderChildren(elements, schema, path, renderers, cells)}
      </div>
    </div>
  );
}

// HorizontalLayout / VerticalLayout: just the flex row/column itself, no framing or title.
function PlainFlexContainer({ schema, uischema, path, visible, defaultDirection }: LayoutProps & { defaultDirection: FlexDirection }) {
  const { renderers, cells } = useJsonForms();
  if (!visible) return null;
  const node = uischema as ContainerNode;
  const elements = node.elements ?? [];
  const opts = node.options;
  const direction = opts?.flexDirection ?? defaultDirection;
  const baseClassName = direction === 'row' ? 'horizontal-layout' : 'vertical-layout';
  const className = [baseClassName, opts?.className].filter(Boolean).join(' ');

  return (
    <div className={className} style={resolveFlexStyle(opts, direction)}>
      {renderChildren(elements, schema, path, renderers, cells)}
    </div>
  );
}

function CardComponent(props: LayoutProps) {
  return <FramedFlexContainer {...props} frameClassName="rounded-xl border border-slate-200 shadow-sm bg-white p-4" defaultDirection="column" />;
}

function PaperComponent(props: LayoutProps) {
  return <FramedFlexContainer {...props} frameClassName="rounded-lg bg-slate-50 border border-slate-100 p-4" defaultDirection="column" />;
}

function BoxComponent(props: LayoutProps) {
  return <FramedFlexContainer {...props} frameClassName="p-2" defaultDirection="column" />;
}

function GroupComponent(props: LayoutProps) {
  return <FramedFlexContainer {...props} frameClassName="rounded-xl border border-slate-200 bg-slate-50 p-4" defaultDirection="column" />;
}

function HorizontalLayoutComponent(props: LayoutProps) {
  return <PlainFlexContainer {...props} defaultDirection="row" />;
}

function VerticalLayoutComponent(props: LayoutProps) {
  return <PlainFlexContainer {...props} defaultDirection="column" />;
}

// `options.type` distinguishes 'button' (plain), 'file' (opens a native file picker), and
// 'action'. An 'action' button runs either a single API reference (`options.action`, legacy
// "${ApiName}" mode, `options.actionMode` unset/'api') or an ordered `options.actionSteps`
// sequence (`options.actionMode === 'steps'`) — see PropertiesPanel.tsx / ActionStepsEditor.tsx.
// Both are executed live via the ActionRunnerContext provided by LiveFormPreview.tsx: callApi
// steps are simulated (toast), openModal/closeModal steps actually push/pop a nested preview
// modal, matching e.g. "click Logout -> open the Logout Confirm modal we designed".
type ButtonType = 'button' | 'file' | 'action';
type ButtonOptions = {
  variant?: string;
  type?: ButtonType;
  action?: string;
  actionMode?: 'api' | 'steps';
  actionSteps?: UiActionStep[];
  className?: string;
  style?: React.CSSProperties;
};

function resolveButtonSteps(options?: ButtonOptions): UiActionStep[] {
  if (options?.actionMode === 'steps') return options.actionSteps ?? [];
  if (options?.action) return [{ id: 'legacy-action', kind: 'callApi', apiRef: options.action }];
  return [];
}

function ActionInfoBadge({ options }: { options?: ButtonOptions }) {
  if (options?.actionMode === 'steps') {
    const count = options.actionSteps?.length ?? 0;
    if (!count) return null;
    return <div className="text-[10px] font-mono text-slate-400">{count} step{count > 1 ? 's' : ''}</div>;
  }
  if (!options?.action) return null;
  return <div className="text-[10px] font-mono text-slate-400">{options.action}</div>;
}

function FileButtonComponent({ text, className, style }: { text: string; className: string; style?: React.CSSProperties }) {
  const [fileName, setFileName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="inline-flex items-center gap-2">
      <button type="button" className={className} style={style} onClick={() => inputRef.current?.click()}>{text}</button>
      <input ref={inputRef} type="file" className="hidden" onChange={e => setFileName(e.target.files?.[0]?.name ?? '')} />
      {fileName && <span className="text-xs text-slate-500">{fileName}</span>}
    </div>
  );
}

function ButtonComponent({ uischema, visible }: LayoutProps) {
  const runner = useActionRunner();
  if (!visible) return null;
  const node = uischema as { text?: string; options?: ButtonOptions };
  const buttonType = node.options?.type ?? 'button';
  const text = node.text || (buttonType === 'file' ? 'Upload File' : 'Submit');
  const variant = node.options?.variant === 'secondary' ? 'secondary' : 'primary';
  const baseClassName = variant === 'primary'
    ? 'px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition'
    : 'px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 transition';
  const className = [baseClassName, node.options?.className].filter(Boolean).join(' ');

  if (buttonType === 'file') {
    return <FileButtonComponent text={text} className={className} style={node.options?.style} />;
  }
  if (buttonType === 'action') {
    const steps = resolveButtonSteps(node.options);
    return (
      <div className="inline-flex flex-col items-start gap-1">
        <button
          type="button"
          className={className}
          style={node.options?.style}
          onClick={() => runner?.runSteps(steps)}
        >
          {text}
        </button>
        <ActionInfoBadge options={node.options} />
      </div>
    );
  }
  return <button type="button" className={className} style={node.options?.style}>{text}</button>;
}

// Types above already read `options.className`/`options.style` themselves — exclude them here
// so a styled Card doesn't end up double-wrapped.
const SELF_STYLED_TYPES = ['Card', 'Paper', 'Box', 'Group', 'HorizontalLayout', 'VerticalLayout', 'Button'];

function StyleWrapperComponent({ uischema, schema, path, visible, renderers, cells }: JsonFormsProps) {
  if (!uischema || visible === false) return null;
  const node = uischema as { options?: ContainerOptions };
  const { className, style, ...restOptions } = node.options ?? {};
  const innerUischema: UISchemaElement = { ...uischema, options: Object.keys(restOptions).length ? restOptions : undefined };
  return (
    <div className={className} style={style}>
      <JsonFormsDispatch schema={schema} uischema={innerUischema} path={path} renderers={renderers} cells={cells} />
    </div>
  );
}

export const cardTester: RankedTester = rankWith(2, uiTypeIs('Card'));
export const paperTester: RankedTester = rankWith(2, uiTypeIs('Paper'));
export const boxTester: RankedTester = rankWith(2, uiTypeIs('Box'));
export const groupTester: RankedTester = rankWith(2, uiTypeIs('Group'));
export const horizontalLayoutTester: RankedTester = rankWith(2, uiTypeIs('HorizontalLayout'));
export const verticalLayoutTester: RankedTester = rankWith(2, uiTypeIs('VerticalLayout'));
export const buttonTester: RankedTester = rankWith(2, uiTypeIs('Button'));

export const styleWrapperTester: RankedTester = rankWith(20, uischema => {
  const type = (uischema as UISchemaElement).type;
  if (type && SELF_STYLED_TYPES.includes(type)) return false;
  const opts = (uischema as { options?: { className?: string; style?: unknown } }).options;
  return Boolean(opts && (opts.className || opts.style));
});

export const CardRenderer = withJsonFormsLayoutProps(CardComponent);
export const PaperRenderer = withJsonFormsLayoutProps(PaperComponent);
export const BoxRenderer = withJsonFormsLayoutProps(BoxComponent);
export const GroupRenderer = withJsonFormsLayoutProps(GroupComponent);
export const HorizontalLayoutRenderer = withJsonFormsLayoutProps(HorizontalLayoutComponent);
export const VerticalLayoutRenderer = withJsonFormsLayoutProps(VerticalLayoutComponent);
export const ButtonRenderer = withJsonFormsLayoutProps(ButtonComponent);
export const StyleWrapperRenderer = withJsonFormsRendererProps(StyleWrapperComponent);

export const customRenderers = [
  { tester: cardTester, renderer: CardRenderer },
  { tester: paperTester, renderer: PaperRenderer },
  { tester: boxTester, renderer: BoxRenderer },
  { tester: groupTester, renderer: GroupRenderer },
  { tester: horizontalLayoutTester, renderer: HorizontalLayoutRenderer },
  { tester: verticalLayoutTester, renderer: VerticalLayoutRenderer },
  { tester: buttonTester, renderer: ButtonRenderer },
  { tester: styleWrapperTester, renderer: StyleWrapperRenderer },
];
