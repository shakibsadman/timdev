"use client";
// updated component
import React, { useState, useEffect } from "react";
import { useDebounce } from "../hooks/useDebounce";

import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiSpacer,
  EuiTab,
  EuiTabs,
  EuiText,
  EuiButton,
  EuiButtonIcon,
  EuiSelect,
  EuiFieldText,
  EuiFieldNumber,
  EuiDatePicker,
  EuiComboBox,
  EuiFormRow,
  EuiCallOut,
  EuiHorizontalRule,
  EuiToolTip,
  EuiCode,
} from "@elastic/eui";
import moment from "moment";
import { EntityKind } from "@/app/types/models";

// Filter Builder Types
type Condition = {
  path: string;
  condition: { op: string; value?: unknown };
};

type Group = {
  op: "AND" | "OR";
  children: Array<Group | Condition>;
};

type ValueSchema = {
  kind: "string" | "number" | "datetime" | "boolean" | "object" | "none";
  format?: string;
  fields?: Record<string, ValueSchema>;
};

type PathInfo = {
  path: string;
  type: "string" | "number" | "datetime" | "boolean";
  operators: string[];
  valueSchema: Record<string, ValueSchema>;
  example_values?: string[];
};

type PathAutocompleteResponse = {
  prefix: string;
  paths: PathInfo[];
};

// Helper functions
const isCondition = (item: Group | Condition): item is Condition => {
  return "path" in item && "condition" in item;
};



// Path autocomplete hook
const usePathAutocomplete = (prefix: string, entityType: EntityKind) => {
  const [paths, setPaths] = useState<PathInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedPrefix = useDebounce(prefix, 300);

  useEffect(() => {
    if (debouncedPrefix.length < 1) {
      setPaths([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    fetch(`/api/search/paths?prefix=${encodeURIComponent(debouncedPrefix)}&entity_type=${entityType}`)
      .then(async res => {
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
        }
        return res.json();
      })
      .then((data: PathAutocompleteResponse) => {
        setPaths(data.paths || []);
        setError(null);
      })
      .catch(err => {
        console.error("Failed to fetch paths:", err);
        setPaths([]);
        setError(err.message || "Failed to load autocomplete suggestions");
      })
      .finally(() => setLoading(false));
  }, [debouncedPrefix, entityType]);

  return { paths, loading, error };
};

// Value control component based on path type and operator
const ValueControl = ({
  pathInfo,
  operator,
  value,
  onChange,
}: {
  pathInfo: PathInfo | null;
  operator: string;
  value: unknown;
  onChange: (value: unknown) => void;
}) => {
  if (!pathInfo || !operator) return null;

  const schema = pathInfo.valueSchema[operator];
  if (!schema || schema.kind === "none") return null;

  if (pathInfo.type === "string") {
    if (pathInfo.example_values && pathInfo.example_values.length > 0) {
      const options = pathInfo.example_values.map(val => ({ label: val, value: val }));
      return (
        <EuiComboBox
          placeholder="Select or type value"
          options={options}
          selectedOptions={value ? [{ label: String(value), value: String(value) }] : []}
          onChange={(selected) => onChange(selected[0]?.value || "")}
          singleSelection={{ asPlainText: true }}
          isClearable
        />
      );
    }
    return (
      <EuiFieldText
        placeholder="Enter value"
        value={String(value || "")}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  if (pathInfo.type === "number") {
    if (operator === "between") {
      const betweenValue = (value as { from: number | string; to: number | string }) || { from: "", to: "" };
      return (
        <EuiFlexGroup gutterSize="s" alignItems="center">
          <EuiFlexItem>
            <EuiFieldNumber
              placeholder="From"
              value={betweenValue.from}
              onChange={(e) => onChange({ ...betweenValue, from: parseFloat(e.target.value) || "" })}
            />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiText size="s">to</EuiText>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiFieldNumber
              placeholder="To"
              value={betweenValue.to}
              onChange={(e) => onChange({ ...betweenValue, to: parseFloat(e.target.value) || "" })}
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      );
    }
    return (
      <EuiFieldNumber
        placeholder="Enter number"
        value={Number(value) || ""}
        onChange={(e) => onChange(parseFloat(e.target.value) || "")}
      />
    );
  }

  if (pathInfo.type === "datetime") {
    if (operator === "between") {
      const betweenValue = (value as { from: string | null; to: string | null }) || { from: null, to: null };
      return (
        <EuiFlexGroup gutterSize="s" alignItems="center">
          <EuiFlexItem>
            <EuiDatePicker
              selected={betweenValue.from ? moment(betweenValue.from) : null}
              onChange={(date) => onChange({ ...betweenValue, from: date?.toISOString() })}
              showTimeSelect
              dateFormat="yyyy-MM-dd HH:mm"
              placeholderText="From date"
            />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiText size="s">to</EuiText>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiDatePicker
              selected={betweenValue.to ? moment(betweenValue.to) : null}
              onChange={(date) => onChange({ ...betweenValue, to: date?.toISOString() })}
              showTimeSelect
              dateFormat="yyyy-MM-dd HH:mm"
              placeholderText="To date"
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      );
    }
    return (
      <EuiDatePicker
        selected={value ? moment(String(value)) : null}
        onChange={(date) => onChange(date?.toISOString())}
        showTimeSelect
        dateFormat="yyyy-MM-dd HH:mm"
        placeholderText="Select date"
      />
    );
  }

  if (pathInfo.type === "boolean") {
    return (
      <EuiSelect
        options={[
          { value: "", text: "Select..." },
          { value: "true", text: "True" },
          { value: "false", text: "False" },
        ]}
        value={value === true ? "true" : value === false ? "false" : ""}
        onChange={(e) => {
          const val = e.target.value;
          onChange(val === "true" ? true : val === "false" ? false : undefined);
        }}
      />
    );
  }

  return null;
};

// Condition row component
const ConditionRow = ({
  condition,
  entityType,
  onChange,
  onRemove,
}: {
  condition: Condition;
  entityType: EntityKind;
  onChange: (condition: Condition) => void;
  onRemove: () => void;
}) => {
  const [pathInput, setPathInput] = useState(condition.path);
  const [selectedPathInfo, setSelectedPathInfo] = useState<PathInfo | null>(null);
  const { paths, loading, error } = usePathAutocomplete(pathInput, entityType);

  // Update selectedPathInfo when we have a complete path match
  useEffect(() => {
    if (condition.path) {
      const pathInfo = paths.find(p => p.path === condition.path);
      if (pathInfo) {
        setSelectedPathInfo(pathInfo);
      }
    } else {
      setSelectedPathInfo(null);
    }
  }, [condition.path, paths]);

  const handlePathChange = (newPath: string) => {
    const pathInfo = paths.find(p => p.path === newPath);
    setPathInput(newPath);

    // Immediately set the selected path info if we found it
    if (pathInfo) {
      setSelectedPathInfo(pathInfo);
    }

    // Reset operator and value when path changes
    const newCondition: Condition = {
      path: newPath,
      condition: { op: "", value: undefined }
    };

    // If we have path info and the current operator is still valid, keep it
    if (pathInfo && condition.condition.op && pathInfo.operators.includes(condition.condition.op)) {
      newCondition.condition.op = condition.condition.op;
      // Keep value if it's compatible
      const schema = pathInfo.valueSchema[condition.condition.op];
      if (schema && schema.kind !== "none") {
        newCondition.condition.value = condition.condition.value;
      }
    }

    onChange(newCondition);
  };

  const handleOperatorChange = (op: string) => {
    const newCondition: Condition = {
      ...condition,
      condition: { op, value: undefined }
    };
    onChange(newCondition);
  };

  const handleValueChange = (value: unknown) => {
    onChange({
      ...condition,
      condition: { ...condition.condition, value }
    });
  };

  const pathOptions = paths.map(p => ({ label: p.path, value: p.path }));
  const operatorOptions = selectedPathInfo?.operators.map(op => ({ value: op, text: op })) || [];

  return (
    <EuiPanel paddingSize="s" color="subdued">
      <EuiFlexGroup gutterSize="s" alignItems="center">
        <EuiFlexItem style={{ minWidth: "200px" }}>
          <EuiFormRow
            label="Path"
            display="columnCompressed"
            error={error}
            isInvalid={!!error}
          >
            <EuiComboBox
              placeholder="Type to search paths..."
              options={pathOptions}
              selectedOptions={condition.path ? [{ label: condition.path, value: condition.path }] : []}
              onChange={(selected) => handlePathChange(selected[0]?.value || "")}
              onSearchChange={(searchValue) => {
                setPathInput(searchValue);
                // If user is modifying a selected path, clear the selection
                if (condition.path && searchValue !== condition.path) {
                  handlePathChange("");
                }
              }}
              singleSelection={{ asPlainText: true }}
              isLoading={loading}
              isClearable
              isInvalid={!!error}
            />
          </EuiFormRow>
        </EuiFlexItem>

        <EuiFlexItem style={{ minWidth: "120px" }}>
          <EuiFormRow label="Operator" display="columnCompressed">
            <EuiSelect
              options={[{ value: "", text: "Select..." }, ...operatorOptions]}
              value={condition.condition.op}
              onChange={(e) => handleOperatorChange(e.target.value)}
              disabled={!selectedPathInfo}
            />
          </EuiFormRow>
        </EuiFlexItem>

        <EuiFlexItem>
          <EuiFormRow label="Value" display="columnCompressed">
            <ValueControl
              pathInfo={selectedPathInfo || null}
              operator={condition.condition.op}
              value={condition.condition.value}
              onChange={handleValueChange}
            />
          </EuiFormRow>
        </EuiFlexItem>

        <EuiFlexItem grow={false}>
          <EuiFormRow label="&nbsp;" display="columnCompressed">
            <EuiButtonIcon
              iconType="trash"
              color="danger"
              onClick={onRemove}
              aria-label="Remove condition"
            />
          </EuiFormRow>
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiPanel>
  );
};

// Filter group component with recursive nesting
const FilterGroup = ({
  group,
  entityType,
  onChange,
  onRemove,
  depth = 0,
  isRoot = false,
}: {
  group: Group;
  entityType: EntityKind;
  onChange: (group: Group) => void;
  onRemove?: () => void;
  depth?: number;
  isRoot?: boolean;
}) => {
  const maxDepth = 5;
  const canAddGroup = depth < maxDepth;

  const addCondition = () => {
    const newCondition: Condition = {
      path: "",
      condition: { op: "", value: undefined }
    };
    onChange({
      ...group,
      children: [...group.children, newCondition]
    });
  };

  const addGroup = () => {
    if (!canAddGroup) return;
    const newGroup: Group = {
      op: "AND",
      children: []
    };
    onChange({
      ...group,
      children: [...group.children, newGroup]
    });
  };

  const updateChild = (index: number, child: Group | Condition) => {
    const newChildren = [...group.children];
    newChildren[index] = child;
    onChange({
      ...group,
      children: newChildren
    });
  };

  const removeChild = (index: number) => {
    onChange({
      ...group,
      children: group.children.filter((_, i) => i !== index)
    });
  };

  const toggleOperator = () => {
    onChange({
      ...group,
      op: group.op === "AND" ? "OR" : "AND"
    });
  };

  return (
    <EuiPanel paddingSize="m" color={depth % 2 === 0 ? "plain" : "subdued"} hasBorder>
      <EuiFlexGroup gutterSize="s" alignItems="center" justifyContent="spaceBetween">
        <EuiFlexItem grow={false}>
          <EuiFlexGroup gutterSize="s" alignItems="center">
            <EuiFlexItem grow={false}>
              <EuiText size="s">
                <strong>{isRoot ? "Filter" : "Group"}:</strong>
              </EuiText>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButton
                size="s"
                fill={group.op === "AND"}
                color={group.op === "AND" ? "primary" : "success"}
                onClick={toggleOperator}
              >
                {group.op}
              </EuiButton>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>

        <EuiFlexItem grow={false}>
          <EuiFlexGroup gutterSize="s" alignItems="center">
            <EuiFlexItem grow={false}>
              <EuiButton
                size="s"
                iconType="plusInCircle"
                onClick={addCondition}
              >
                Add Condition
              </EuiButton>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiToolTip content={!canAddGroup ? "Maximum nesting depth reached" : "Add nested group"}>
                <EuiButton
                  size="s"
                  iconType="nested"
                  onClick={addGroup}
                  disabled={!canAddGroup}
                >
                  Add Group
                </EuiButton>
              </EuiToolTip>
            </EuiFlexItem>
            {!isRoot && onRemove && (
              <EuiFlexItem grow={false}>
                <EuiButtonIcon
                  iconType="trash"
                  color="danger"
                  onClick={onRemove}
                  aria-label="Remove group"
                />
              </EuiFlexItem>
            )}
          </EuiFlexGroup>
        </EuiFlexItem>
      </EuiFlexGroup>

      {group.children.length > 0 && (
        <>
          <EuiSpacer size="m" />
          <div style={{ paddingLeft: isRoot ? 0 : 16 }}>
            {group.children.map((child, index) => (
              <div key={index}>
                {index > 0 && (
                  <EuiFlexGroup gutterSize="none" alignItems="center" justifyContent="center">
                    <EuiFlexItem grow={false}>
                      <EuiText size="s" color="subdued" textAlign="center">
                        <EuiCode>{group.op}</EuiCode>
                      </EuiText>
                    </EuiFlexItem>
                  </EuiFlexGroup>
                )}
                <EuiSpacer size="s" />
                {isCondition(child) ? (
                  <ConditionRow
                    condition={child}
                    entityType={entityType}
                    onChange={(newCondition) => updateChild(index, newCondition)}
                    onRemove={() => removeChild(index)}
                  />
                ) : (
                  <FilterGroup
                    group={child}
                    entityType={entityType}
                    onChange={(newGroup) => updateChild(index, newGroup)}
                    onRemove={() => removeChild(index)}
                    depth={depth + 1}
                  />
                )}
                <EuiSpacer size="s" />
              </div>
            ))}
          </div>
        </>
      )}

      {group.children.length === 0 && (
        <>
          <EuiSpacer size="s" />
          <EuiCallOut
            title="Empty group"
            color="primary"
            iconType="iInCircle"
            size="s"
          >
            <p>Add conditions or nested groups to build your filter.</p>
          </EuiCallOut>
        </>
      )}
    </EuiPanel>
  );
};

const ENTITY_TABS = [
  { id: "SUBSCRIPTION", label: "Subscriptions", icon: "📋" },
  { id: "PRODUCT", label: "Products", icon: "📦" },
  { id: "WORKFLOW", label: "Workflows", icon: "🔄" },
  { id: "PROCESS", label: "Processes", icon: "⚙️" },
] as const;

export const WfoSearch = () => {
  const [selectedEntityTab, setSelectedEntityTab] = useState<EntityKind>("SUBSCRIPTION");
  const [filterGroup, setFilterGroup] = useState<Group>({
    op: "AND",
    children: []
  });

  const handleTabChange = (tabId: EntityKind) => {
    setSelectedEntityTab(tabId);
    // Reset filter when changing entity type
    setFilterGroup({
      op: "AND",
      children: []
    });
  };

  const handleExecuteFilter = () => {
    // This would send the filter to the search endpoint
    console.log("Executing filter:", JSON.stringify(filterGroup, null, 2));
    // TODO: Implement actual search execution
  };

  const isFilterValid = (group: Group): boolean => {
    return group.children.every(child => {
      if (isCondition(child)) {
        return child.path && child.condition.op &&
          (child.condition.value !== undefined ||
            ["is_null", "is_not_null"].includes(child.condition.op));
      }
      return isFilterValid(child);
    });
  };

  const currentTab = ENTITY_TABS.find((tab) => tab.id === selectedEntityTab);
  const hasConditions = filterGroup.children.length > 0;
  const filterValid = isFilterValid(filterGroup);

  return (
    <>
      <EuiFlexGroup gutterSize="m" alignItems="center" justifyContent="spaceBetween">
        <EuiFlexItem>
          <EuiTabs>
            {ENTITY_TABS.map((tab) => (
              <EuiTab
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                isSelected={selectedEntityTab === tab.id}
              >
                {tab.icon} {tab.label}
              </EuiTab>
            ))}
          </EuiTabs>
        </EuiFlexItem>

        {hasConditions && (
          <EuiFlexItem grow={false}>
            <EuiButton
              fill
              iconType="search"
              onClick={handleExecuteFilter}
              disabled={!filterValid}
            >
              Execute Filter
            </EuiButton>
          </EuiFlexItem>
        )}
      </EuiFlexGroup>

      <EuiSpacer size="l" />

      <EuiText>
        <h2>Filter Builder - {currentTab?.label}</h2>
        <p>Build complex nested filters using AND/OR groups and conditions.</p>
      </EuiText>

      <EuiSpacer size="m" />

      <FilterGroup
        group={filterGroup}
        entityType={selectedEntityTab}
        onChange={setFilterGroup}
        isRoot
      />

      {hasConditions && (
        <>
          <EuiSpacer size="l" />
          <EuiHorizontalRule />
          <EuiSpacer size="m" />
          <EuiText>
            <h4>Filter JSON Preview</h4>
          </EuiText>
          <EuiSpacer size="s" />
          <EuiPanel paddingSize="s" color="subdued">
            <pre style={{ fontSize: "12px", color: "black", margin: 0, overflow: "auto" }}>
              {JSON.stringify(filterGroup, null, 2)}
            </pre>
          </EuiPanel>
        </>
      )}
    </>
  );
};
