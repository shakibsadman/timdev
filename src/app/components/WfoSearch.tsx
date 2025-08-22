"use client";

import React, { useState } from "react";
import { useSearch } from "../hooks/useSearch";
import { useDebounce } from "../hooks/useDebounce";
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiSearchBar,
  EuiSpacer,
  EuiTab,
  EuiTabs,
  EuiText,
  Query,
  EuiSearchBarOnChangeArgs,
  EuiCodeBlock,
  EuiEmptyPrompt,
  EuiBadge,
} from "@elastic/eui";
import {
  EntityKind,
  AnySearchResult,
  Subscription,
  SubscriptionSearchResult,
  ProcessSearchResult,
  ProductSearchResult,
  WorkflowSearchResult,
} from "@/app/types/models";

function isSubscriptionSearchResult(
  item: AnySearchResult
): item is SubscriptionSearchResult {
  return "subscription" in item && typeof item.subscription === "object";
}
function isProcessSearchResult(
  item: AnySearchResult
): item is ProcessSearchResult {
  return "processId" in item && "workflowName" in item;
}
function isProductSearchResult(
  item: AnySearchResult
): item is ProductSearchResult {
  return "productId" in item && "productType" in item;
}
function isWorkflowSearchResult(
  item: AnySearchResult
): item is WorkflowSearchResult {
  return "products" in item && Array.isArray(item.products);
}

const getCoreRecord = (item: AnySearchResult | null): object | null => {
  if (!item) {
    return null;
  }
  if (isSubscriptionSearchResult(item)) {
    return item.subscription;
  }
  const { ...coreRecord } = item;
  return coreRecord;
};

const WfoSearchResults = ({
  results,
  loading,
  onRecordHover,
}: {
  results: AnySearchResult[];
  loading: boolean;
  onRecordHover: (item: AnySearchResult | null) => void;
}) => {
  const getDisplayText = (item: AnySearchResult): string => {
    if (isSubscriptionSearchResult(item)) {
      const subData = item.subscription as Subscription;
      return subData.description || "Subscription";
    }
    if (isProcessSearchResult(item)) {
      return item.workflowName;
    }
    if (isProductSearchResult(item)) {
      return item.name;
    }
    if (isWorkflowSearchResult(item)) {
      return item.name;
    }
    return "Unknown result type";
  };

  if (loading) {
    return (
      <EuiText size="s" color="subdued" style={{ padding: "8px" }}>
        Loading...
      </EuiText>
    );
  }
  if (!results || results.length === 0) {
    return (
      <EuiText size="s" color="subdued" style={{ padding: "8px" }}>
        No results to display.
      </EuiText>
    );
  }

  return (
    <div style={{ maxHeight: "400px", overflowY: "auto" }}>
      {results.map((item, index) => (
        <div
          key={index}
          onMouseEnter={() => onRecordHover(item)}
          style={{ padding: "8px", borderBottom: "1px solid #eee" }}
        >
          <EuiFlexGroup gutterSize="m" alignItems="center" responsive={false}>
            <EuiFlexItem>
              <EuiText size="s" color="default">
                <strong>{getDisplayText(item)}</strong>
              </EuiText>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              {isSubscriptionSearchResult(item) &&
                typeof item.score === "number" && (
                  <EuiBadge color="hollow">{item.score.toFixed(4)}</EuiBadge>
                )}
            </EuiFlexItem>
          </EuiFlexGroup>
        </div>
      ))}
    </div>
  );
};

const RecordDetailViewer = ({ record }: { record: AnySearchResult | null }) => {
  const coreRecord = getCoreRecord(record);

  if (!coreRecord) {
    return (
      <EuiEmptyPrompt
        iconType="eye"
        title={<h2>Record Details</h2>}
        body={<p>Hover over a result on the left to see its full data.</p>}
        style={{ height: "100%" }}
      />
    );
  }

  return (
    <>
      <EuiText>
        <h4>Full Record JSON</h4>
      </EuiText>
      <EuiSpacer size="s" />
      <EuiCodeBlock language="json" fontSize="s" paddingSize="s" isCopyable>
        {JSON.stringify(coreRecord, null, 2)}
      </EuiCodeBlock>
    </>
  );
};

const ENTITY_TABS = [
  { id: "SUBSCRIPTION", label: "Subscriptions", icon: "📋" },
  { id: "PRODUCT", label: "Products", icon: "📦" },
  { id: "WORKFLOW", label: "Workflows", icon: "🔄" },
  { id: "PROCESS", label: "Processes", icon: "⚙️" },
] as const;

export const WfoSearch = () => {
  const [query, setQuery] = useState<Query | string>(
    EuiSearchBar.Query.MATCH_ALL
  );
  const [selectedEntityTab, setSelectedEntityTab] =
    useState<EntityKind>("SUBSCRIPTION");
  const [hoveredRecord, setHoveredRecord] = useState<AnySearchResult | null>(
    null
  );
  const debouncedQuery = useDebounce(query, 300);
  const { results, loading } = useSearch(debouncedQuery, selectedEntityTab);
  const handleTabChange = (tabId: EntityKind) => {
    setSelectedEntityTab(tabId);
    setQuery(EuiSearchBar.Query.MATCH_ALL);
    setHoveredRecord(null);
  };
  const onSearchChange = ({ query, queryText }: EuiSearchBarOnChangeArgs) => {
    setQuery(query || EuiSearchBar.Query.MATCH_ALL);
    return true;
  };
  const currentTab = ENTITY_TABS.find((tab) => tab.id === selectedEntityTab);
  const isSearchActive = results.length > 0 || loading;
  return (
    <>
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
      <EuiSpacer size="m" />
      <EuiSearchBar
        box={{
          placeholder: `Search for ${currentTab?.label.toLowerCase()}…`,
          incremental: true,
        }}
        query={query}
        onChange={onSearchChange}
      />
      {isSearchActive && (
        <>
          <EuiSpacer size="m" />
          <EuiFlexGroup gutterSize="l">
            <EuiFlexItem>
              <EuiPanel paddingSize="none" hasBorder={true}>
                <WfoSearchResults
                  results={results}
                  loading={loading}
                  onRecordHover={setHoveredRecord}
                />
              </EuiPanel>
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiPanel hasBorder={true} style={{ height: "100%" }}>
                <RecordDetailViewer record={hoveredRecord} />
              </EuiPanel>
            </EuiFlexItem>
          </EuiFlexGroup>
        </>
      )}
    </>
  );
};
