import { describe, it, expect } from 'vitest';
import { validateAndConvert } from '../src/validator.js';
import type { CsvtHeader } from '../src/types.js';

// Helper to create a dummy header
const createHeader = (type: string, isNonNull = false, name = 'test', columnIndex = 1): CsvtHeader => ({
    name,
    type,
    isNonNull,
    columnIndex,
});

describe('validateAndConvert', () => {

    // --- NULL Handling and Non-Null Constraint ---
    it('should return null for empty string if nullable', () => {
        const header = createHeader('string');
        const result = validateAndConvert('', header, 2);
        expect(result.error).toBeUndefined();
        expect(result.value).toBeNull();

        const headerNum = createHeader('number');
        const resultNum = validateAndConvert('""', headerNum, 3); // Quoted empty string
        expect(resultNum.error).toBeUndefined();
        expect(resultNum.value).toBeNull();
    });

    it('should return constraint error for empty string if non-null', () => {
        const header = createHeader('string', true);
        const result = validateAndConvert('', header, 2);
        expect(result.error).toBeDefined();
        expect(result.error?.type).toBe('constraint');
        expect(result.error?.message).toContain('cannot be empty');
        expect(result.value).toBeUndefined();
    });

    // --- String Type ---
    it('should validate string type', () => {
        const header = createHeader('string');
        const result = validateAndConvert('hello', header, 2);
        expect(result.error).toBeUndefined();
        expect(result.value).toBe('hello');
    });

    it('should clean quoted string', () => {
        const header = createHeader('string');
        const result = validateAndConvert('"hello, world"' , header, 2);
        expect(result.error).toBeUndefined();
        expect(result.value).toBe('hello, world');
    });

     it('should unescape quotes in quoted string', () => {
        const header = createHeader('string');
        const result = validateAndConvert('"it""s a test"' , header, 2);
        expect(result.error).toBeUndefined();
        expect(result.value).toBe('it"s a test');
    });

    // --- Number Type ---
    it('should validate number type', () => {
        const header = createHeader('number');
        expect(validateAndConvert('123', header, 2).value).toBe(123);
        expect(validateAndConvert('-45.6', header, 3).value).toBe(-45.6);
        expect(validateAndConvert('0', header, 4).value).toBe(0);
        expect(validateAndConvert('1.2e3', header, 5).value).toBe(1200);
    });

    it('should return type error for invalid number', () => {
        const header = createHeader('number');
        const result = validateAndConvert('abc', header, 2);
        expect(result.error).toBeDefined();
        expect(result.error?.type).toBe('type');
        expect(result.error?.message).toContain('Invalid number format');
        expect(result.value).toBeUndefined();
    });

    // --- Bool Type ---
    it('should validate bool type (true)', () => {
        const header = createHeader('bool');
        expect(validateAndConvert('true', header, 2).value).toBe(true);
        expect(validateAndConvert('TRUE', header, 3).value).toBe(true);
        expect(validateAndConvert('1', header, 4).value).toBe(true);
    });

    it('should validate bool type (false)', () => {
        const header = createHeader('bool');
        expect(validateAndConvert('false', header, 2).value).toBe(false);
        expect(validateAndConvert('FALSE', header, 3).value).toBe(false);
        expect(validateAndConvert('0', header, 4).value).toBe(false);
    });

     it('should return type error for invalid bool', () => {
        const header = createHeader('bool');
        const result = validateAndConvert('yes', header, 2);
        expect(result.error).toBeDefined();
        expect(result.error?.type).toBe('type');
        expect(result.error?.message).toContain('Invalid boolean format');

        const result2 = validateAndConvert('T', header, 3);
        expect(result2.error).toBeDefined();
    });

    // --- Date Type ---
    it('should validate date type (YYYY-MM-DD)', () => {
        const header = createHeader('date');
        const result = validateAndConvert('2024-07-28', header, 2);
        expect(result.error).toBeUndefined();
        expect(result.value).toBe('2024-07-28');
    });

     it('should return type error for invalid date format', () => {
        const header = createHeader('date');
        const result = validateAndConvert('2024/07/28', header, 2);
        expect(result.error).toBeDefined();
        expect(result.error?.type).toBe('type');
        expect(result.error?.message).toContain('Invalid date format');

        const result2 = validateAndConvert('28-07-2024', header, 3);
        expect(result2.error).toBeDefined();

         const result3 = validateAndConvert('2024-13-01', header, 4); // Invalid month, but passes regex
         expect(result3.error).toBeUndefined(); // Current implementation only checks format
         expect(result3.value).toBe('2024-13-01'); 
    });

    // --- Datetime Type ---
     it('should validate datetime type (ISO 8601)', () => {
        const header = createHeader('datetime');
        const validDates = [
            '2024-07-28T10:30:00Z',
            '2024-07-28T19:30:00+09:00',
            '2024-07-28T10:30:00.123Z',
            '2024-07-28T10:30Z' // Simplified extended format
        ];
        validDates.forEach((dateStr, i) => {
            const result = validateAndConvert(dateStr, header, i + 2);
            expect(result.error, `Failed on ${dateStr}`).toBeUndefined();
            expect(result.value).toBe(dateStr);
        });
    });

     it('should return type error for invalid datetime format', () => {
        const header = createHeader('datetime');
        const invalidDates = [
            '2024-07-28 10:30:00',
            '2024/07/28T10:30:00Z',
            'invalid-date'
        ];
         invalidDates.forEach((dateStr, i) => {
            const result = validateAndConvert(dateStr, header, i + 2);
            expect(result.error, `Failed on ${dateStr}`).toBeDefined();
            expect(result.error?.type).toBe('type');
            expect(result.error?.message).toContain('Invalid datetime format');
        });
    });

     // --- Array Type ---
     it('should validate array type', () => {
        const header = createHeader('array');
        const result = validateAndConvert('[1, "a", true]', header, 2);
        expect(result.error).toBeUndefined();
        expect(result.value).toEqual([1, 'a', true]);

         // Remember CSV value would be quoted and escaped
        const csvValue = '"[1, ""item"", null]"'; 
        const result2 = validateAndConvert(csvValue, header, 3);
        expect(result2.error).toBeUndefined();
        expect(result2.value).toEqual([1, 'item', null]);
    });

    it('should return type error for invalid array JSON', () => {
        const header = createHeader('array');
        const result = validateAndConvert('[1, 2,', header, 2);
        expect(result.error).toBeDefined();
        expect(result.error?.type).toBe('type');
        expect(result.error?.message).toContain('Invalid array format');
    });

     it('should return type error if JSON is not an array', () => {
        const header = createHeader('array');
        const result = validateAndConvert('{"a": 1}', header, 2);
        expect(result.error).toBeDefined();
        expect(result.error?.type).toBe('type');
        expect(result.error?.message).toContain('Parsed value is not an array');
    });

     // --- Object Type ---
     it('should validate object type', () => {
        const header = createHeader('object');
        const result = validateAndConvert('{"a": 1, "b": "test"}', header, 2);
        expect(result.error).toBeUndefined();
        expect(result.value).toEqual({ a: 1, b: 'test' });

        // Remember CSV value would be quoted and escaped
        const csvValue = '"{""key"":""val"", ""num"": 123}"'
        const result2 = validateAndConvert(csvValue, header, 3);
        expect(result2.error).toBeUndefined();
        expect(result2.value).toEqual({ key: 'val', num: 123 });
    });

    it('should return type error for invalid object JSON', () => {
        const header = createHeader('object');
        const result = validateAndConvert('{"a": 1,', header, 2);
        expect(result.error).toBeDefined();
        expect(result.error?.type).toBe('type');
        expect(result.error?.message).toContain('Invalid object format');
    });

     it('should return type error if JSON is not an object (e.g., array, null, primitive)', () => {
        const header = createHeader('object');
        const result = validateAndConvert('[1, 2]', header, 2);
        expect(result.error).toBeDefined();
        expect(result.error?.type).toBe('type');
        expect(result.error?.message).toContain('Parsed value is not a valid object');

        const resultNull = validateAndConvert('null', header, 3);
        expect(resultNull.error).toBeDefined(); // Because JSON.parse('null') is null

        const resultPrim = validateAndConvert('123', header, 4);
        expect(resultPrim.error).toBeDefined(); // Because JSON.parse('123') is number
    });

     // --- Unknown Type ---
     it('should return format error for unknown type', () => {
        const header = createHeader('unknownType');
        const result = validateAndConvert('some value', header, 2);
        expect(result.error).toBeDefined();
        expect(result.error?.type).toBe('format');
        expect(result.error?.message).toContain('Unknown data type');
        expect(result.error?.row).toBe(1); // Error originates from header definition
    });
}); 