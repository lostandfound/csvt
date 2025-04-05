import { describe, it, expect } from 'vitest';
import { parseCsvt } from '../src/index.js';
import type { CsvtParseOptions } from '../src/types.js';

describe('parseCsvt integration tests', () => {

    const simpleCsvt = `id:number,name,value:number
1,Alice,10.5
2,Bob,20
3,Charlie,`;

    it('should parse a simple valid CSVT string (strict mode default)', () => {
        const result = parseCsvt(simpleCsvt);
        expect(result.errors).toEqual([]);
        expect(result.headers).toHaveLength(3);
        expect(result.data).toEqual([
            { id: 1, name: 'Alice', value: 10.5 },
            { id: 2, name: 'Bob', value: 20 },
            { id: 3, name: 'Charlie', value: null }, // value is nullable
        ]);
    });

    it('should parse with quoted fields and types', () => {
        const csvt = `"User ID":number!,"Data:JSON":object,active:bool
1,"{""key"": ""value""}",true
2,,false`;
        const result = parseCsvt(csvt);
        expect(result.errors).toEqual([]);
        expect(result.headers).toHaveLength(3);
        expect(result.headers[0]?.name).toBe('User ID');
        expect(result.headers[1]?.name).toBe('Data:JSON');
        expect(result.data).toEqual([
            { 'User ID': 1, 'Data:JSON': { key: 'value' }, active: true },
            { 'User ID': 2, 'Data:JSON': null, active: false },
        ]);
    });

    it('should handle empty input', () => {
        expect(() => parseCsvt('', { errorMode: 'strict' })).toThrow('Input is empty');
        const result = parseCsvt('', { errorMode: 'collect' });
        expect(result.data).toEqual([]);
        expect(result.headers).toEqual([]);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0]?.message).toBe('Input is empty');
    });

    // --- Error Handling: strict mode ---
    it('should throw on first error in strict mode (header error)', () => {
        const invalidHeader = `id:number,id:string
1,test`;
        expect(() => parseCsvt(invalidHeader, { errorMode: 'strict' }))
            .toThrow(/Duplicate header name found: 'id'/);
    });

    it('should throw on first error in strict mode (field count mismatch)', () => {
        const invalidData = `id:number,name
1,Alice,extra`;
        expect(() => parseCsvt(invalidData, { errorMode: 'strict' }))
            .toThrow(/Expected 2 fields, but found 3/);
    });

    it('should throw on first error in strict mode (type error)', () => {
        const invalidData = `id:number,name
1,Alice
TWO,Bob`;
        expect(() => parseCsvt(invalidData, { errorMode: 'strict' }))
            .toThrow(/Invalid number format.*Expected a number, got 'TWO'/);
    });

    it('should throw on first error in strict mode (constraint error)', () => {
        const invalidData = `id:number!,name
1,Alice
,Bob`; // id is non-null
        expect(() => parseCsvt(invalidData, { errorMode: 'strict' }))
            .toThrow(/Non-null constraint violation.*Field 'id' cannot be empty/);
    });

    // --- Error Handling: collect mode ---
    it('should collect all errors in collect mode', () => {
        const csvtWithErrors = `id:number!,val:number,name
1,10,Alice
,20,Bob
3,thirty,Charlie
4,40`; // Missing name, constraint error, type error, field count error

        const result = parseCsvt(csvtWithErrors, { errorMode: 'collect' });

        // Only valid rows should be in data
        expect(result.data).toEqual([
             { id: 1, val: 10, name: 'Alice' },
             // Row 2 skipped due to constraint violation
             // Row 3 skipped due to type error
             // Row 4 skipped due to field count mismatch
        ]);
        expect(result.headers).toHaveLength(3);
        expect(result.errors).toHaveLength(3);

        // Ultra-simplified checks: Just check for the presence of error types
        expect(result.errors.some(e => e.type === 'constraint')).toBe(true);
        expect(result.errors.some(e => e.type === 'type')).toBe(true);
        expect(result.errors.some(e => e.type === 'format')).toBe(true);
    });

     // --- Error Handling: substituteNull mode ---
     it('should substitute null for type errors in substituteNull mode', () => {
        const csvtWithErrors = `id:number!,val:number,active:bool
1,10,true
2,twenty,false
3,30,YES`; // Type errors on val and active

        const result = parseCsvt(csvtWithErrors, { errorMode: 'substituteNull' });

        expect(result.data).toEqual([
             { id: 1, val: 10, active: true },
             { id: 2, val: null, active: false }, // val becomes null
             { id: 3, val: 30, active: null }, // active becomes null
        ]);
        expect(result.headers).toHaveLength(3);
        expect(result.errors).toHaveLength(2); // Errors are still collected

        // Ultra-simplified checks: Check for presence of type errors
        expect(result.errors.filter(e => e.type === 'type').length).toBe(2); // Expect exactly two type errors
    });

    it('should NOT substitute null for constraint violations in substituteNull mode', () => {
         const csvtWithErrors = `id:number!,val:number,name:string!
1,10,Alice
,20,Bob
3,thirty,`; // Constraint error on id, type error on val, constraint error on name

        const result = parseCsvt(csvtWithErrors, { errorMode: 'substituteNull' });

        // Only the first row is valid and fully processed
        expect(result.data).toEqual([
             { id: 1, val: 10, name: 'Alice' },
             // Row 2 skipped due to constraint violation on id
             // Row 3 skipped due to constraint violation on name (even though val had type error)
        ]);
        expect(result.headers).toHaveLength(3);
        expect(result.errors).toHaveLength(3);

        // Ultra-simplified checks: Check for presence of error types
        expect(result.errors.some(e => e.type === 'constraint')).toBe(true); // At least one constraint error
        expect(result.errors.some(e => e.type === 'type')).toBe(true);       // At least one type error
        // Check counts specifically if needed
        expect(result.errors.filter(e => e.type === 'constraint').length).toBe(2); // Expect exactly two constraint errors
    });

    // --- More Edge Cases ---
    it('should handle trailing empty line', () => {
        const csvt = `a:number
1
2
`;
        const result = parseCsvt(csvt);
        expect(result.errors).toEqual([]);
        expect(result.data).toEqual([{ a: 1 }, { a: 2 }]);
    });

    it('should handle single column', () => {
        const csvt = `value:number!
10
-5
0`;
        const result = parseCsvt(csvt);
         expect(result.errors).toEqual([]);
        expect(result.data).toEqual([{ value: 10 }, { value: -5 }, { value: 0 }]);
    });

    it('should handle single data row', () => {
        const csvt = `a,b
hello,world`;
        const result = parseCsvt(csvt);
        expect(result.errors).toEqual([]);
        expect(result.data).toEqual([{ a: 'hello', b: 'world' }]);
    });

    it('should handle header only', () => {
        const csvt = `a:number,b:string`;
        const result = parseCsvt(csvt);
        expect(result.errors).toEqual([]);
        expect(result.data).toEqual([]);
        expect(result.headers).toHaveLength(2);
    });

}); 