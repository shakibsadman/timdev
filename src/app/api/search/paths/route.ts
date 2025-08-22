import { NextRequest, NextResponse } from "next/server";

// Mock data for different entity types
const MOCK_PATHS = {
  SUBSCRIPTION: [
    {
      path: "subscription.status",
      type: "string" as const,
      operators: ["eq", "ne", "is_null", "is_not_null"],
      valueSchema: {
        eq: { kind: "string" as const },
        ne: { kind: "string" as const },
        is_null: { kind: "none" as const },
        is_not_null: { kind: "none" as const }
      },
      example_values: ["active", "disabled", "pending", "cancelled"]
    },
    {
      path: "subscription.start_date",
      type: "datetime" as const,
      operators: ["eq", "ne", "lt", "lte", "gt", "gte", "between", "is_null", "is_not_null"],
      valueSchema: {
        eq: { kind: "string" as const, format: "datetime" },
        ne: { kind: "string" as const, format: "datetime" },
        lt: { kind: "string" as const, format: "datetime" },
        lte: { kind: "string" as const, format: "datetime" },
        gt: { kind: "string" as const, format: "datetime" },
        gte: { kind: "string" as const, format: "datetime" },
        between: {
          kind: "object" as const,
          fields: {
            from: { kind: "string" as const, format: "datetime" },
            to: { kind: "string" as const, format: "datetime" }
          }
        },
        is_null: { kind: "none" as const },
        is_not_null: { kind: "none" as const }
      },
      example_values: ["2024-01-01T00:00:00Z", "2024-06-15T12:30:00Z"]
    },
    {
      path: "subscription.end_date",
      type: "datetime" as const,
      operators: ["eq", "ne", "lt", "lte", "gt", "gte", "between", "is_null", "is_not_null"],
      valueSchema: {
        eq: { kind: "string" as const, format: "datetime" },
        ne: { kind: "string" as const, format: "datetime" },
        lt: { kind: "string" as const, format: "datetime" },
        lte: { kind: "string" as const, format: "datetime" },
        gt: { kind: "string" as const, format: "datetime" },
        gte: { kind: "string" as const, format: "datetime" },
        between: {
          kind: "object" as const,
          fields: {
            from: { kind: "string" as const, format: "datetime" },
            to: { kind: "string" as const, format: "datetime" }
          }
        },
        is_null: { kind: "none" as const },
        is_not_null: { kind: "none" as const }
      }
    },
    {
      path: "subscription.customer_id",
      type: "string" as const,
      operators: ["eq", "ne", "is_null", "is_not_null"],
      valueSchema: {
        eq: { kind: "string" as const },
        ne: { kind: "string" as const },
        is_null: { kind: "none" as const },
        is_not_null: { kind: "none" as const }
      }
    },
    {
      path: "subscription.monthly_fee",
      type: "number" as const,
      operators: ["eq", "ne", "lt", "lte", "gt", "gte", "between", "is_null", "is_not_null"],
      valueSchema: {
        eq: { kind: "number" as const },
        ne: { kind: "number" as const },
        lt: { kind: "number" as const },
        lte: { kind: "number" as const },
        gt: { kind: "number" as const },
        gte: { kind: "number" as const },
        between: {
          kind: "object" as const,
          fields: {
            from: { kind: "number" as const },
            to: { kind: "number" as const }
          }
        },
        is_null: { kind: "none" as const },
        is_not_null: { kind: "none" as const }
      }
    },
    {
      path: "subscription.auto_renew",
      type: "boolean" as const,
      operators: ["eq", "ne"],
      valueSchema: {
        eq: { kind: "boolean" as const },
        ne: { kind: "boolean" as const }
      }
    },
    {
      path: "subscription.description",
      type: "string" as const,
      operators: ["eq", "ne", "is_null", "is_not_null"],
      valueSchema: {
        eq: { kind: "string" as const },
        ne: { kind: "string" as const },
        is_null: { kind: "none" as const },
        is_not_null: { kind: "none" as const }
      }
    }
  ],
  PRODUCT: [
    {
      path: "product.name",
      type: "string" as const,
      operators: ["eq", "ne", "is_null", "is_not_null"],
      valueSchema: {
        eq: { kind: "string" as const },
        ne: { kind: "string" as const },
        is_null: { kind: "none" as const },
        is_not_null: { kind: "none" as const }
      }
    },
    {
      path: "product.type",
      type: "string" as const,
      operators: ["eq", "ne", "is_null", "is_not_null"],
      valueSchema: {
        eq: { kind: "string" as const },
        ne: { kind: "string" as const },
        is_null: { kind: "none" as const },
        is_not_null: { kind: "none" as const }
      },
      example_values: ["internet", "mobile", "tv", "bundle"]
    },
    {
      path: "product.price",
      type: "number" as const,
      operators: ["eq", "ne", "lt", "lte", "gt", "gte", "between", "is_null", "is_not_null"],
      valueSchema: {
        eq: { kind: "number" as const },
        ne: { kind: "number" as const },
        lt: { kind: "number" as const },
        lte: { kind: "number" as const },
        gt: { kind: "number" as const },
        gte: { kind: "number" as const },
        between: {
          kind: "object" as const,
          fields: {
            from: { kind: "number" as const },
            to: { kind: "number" as const }
          }
        },
        is_null: { kind: "none" as const },
        is_not_null: { kind: "none" as const }
      }
    },
    {
      path: "product.active",
      type: "boolean" as const,
      operators: ["eq", "ne"],
      valueSchema: {
        eq: { kind: "boolean" as const },
        ne: { kind: "boolean" as const }
      }
    },
    {
      path: "product.created_date",
      type: "datetime" as const,
      operators: ["eq", "ne", "lt", "lte", "gt", "gte", "between", "is_null", "is_not_null"],
      valueSchema: {
        eq: { kind: "string" as const, format: "datetime" },
        ne: { kind: "string" as const, format: "datetime" },
        lt: { kind: "string" as const, format: "datetime" },
        lte: { kind: "string" as const, format: "datetime" },
        gt: { kind: "string" as const, format: "datetime" },
        gte: { kind: "string" as const, format: "datetime" },
        between: {
          kind: "object" as const,
          fields: {
            from: { kind: "string" as const, format: "datetime" },
            to: { kind: "string" as const, format: "datetime" }
          }
        },
        is_null: { kind: "none" as const },
        is_not_null: { kind: "none" as const }
      }
    }
  ],
  WORKFLOW: [
    {
      path: "workflow.name",
      type: "string" as const,
      operators: ["eq", "ne", "is_null", "is_not_null"],
      valueSchema: {
        eq: { kind: "string" as const },
        ne: { kind: "string" as const },
        is_null: { kind: "none" as const },
        is_not_null: { kind: "none" as const }
      }
    },
    {
      path: "workflow.status",
      type: "string" as const,
      operators: ["eq", "ne", "is_null", "is_not_null"],
      valueSchema: {
        eq: { kind: "string" as const },
        ne: { kind: "string" as const },
        is_null: { kind: "none" as const },
        is_not_null: { kind: "none" as const }
      },
      example_values: ["active", "inactive", "draft", "archived"]
    },
    {
      path: "workflow.created_by",
      type: "string" as const,
      operators: ["eq", "ne", "is_null", "is_not_null"],
      valueSchema: {
        eq: { kind: "string" as const },
        ne: { kind: "string" as const },
        is_null: { kind: "none" as const },
        is_not_null: { kind: "none" as const }
      }
    },
    {
      path: "workflow.version",
      type: "number" as const,
      operators: ["eq", "ne", "lt", "lte", "gt", "gte", "between"],
      valueSchema: {
        eq: { kind: "number" as const },
        ne: { kind: "number" as const },
        lt: { kind: "number" as const },
        lte: { kind: "number" as const },
        gt: { kind: "number" as const },
        gte: { kind: "number" as const },
        between: {
          kind: "object" as const,
          fields: {
            from: { kind: "number" as const },
            to: { kind: "number" as const }
          }
        }
      }
    }
  ],
  PROCESS: [
    {
      path: "process.workflow_name",
      type: "string" as const,
      operators: ["eq", "ne", "is_null", "is_not_null"],
      valueSchema: {
        eq: { kind: "string" as const },
        ne: { kind: "string" as const },
        is_null: { kind: "none" as const },
        is_not_null: { kind: "none" as const }
      }
    },
    {
      path: "process.status",
      type: "string" as const,
      operators: ["eq", "ne", "is_null", "is_not_null"],
      valueSchema: {
        eq: { kind: "string" as const },
        ne: { kind: "string" as const },
        is_null: { kind: "none" as const },
        is_not_null: { kind: "none" as const }
      },
      example_values: ["running", "completed", "failed", "pending", "cancelled"]
    },
    {
      path: "process.started_at",
      type: "datetime" as const,
      operators: ["eq", "ne", "lt", "lte", "gt", "gte", "between", "is_null", "is_not_null"],
      valueSchema: {
        eq: { kind: "string" as const, format: "datetime" },
        ne: { kind: "string" as const, format: "datetime" },
        lt: { kind: "string" as const, format: "datetime" },
        lte: { kind: "string" as const, format: "datetime" },
        gt: { kind: "string" as const, format: "datetime" },
        gte: { kind: "string" as const, format: "datetime" },
        between: {
          kind: "object" as const,
          fields: {
            from: { kind: "string" as const, format: "datetime" },
            to: { kind: "string" as const, format: "datetime" }
          }
        },
        is_null: { kind: "none" as const },
        is_not_null: { kind: "none" as const }
      }
    },
    {
      path: "process.priority",
      type: "number" as const,
      operators: ["eq", "ne", "lt", "lte", "gt", "gte", "between"],
      valueSchema: {
        eq: { kind: "number" as const },
        ne: { kind: "number" as const },
        lt: { kind: "number" as const },
        lte: { kind: "number" as const },
        gt: { kind: "number" as const },
        gte: { kind: "number" as const },
        between: {
          kind: "object" as const,
          fields: {
            from: { kind: "number" as const },
            to: { kind: "number" as const }
          }
        }
      }
    }
  ]
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const prefix = searchParams.get("prefix");
  const entityType = searchParams.get("entity_type");

  // Validate required parameters
  if (!prefix || !entityType) {
    return NextResponse.json(
      { error: "Missing required parameters: prefix and entity_type" },
      { status: 400 }
    );
  }

  // Validate entity type
  if (!["SUBSCRIPTION", "PRODUCT", "WORKFLOW", "PROCESS"].includes(entityType)) {
    return NextResponse.json(
      { error: "Invalid entity_type. Must be one of: SUBSCRIPTION, PRODUCT, WORKFLOW, PROCESS" },
      { status: 400 }
    );
  }

  // Get paths for the entity type
  const entityPaths = MOCK_PATHS[entityType as keyof typeof MOCK_PATHS] || [];

  // Filter paths that match the prefix (case-insensitive)
  // For better UX, prioritize paths that start with the prefix, then include paths that contain it
  const lowerPrefix = prefix.toLowerCase();
  const filteredPaths = entityPaths.filter(path => {
    const lowerPath = path.path.toLowerCase();
    return lowerPath.includes(lowerPrefix);
  }).sort((a, b) => {
    const aStartsWith = a.path.toLowerCase().startsWith(lowerPrefix);
    const bStartsWith = b.path.toLowerCase().startsWith(lowerPrefix);
    
    // Prioritize paths that start with the prefix
    if (aStartsWith && !bStartsWith) return -1;
    if (!aStartsWith && bStartsWith) return 1;
    
    // Then sort alphabetically
    return a.path.localeCompare(b.path);
  });

  // Simulate API delay for more realistic behavior
  await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));

  return NextResponse.json({
    prefix,
    paths: filteredPaths
  });
}
