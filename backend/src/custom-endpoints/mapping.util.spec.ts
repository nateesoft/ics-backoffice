import { BadRequestException } from '@nestjs/common';
import {
  applyInputMapping,
  applyResponseMapping,
  applyTransformSteps,
  flattenRecord,
  validateTransformExpression,
} from './mapping.util';
import { RecordEntity } from '../collections/entities/record.entity';

describe('applyInputMapping', () => {
  it('returns the body unchanged when there are no rules', () => {
    const body = { foo: 'bar' };
    expect(applyInputMapping(body, [])).toEqual(body);
  });

  it('renames request fields to record fields', () => {
    const result = applyInputMapping(
      { customerName: 'Alice', extra: 'ignored' },
      [{ requestField: 'customerName', recordField: 'name', required: true }],
    );
    expect(result).toEqual({ name: 'Alice' });
  });

  it('skips optional fields that are absent from the body', () => {
    const result = applyInputMapping({}, [
      { requestField: 'nickname', recordField: 'nickname', required: false },
    ]);
    expect(result).toEqual({});
  });

  it('throws when a required field is missing', () => {
    expect(() =>
      applyInputMapping({}, [
        { requestField: 'email', recordField: 'email', required: true },
      ]),
    ).toThrow(BadRequestException);
  });

  it('collects all missing required fields in the error message', () => {
    expect(() =>
      applyInputMapping({}, [
        { requestField: 'email', recordField: 'email', required: true },
        { requestField: 'name', recordField: 'name', required: true },
      ]),
    ).toThrow('Missing required field(s): email, name');
  });
});

describe('flattenRecord', () => {
  it('merges record metadata with the stored data', () => {
    const record = {
      id: 'rec-1',
      collectionId: 'col-1',
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-02'),
      data: { name: 'Alice', id: 'should-not-override' },
    } as unknown as RecordEntity;

    const flat = flattenRecord(record);
    // record.data is spread last, so its (unlikely) `id` key wins over the top-level id
    expect(flat).toEqual({
      id: 'should-not-override',
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      name: 'Alice',
    });
  });
});

describe('validateTransformExpression', () => {
  it('accepts a valid jexl expression', () => {
    expect(() => validateTransformExpression('price * qty')).not.toThrow();
  });

  it('rejects an unparsable expression', () => {
    expect(() => validateTransformExpression('price * ')).toThrow(
      BadRequestException,
    );
  });

  it('rejects expressions longer than the configured maximum', () => {
    const longExpr = '1'.repeat(501);
    expect(() => validateTransformExpression(longExpr)).toThrow(
      'Transform expression exceeds the maximum length of 500 characters',
    );
  });
});

describe('applyTransformSteps', () => {
  it('returns the input unchanged when there are no steps', () => {
    const flat = { qty: 2 };
    expect(applyTransformSteps(flat, [])).toBe(flat);
  });

  it('evaluates each step against the accumulated working object', () => {
    const result = applyTransformSteps({ price: 10, qty: 3 }, [
      { field: 'total', expression: 'price * qty' },
      { field: 'totalWithTax', expression: 'total * 1.1' },
    ]);
    expect(result.total).toBe(30);
    expect(result.totalWithTax).toBeCloseTo(33);
  });

  it('does not mutate the original flat object', () => {
    const flat = { qty: 2 };
    applyTransformSteps(flat, [{ field: 'doubled', expression: 'qty * 2' }]);
    expect(flat).toEqual({ qty: 2 });
  });

  it('wraps evaluation errors in a BadRequestException', () => {
    expect(() =>
      applyTransformSteps({ qty: 2 }, [{ field: 'bad', expression: 'qty(' }]),
    ).toThrow(BadRequestException);
  });
});

describe('applyResponseMapping', () => {
  it('returns the input unchanged when there are no rules', () => {
    const flat = { a: 1 };
    expect(applyResponseMapping(flat, [])).toEqual(flat);
  });

  it('selects and renames only the mapped fields', () => {
    const result = applyResponseMapping(
      { id: '1', internalName: 'Alice', secret: 'x' },
      [{ recordField: 'internalName', responseField: 'name' }],
    );
    expect(result).toEqual({ name: 'Alice' });
  });

  it('maps to undefined when the source field is missing', () => {
    const result = applyResponseMapping({}, [
      { recordField: 'missing', responseField: 'out' },
    ]);
    expect(result).toEqual({ out: undefined });
  });
});
