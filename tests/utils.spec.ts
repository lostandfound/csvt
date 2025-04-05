import { describe, it, expect } from 'vitest';
import { splitCsvLine } from '../src/utils.js';

describe('splitCsvLine', () => {
    it('should split a simple line', () => {
        expect(splitCsvLine('a,b,c')).toEqual(['a', 'b', 'c']);
    });

    it('should handle empty fields', () => {
        expect(splitCsvLine('a,,c')).toEqual(['a', '', 'c']);
        expect(splitCsvLine(',b,')).toEqual(['', 'b', '']);
    });

    it('should handle quoted fields', () => {
        expect(splitCsvLine('"a","b","c"')).toEqual(['"a"' , '"b"' , '"c"']); // Raw split, cleaning is separate
    });

    it('should handle quoted fields with commas', () => {
        expect(splitCsvLine('"a,b",c')).toEqual(['"a,b"', 'c']);
        expect(splitCsvLine('a,"b,c,d"')).toEqual(['a', '"b,c,d"']);
    });

    it('should handle quoted fields with escaped quotes', () => {
        expect(splitCsvLine('"a""b",c')).toEqual(['"a""b"', 'c']);
        expect(splitCsvLine('a,"b""""c"')).toEqual(['a', '"b""""c"']);
    });

    it('should handle mixed quoted and unquoted fields', () => {
        expect(splitCsvLine('a,"b,c",d,"e""f"')).toEqual(['a', '"b,c"', 'd', '"e""f"']);
    });

    it('should handle fields with leading/trailing spaces (but preserves them within quotes)', () => {
        // Note: splitCsvLine itself does not trim, cleanCsvField does.
        expect(splitCsvLine(' a , b , " c " ')).toEqual([' a ', ' b ', ' " c " ']); 
    });

    it('should handle empty input line', () => {
        expect(splitCsvLine('')).toEqual(['']); // Single empty field
    });

    it('should handle line with only delimiter', () => {
        expect(splitCsvLine(',')).toEqual(['', '']); // Corrected expectation
    });

    it('should handle different delimiters', () => {
        expect(splitCsvLine('a|b|c', '|')).toEqual(['a', 'b', 'c']);
        expect(splitCsvLine('"a|b"|c', '|')).toEqual(['"a|b"', 'c']);
    });

    it('should throw error for unterminated quotes', () => {
        expect(() => splitCsvLine('a,"b,c')).toThrow('Unterminated quoted field');
        expect(() => splitCsvLine('"a')).toThrow('Unterminated quoted field');
        expect(() => splitCsvLine('"a""b')).toThrow('Unterminated quoted field');
    });

    it('should handle quotes not at the beginning correctly (treats as normal char)', () => {
        expect(splitCsvLine('a"b,c')).toEqual(['a"b', 'c']);
    });

}); 