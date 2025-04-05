# CSVT (CSV with Types) Specification

**Version:** 0.1.0
**Last Updated:** 2025-04-05

## Change Log

- **v.0.1.1-wd-2025-04-05:**
  - Added recommendation for the `.csvt` file extension in section 2.1.
- **v0.1.0 (2025-04-05):** Initial version published.

## Table of Contents

- [1. Introduction](#1-introduction)
  - [1.1. Overview](#11-overview)
  - [1.2. Background and Purpose](#12-background-and-purpose)
- [2. Basic Specification](#2-basic-specification)
  - [2.1. File Structure](#21-file-structure)
  - [2.2. Header Row Format](#22-header-row-format)
  - [2.3. Data Rows](#23-data-rows)
- [3. Data Type Definitions](#3-data-type-definitions)
  - [3.1. Basic Types](#31-basic-types)
    - [3.1.1. `string`](#311-string)
    - [3.1.2. `number`](#312-number)
    - [3.1.3. `bool`](#313-bool)
    - [3.1.4. `date`](#314-date)
    - [3.1.5. `datetime`](#315-datetime)
  - [3.2. Complex Types](#32-complex-types)
    - [3.2.1. `array`](#321-array)
    - [3.2.2. `object`](#322-object)
  - [3.3. Non-Null Constraint (`!`)](#33-non-null-constraint-)
- [4. Value Representation and Constraints](#4-value-representation-and-constraints)
  - [4.1. NULL Value Representation](#41-null-value-representation)
  - [4.2. Data Escaping](#42-data-escaping)
  - [4.3. Data Type and Value Consistency](#43-data-type-and-value-consistency)
    - [4.3.1. Criteria for Type Mismatch (Examples)](#431-criteria-for-type-mismatch-examples)
    - [4.3.2. Non-Null Constraint Violation](#432-non-null-constraint-violation)
    - [4.3.3. Handling Violations](#433-handling-violations)
- [5. Security Considerations](#5-security-considerations)
- [Appendix A: CSVT File Examples](#appendix-a-csvt-file-examples)
  - [A.1. Basic Example](#a1-basic-example)
  - [A.2. Example with Complex Types and Escaping](#a2-example-with-complex-types-and-escaping)
  - [A.3. Example with Non-Null Constraints](#a3-example-with-non-null-constraints)
  - [A.4. Example with Column Names Containing Special Characters](#a4-example-with-column-names-containing-special-characters)

---

## 1. Introduction

### 1.1. Overview

CSVT (CSV with Types) is a specification that extends the standard CSV (Comma-Separated Values) format by allowing the inclusion of data type information for each column in the header row. This specification defines the structure, data types, and related conventions of the CSVT format.

### 1.2. Background and Purpose

While standard CSV is widely used due to its simplicity, it is often difficult to determine the type of data represented by each column (e.g., string, number, date) from the file itself. This ambiguity can lead to errors in data interpretation and processing.

CSVT aims to enhance the self-descriptiveness of CSV files and improve the clarity of interpretation during data usage by introducing a convention for explicitly writing data type information in the header row.

## 2. Basic Specification

### 2.1. File Structure

*   **Encoding:** UTF-8 is strongly recommended (MUST).
*   **Delimiter:** A comma (`,`) MUST be used as the standard delimiter.
*   **Line Break:** LF (`\n`) or CRLF (`\r\n`) MUST be used.
*   **First Row:** Defined as the header row, specifying column names and type information (MUST). See [2.2. Header Row Format](#22-header-row-format) for details.
*   **Second Row Onwards:** Defined as data rows, which MUST follow the order and types defined in the header. See [2.3. Data Rows](#23-data-rows) for details.
*   **File Extension:** Using the `.csvt` extension for CSVT files is recommended (SHOULD) to distinguish them from standard `.csv` files.

### 2.2. Header Row Format

The header row is the first line of the file and defines the name and data type of each column.

*   Each header field MUST be written in the format `column_name:type_name`.
*   **Column Name:**
    *   Represents the name of the field.
    *   If it contains a delimiter (`,`), newline (`\n`, `\r\n`), or colon (`:`), the entire field MUST be enclosed in double quotes (`"`). Double quotes within the enclosed content MUST be escaped as `""`. Example: `"order:date":date`.
*   **Delimiter (`:`)**:
    *   Reserved character that MUST separate the column name and type name.
*   **Type Name:**
    *   MUST be one of the type names defined in [3. Data Type Definitions](#3-data-type-definitions).
    *   Type names are case-insensitive, but lowercase is recommended (SHOULD).
    *   If the type specification is omitted, it MUST be treated as the `string` type by default. Example: `userId` is equivalent to `userId:string`.

### 2.3. Data Rows

The second and subsequent lines of the file are data rows.

*   Each data row MUST have the same number of fields as the columns defined in the header row.
*   The value of each field MUST conform to the type and constraints ([3. Data Type Definitions](#3-data-type-definitions), [4. Value Representation and Constraints](#4-value-representation-and-constraints)) of the corresponding column defined in the header.
*   See [4.2. Data Escaping](#42-data-escaping) for field value escaping rules.

## 3. Data Type Definitions

The following data types are defined:

### 3.1. Basic Types

#### 3.1.1. `string`

*   Represents arbitrary string data.
*   The default type if the type specification is omitted in the header.

#### 3.1.2. `number`

*   Represents integers and floating-point numbers (equivalent to JSON `number`).
*   Examples: `10`, `-5`, `0`, `3.14`, `-0.5`, `1.0e-3`.

#### 3.1.3. `bool`

*   Represents logical true/false values.
*   Value Representation:
    *   String literals `true` or `false` (lowercase) are strongly recommended (SHOULD) (equivalent to JSON `boolean` literals).
    *   Parsers MAY interpret other representations (e.g., `TRUE`, `FALSE`, `1`, `0`). However, generators SHOULD use `true` or `false` when creating CSVT files.

#### 3.1.4. `date`

*   Represents a specific date.
*   Value Representation: A string in ISO 8601 format (`YYYY-MM-DD`) is strongly recommended (SHOULD). Example: `2023-10-26`.

#### 3.1.5. `datetime`

*   Represents a specific date and time, optionally with a timezone.
*   Value Representation: A string in ISO 8601 format is strongly recommended (SHOULD).
    *   Examples: `2023-10-26T10:30:00Z`, `2023-10-26T19:30:00+09:00`.

### 3.2. Complex Types

#### 3.2.1. `array`

*   Stores data interpreted as a JSON array.
*   Value Representation:
    *   Within a CSV cell, the value MUST be the result of serializing a JavaScript/JSON array into a JSON string, and then applying CSV escaping rules defined in [4.2. Data Escaping](#42-data-escaping) to that resulting string as needed.
    *   Example: Original array `[1, "item", true]` becomes the JSON string `[1,"item",true]`, which is represented in a CSV cell as `"[1,""item"",true]"`.

#### 3.2.2. `object`

*   Stores data interpreted as a JSON object.
*   Value Representation:
    *   Within a CSV cell, the value MUST be the result of serializing a JavaScript/JSON object into a JSON string, and then applying CSV escaping rules defined in [4.2. Data Escaping](#42-data-escaping) to that resulting string as needed.
    *   Example: Original object `{"key": "value", "num": 1}` becomes the JSON string `{"key":"value","num":1}`, which is represented in a CSV cell as `"{""key"":""value"",""num"":1}"`.

### 3.3. Non-Null Constraint (`!`)

*   An exclamation mark (`!`) MUST be appended to the end of the type name to indicate that the column value is required and cannot be NULL (or an empty string).
*   Examples: `string!`, `number!`, `bool!`, `date!`, `datetime!`, `array!`, `object!`.
*   For columns with `!`, the corresponding field in the data rows MUST NOT be empty (`""`). See [4.3.2. Non-Null Constraint Violation](#432-non-null-constraint-violation) for details.

## 4. Value Representation and Constraints

### 4.1. NULL Value Representation

*   By default, all columns allow NULL values (absence of a value).
*   To represent NULL in a data row, the corresponding field MUST be left **empty** (`""`).
    *   Example: In `value1,,value3`, the second field represents NULL.
*   Unless the Non-Null constraint (`!`) is appended to the type name, parsers SHOULD interpret an empty field as `null`.

### 4.2. Data Escaping

The following escaping rules MUST be applied to the values of data fields. This conforms to the standard CSV escaping rules defined in [RFC 4180](https://tools.ietf.org/html/rfc4180).

*   If a field value contains a delimiter (comma `,` by default), a double quote (`"`), or a line break (`\n`, `\r\n`), the entire field MUST be enclosed in double quotes (`"`).
*   If a field value is enclosed in double quotes, any double quote (`"`) characters within the value MUST be escaped by preceding them with another double quote (`""`).
*   **Special Handling for `array` and `object` Types:**
    *   Values of these types MUST first be serialized from their corresponding JSON array or object into a JSON string.
    *   Then, the resulting JSON string MUST be processed according to the CSV escaping rules above.
    *   **Example (JSON Array):**
        *   Original array: `[1, "foo", true]`
        *   JSON stringified: `[1,"foo",true]`
        *   In CSV cell: `"[1,""foo"",true]"`
    *   **Example (JSON Object):**
        *   Original object: `{"id": 10, "tag": "bar"}`
        *   JSON stringified: `{"id":10,"tag":"bar"}`
        *   In CSV cell: `"{""id"":10,""tag"":""bar""}"`

### 4.3. Data Type and Value Consistency

The value of each field in the data rows MUST comply with the type and Non-Null constraint (`!`) defined in the header.

#### 4.3.1. Criteria for Type Mismatch (Examples)

The following are typical cases where a field's value is considered inconsistent with the type defined in the header (this list is not exhaustive):

*   A non-empty string that cannot be interpreted as a number exists in a `number` or `number!` column (e.g., `"abc"`, `"N/A"`).
*   A non-empty string that the parser cannot interpret as a boolean (recommended: `true`/`false`) exists in a `bool` or `bool!` column (e.g., `"yes"`, `"unknown"`).
*   A non-empty string that the parser cannot interpret as a valid date/datetime (recommended: ISO 8601) exists in a `date`/`datetime` or `date!`/`datetime!` column (e.g., `"Jan 1st, 2023"`, `"invalid date"`).
*   A non-empty string that cannot be interpreted as a valid JSON string exists in an `array`/`object` or `array!`/`object!` column (e.g., `"[1,2,"`, `"{""key"": "` ).

**Note:** If a column does **not** have the Non-Null constraint (`!`), an empty string (`""`) SHOULD be interpreted as `null` according to [4.1. NULL Value Representation](#41-null-value-representation) and is not considered a type mismatch.

#### 4.3.2. Non-Null Constraint Violation

*   If a data row field corresponding to a column specified with the Non-Null constraint (`!`) in the header (e.g., `userId:number!`) is empty (`""`), it MUST always be considered a **constraint violation**.

#### 4.3.3. Handling Violations

A CSVT parser needs to define its behavior when detecting a type mismatch or a Non-Null constraint violation.

*   **Default Behavior (Recommended):**
    *   The parser SHOULD, by default, report an error and abort the parsing process upon detecting a type mismatch or Non-Null constraint violation.
    *   This allows data quality issues to be discovered early, preventing processing based on inaccurate data.
    *   The reported error information SHOULD include details helpful for identifying the problem (e.g., row number, column name, expected type, actual value, error type).
*   **Optional Behavior (Implementation-dependent):**
    *   Parsers MAY offer the following lenient processing modes based on user choice:
        *   **Error Collection Mode:**
            *   Does not abort parsing upon type mismatch or constraint violation, but collects information about all detected errors (including row number, column name, value, error type, etc.).
            *   Returns both the partially successful data and the list of collected errors after parsing completes.
        *   **NULL Substitution Mode:**
            *   Treats the value of a field with a type mismatch as `null`.
            *   **However, if a type mismatch or empty string is detected in a column specified with the Non-Null constraint (`!`), it MUST be treated as an error even in this mode.**
            *   This mode can be useful for continuing processing even if some data is problematic, but carries the risk of unintended data loss.
*   **Parser Documentation:**
    *   Implementers of CSVT parsers MUST clearly describe the supported error handling modes, the default behavior, and how to configure options in their documentation.

## 5. Security Considerations

When processing CSVT files from untrusted sources, be aware of potential security risks. Key considerations and recommendations include:

*   **Input Validation:**
    *   Beyond checking if the file content and structure comply with the specification, it is important to validate the data's appropriateness within the application's context (e.g., string length, numeric range, allowed characters).
*   **Resource Consumption:**
    *   Extremely large files, excessively long lines, or files with a vast number of columns can potentially consume excessive memory or CPU resources of the parser (Denial of Service - DoS). Consider setting limits on the file size, line length, or number of columns processed, if possible.
*   **Risks with Complex Types (`array`, `object`):**
    *   These types require parsing JSON strings internally. Maliciously crafted JSON strings (e.g., extremely deep nesting structures, very long strings) could exhaust the JSON parser's resources, leading to DoS.
    *   Verify whether the JSON parser used is resilient against such attacks or provides configurable limits (e.g., maximum nesting depth, maximum string length), and configure them appropriately (SHOULD).
    *   Use a secure, widely adopted, and continuously maintained JSON library (MUST).
*   **Injection Risks:**
    *   Using data read from a CSVT file (especially `string` type) directly in other contexts like HTML, SQL, or command lines can pose injection risks (Cross-Site Scripting - XSS, SQL Injection, etc.).
    *   While not specific to CSVT, always ensure proper sanitization or escaping is performed before passing data to other systems or components (MUST).

Implementers of CSVT parsers should be aware of these risks, provide safe default settings where possible, and consider offering options for users to adjust security-related settings (like resource limits) (SHOULD).

## Appendix A: CSVT File Examples

### A.1. Basic Example

```csv
id:number!,name,registered:bool,created_at:date,last_login:datetime
1,"Alice",true,2023-01-15,2024-07-27T10:30:00Z
2,"Bob",false,2023-03-10,
3,"Charlie",true,2024-01-20,2024-07-26T15:00:00+09:00
```

*   `id` is a non-null number type.
*   `name` is `string` type by default as type is omitted.
*   `registered` is boolean type.
*   `created_at` is date type.
*   `last_login` is datetime type, with a NULL value in the second data row.

### A.2. Example with Complex Types and Escaping

```csv
item_id:string!,tags:array,details:object,description:string
"item-001","[""new"",""popular""]","{""color"":""red"",""size"":""M""}","A ""red"" t-shirt, size M"
"item-002","[]","{""weight"":1.5,""unit"":""kg""}","Contains comma, and quotes: ""."
"item-003","[""sale""]","{}",
```

*   `tags` is an array type. The second data row has an empty array `[]`.
*   `details` is an object type. The third data row has an empty object `{}`.
*   `description` demonstrates CSV escaping for double quotes and commas.

### A.3. Example with Non-Null Constraints

```csv
code:string!,value:number!,active:bool!
"A",100,true
"B",,false
"C",300,
```

*   All columns `code`, `value`, and `active` are non-null.
*   The second data row violates the constraint for `value` (empty field).
*   The third data row violates the constraint for `active` (empty field).
*   A parser in strict mode would likely fail on the second row. A parser in collect mode would report errors for rows 2 and 3.

### A.4. Example with Column Names Containing Special Characters

```csv
"order:id":string!,"customer,name":string,"items[0].price":number
"ORD-001","John Doe",99.90
"ORD-002","Jane ""The Runner"" Smith",15.50
```

*   `"order:id"`: Column name contains a colon (`:`), requires quoting. It's also non-null.
*   `"customer,name"`: Column name contains a comma (`,`), requires quoting.
*   `"items[0].price"`: Column name contains characters (`[` `]` `.`) which are allowed but don't require quoting themselves (unless they were a comma, colon, or newline). It's a number type. 