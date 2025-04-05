import { describe, it, expect } from 'vitest';
import { parseHeaderLine } from '../src/parser.js';
import type { CsvtHeader } from '../src/types.js';

describe('parseHeaderLine', () => {
    it('should parse basic headers', () => {
        const result = parseHeaderLine('id:number,name:string,active:bool');
        expect(result.error).toBeUndefined();
        expect(result.headers).toEqual<CsvtHeader[]>([
            { name: 'id', type: 'number', isNonNull: false, columnIndex: 1 },
            { name: 'name', type: 'string', isNonNull: false, columnIndex: 2 },
            { name: 'active', type: 'bool', isNonNull: false, columnIndex: 3 },
        ]);
    });

    it('should handle default string type', () => {
        const result = parseHeaderLine('userId,productName');
        expect(result.error).toBeUndefined();
        expect(result.headers).toEqual<CsvtHeader[]>([
            { name: 'userId', type: 'string', isNonNull: false, columnIndex: 1 },
            { name: 'productName', type: 'string', isNonNull: false, columnIndex: 2 },
        ]);
    });

    it('should handle non-null constraints', () => {
        const result = parseHeaderLine('id:number!,name!,created:date!');
        expect(result.error).toBeUndefined();
        expect(result.headers).toEqual<CsvtHeader[]>([
            { name: 'id', type: 'number', isNonNull: true, columnIndex: 1 },
            { name: 'name', type: 'string', isNonNull: true, columnIndex: 2 },
            { name: 'created', type: 'date', isNonNull: true, columnIndex: 3 },
        ]);
    });

    it('should handle mixed types and constraints', () => {
        const result = parseHeaderLine('uuid,value:number!,flag:bool,timestamp:datetime!');
        expect(result.error).toBeUndefined();
        expect(result.headers).toEqual<CsvtHeader[]>([
            { name: 'uuid', type: 'string', isNonNull: false, columnIndex: 1 },
            { name: 'value', type: 'number', isNonNull: true, columnIndex: 2 },
            { name: 'flag', type: 'bool', isNonNull: false, columnIndex: 3 },
            { name: 'timestamp', type: 'datetime', isNonNull: true, columnIndex: 4 },
        ]);
    });

    it('should handle quoted column names', () => {
        const result = parseHeaderLine('"User ID":number,"Product, Name", "created:at":date');
        expect(result.error).toBeUndefined();
        expect(result.headers).toEqual<CsvtHeader[]>([
            { name: 'User ID', type: 'number', isNonNull: false, columnIndex: 1 },
            { name: 'Product, Name', type: 'string', isNonNull: false, columnIndex: 2 },
            { name: 'created:at', type: 'date', isNonNull: false, columnIndex: 3 },
        ]);
    });

     it('should handle quoted column names with colons and types', () => {
        const result = parseHeaderLine('"order:ref":string!,"item:count":number');
        expect(result.error).toBeUndefined();
        expect(result.headers).toEqual<CsvtHeader[]>([
            { name: 'order:ref', type: 'string', isNonNull: true, columnIndex: 1 },
            { name: 'item:count', type: 'number', isNonNull: false, columnIndex: 2 },
        ]);
    });

    it('should handle quoted types (though unlikely)', () => {
        const result = parseHeaderLine('col:"string"');
        expect(result.error).toBeDefined();
        expect(result.error?.message).toContain("Invalid characters found in type specification");
    });

    it('should handle spaces around fields and colons', () => {
        const result = parseHeaderLine(' id : number , name : string! , active ');
        expect(result.error).toBeUndefined();
        expect(result.headers).toEqual<CsvtHeader[]>([
            { name: 'id', type: 'number', isNonNull: false, columnIndex: 1 },
            { name: 'name', type: 'string', isNonNull: true, columnIndex: 2 },
            { name: 'active', type: 'string', isNonNull: false, columnIndex: 3 }, // Type defaults to string
        ]);
    });

    it('should return error for empty header line', () => {
        const result = parseHeaderLine('');
        expect(result.error).toBeDefined();
        expect(result.error?.message).toBe('Header line is empty');
        expect(result.headers).toEqual([]);
    });

     it('should return error for effectively empty header field', () => {
        const result = parseHeaderLine('a,,c');
        expect(result.error).toBeDefined();
        expect(result.error?.message).toContain('Header name at index 1 is effectively empty');
        expect(result.headers).toEqual([]);

        const result2 = parseHeaderLine('a,"",c'); // Quoted empty string
        expect(result2.error).toBeDefined();
        expect(result2.error?.message).toContain('Header name at index 1 is effectively empty');
        expect(result.headers).toEqual([]);
    });

    it('should return error for missing header name (":type")', () => {
        const result = parseHeaderLine(':number,col2');
        expect(result.error).toBeDefined();
        expect(result.error?.message).toContain('Header name is missing or became empty');
        expect(result.headers).toEqual([]);
    });

    it('should return error for invalid type specification', () => {
        const result = parseHeaderLine('col1:');
        expect(result.error).toBeDefined();
        expect(result.error?.message).toContain('Type specification is missing after colon');
        expect(result.headers).toEqual([]);
    });

    it('should return error for duplicate header names', () => {
        const result = parseHeaderLine('id,name,id:number');
        expect(result.error).toBeDefined();
        expect(result.error?.message).toContain("Duplicate header name found: 'id'");
        expect(result.headers).toEqual([]);
    });

     it('should handle unterminated quotes in header line via splitCsvLine error', () => {
        const result = parseHeaderLine('"col1:string');
        expect(result.error).toBeDefined();
        expect(result.error?.message).toContain('Unterminated quoted field');
        expect(result.headers).toEqual([]);
    });
}); 