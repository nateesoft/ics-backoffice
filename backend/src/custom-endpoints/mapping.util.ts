import { BadRequestException } from '@nestjs/common';
import jexl from 'jexl';
import { RecordEntity } from '../collections/entities/record.entity';
import {
  InputMappingRule,
  ResponseMappingRule,
  TransformStep,
} from './entities/custom-endpoint.entity';

const MAX_EXPRESSION_LENGTH = 500;
const TRANSFORM_STEPS_BUDGET_MS = 250;

export function applyInputMapping(
  body: Record<string, unknown>,
  rules: InputMappingRule[],
): Record<string, unknown> {
  if (rules.length === 0) return body;

  const result: Record<string, unknown> = {};
  const missing: string[] = [];
  for (const rule of rules) {
    const value = body[rule.requestField];
    if (value === undefined) {
      if (rule.required) missing.push(rule.requestField);
      continue;
    }
    result[rule.recordField] = value;
  }
  if (missing.length > 0) {
    throw new BadRequestException(
      `Missing required field(s): ${missing.join(', ')}`,
    );
  }
  return result;
}

export function flattenRecord(record: RecordEntity): Record<string, unknown> {
  return {
    id: record.id,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    ...record.data,
  };
}

export function validateTransformExpression(expression: string): void {
  if (expression.length > MAX_EXPRESSION_LENGTH) {
    throw new BadRequestException(
      `Transform expression exceeds the maximum length of ${MAX_EXPRESSION_LENGTH} characters`,
    );
  }
  try {
    jexl.compile(expression);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new BadRequestException(
      `Invalid transform expression "${expression}": ${reason}`,
    );
  }
}

export function applyTransformSteps(
  flat: Record<string, unknown>,
  steps: TransformStep[],
): Record<string, unknown> {
  if (steps.length === 0) return flat;

  const working = { ...flat };
  const deadline = Date.now() + TRANSFORM_STEPS_BUDGET_MS;
  for (const step of steps) {
    if (Date.now() > deadline) {
      throw new BadRequestException(
        'Transform steps exceeded the execution time budget',
      );
    }
    try {
      working[step.field] = jexl.evalSync(step.expression, working);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(
        `Failed to evaluate transform step "${step.field}": ${reason}`,
      );
    }
  }
  return working;
}

export function applyResponseMapping(
  flat: Record<string, unknown>,
  rules: ResponseMappingRule[],
): Record<string, unknown> {
  if (rules.length === 0) return flat;

  const result: Record<string, unknown> = {};
  for (const rule of rules) {
    result[rule.responseField] = flat[rule.recordField];
  }
  return result;
}
