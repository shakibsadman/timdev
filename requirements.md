# Nested Filter Builder

**Packages to Use**:

- `"@elastic/eui": "101.3.0"`
- `"@emotion/css": "^11.11.2"`
- `"@emotion/react": "^11.11.4"`

**Use Datepicker**: From `EuiDatepicker`

**Deliverable**: Clone the repo and provide a PR in your OWN GitHub account.

**Goal**: Build a nested filter UI (AND/OR groups) from Path • Operator • Value triplets. Path autocomplete returns only full, valid, filterable paths.

## Data Model (Client ↔ Server)

```typescript
type Condition = {
  path: string;
  condition: { op: string; value?: unknown }; // some ops have no value
};

type Group = {
  op: "AND" | "OR";
  children: Array<Group | Condition>;
};
```

````

- Operators like `is_null` / `is_not_null` do not include `value`.

## UI Behavior

- **Root**: A Group (default `AND`).
- **Controls**:
  - Add condition
  - Add group
  - Remove group (not root)
  - Toggle `AND`/`OR` on any group
- **Condition Row**:
  1. **Path**: Autocomplete; whole paths only; free text disabled.
  2. **Operator**: Select; populated from backend for the chosen path.
  3. **Value**: Control depends on path type & operator (text/number/boolean/datetime/range). Hidden when operator needs no value.
- **Validation**:
  1. A row is valid only if: path is from autocomplete, operator is allowed for that path, and value is provided/valid when required.
  2. Changing path resets operator/value unless still compatible per `valueSchema`.
  3. Start autocomplete when `>=` 3 characters.
  4. Max group nesting = 5.
  5. For `between`, require both ends and enforce `from ≤ to`.

## API Contracts

### 1. Whole-Path Autocomplete (Called on Every Keystroke)

**Endpoint**: `GET api/search/paths?prefix=<string>&entity_type=<enum>`

- **entity_type**: `SUBSCRIPTION` | `PRODUCT` | `WORKFLOW` | `PROCESS`
- **Returns**: Only complete, usable paths.

**Example Response**:

```json
{
  "prefix": "subscription.st",
  "paths": [
    {
      "path": "subscription.status",
      "type": "string",
      "operators": ["eq", "ne", "is_null", "is_not_null"],
      "valueSchema": {
        "eq": { "kind": "string" },
        "ne": { "kind": "string" },
        "is_null": { "kind": "none" },
        "is_not_null": { "kind": "none" }
      },
      "example_values": ["active", "disabled"]
    },
    {
      "path": "subscription.start_date",
      "type": "datetime",
      "operators": [
        "eq",
        "neq",
        "lt",
        "lte",
        "gt",
        "gte",
        "between",
        "is_null",
        "is_not_null"
      ],
      "valueSchema": {
        "eq": { "kind": "string", "format": "datetime" },
        "between": {
          "kind": "object",
          "fields": {
            "from": { "kind": "string", "format": "datetime" },
            "to": { "kind": "string", "format": "datetime" }
          }
        },
        "is_null": { "kind": "none" },
        "is_not_null": { "kind": "none" }
      },
      "example_values": ["2024-01-01T00:00:00Z"]
    }
  ]
}
```

## Conditionally Render UI for Value Based on Value Type

### Control Matrix

| Path Type    | Operators                             | UI Control                                 | Value Shape (Sent/Stored)      | Notes                                                      |
| ------------ | ------------------------------------- | ------------------------------------------ | ------------------------------ | ---------------------------------------------------------- |
| **string**   | `eq`, `ne`                            | Single-line text or single-select if enums | `"foo"`                        | If `example_values` present, prefer a select/autocomplete. |
| **string**   | `is_null`, `is_not_null`              | (none)                                     | `none`                         | Disable value input.                                       |
| **number**   | `eq`, `ne`, `lt`, `lte`, `gt`, `gte`  | Numeric input                              | `123.45`                       | Validate numeric. Optional min/max if provided later.      |
| **number**   | `between`                             | Two numeric inputs (“From”, “To”)          | `{ "from": 1, "to": 10 }`      | Enforce `from <= to`.                                      |
| **number**   | `is_null`, `is_not_null`              | (none)                                     | `none`                         | —                                                          |
| **datetime** | `eq`, `neq`, `lt`, `lte`, `gt`, `gte` | Datetime picker                            | `"2025-08-21T13:45:00Z"`       | Use ISO-8601. Display in user TZ; store/send ISO UTC.      |
| **datetime** | `between`                             | Two datetime pickers (“From”, “To”)        | `{ "from": "…Z", "to": "…Z" }` | Enforce `from <= to`.                                      |
| **datetime** | `is_null`, `is_not_null`              | (none)                                     | `none`                         | —                                                          |
| **boolean**  | `eq`, `ne`                            | Toggle / radio (True/False)                | `true` / `false`               | Don’t send strings `"true"`.                               |

## Example Payload to Execute Search Endpoint

```json
{
  "op": "AND",
  "children": [
    {
      "path": "subscription.status",
      "condition": { "op": "eq", "value": "active" }
    },
    {
      "op": "OR",
      "children": [
        {
          "path": "subscription.start_date",
          "condition": {
            "op": "between",
            "value": {
              "from": "2024-01-01T00:00:00Z",
              "to": "2024-12-31T23:59:59Z"
            }
          }
        },
        {
          "path": "subscription.end_date",
          "condition": { "op": "is_null" }
        }
      ]
    }
  ]
}
```

```

### Notes on Translation
- The document structure is preserved with headers, bullet points, and tables converted to Markdown equivalents.
- Code blocks are formatted as TypeScript or JSON as appropriate.
- The table is converted to a Markdown table with aligned columns.
- All technical details, including API contracts, UI behavior, and control matrix, are retained verbatim.
- Minor formatting adjustments (e.g., bold for emphasis, consistent list markers) ensure readability in Markdown.

If you need further assistance, such as implementing the tasks or creating the PR, let me know!

````
