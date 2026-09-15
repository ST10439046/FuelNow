import { useEffect, useMemo, useState } from "react";
import {
  orderRepository,
  type OrderModel as Order,
} from "../repositories/OrderRepository";
import Card from "../components/Card";
import DataTable, { type Column } from "../components/DataTable";
import StatusBadge from "../components/StatusBadge";
import Button from "../components/Button";
import Input from "../components/Input";

const PAGE_SIZE = 10;

function fmtZAR(n: number | null | undefined) {
  const amount = Number(n ?? 0);

  return (
    "R " +
    amount.toLocaleString("en-ZA", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) {
    return "N/A";
  }

  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return date.toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --------------------------------------------------------------------------
  // LOAD ORDERS
  // --------------------------------------------------------------------------

  useEffect(() => {
    let mounted = true;

    async function loadOrders() {
      try {
        setLoading(true);
        setError(null);

        const data = await orderRepository.getAllAdminOrders();

        if (mounted) {
          setOrders(data);
        }
      } catch (err) {
        console.error("OrdersScreen: failed to load orders:", err);

        if (mounted) {
          setError("Failed to load orders. Please try again.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadOrders();

    return () => {
      mounted = false;
    };
  }, []);

  // --------------------------------------------------------------------------
  // FILTER
  // --------------------------------------------------------------------------

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesSearch =
        !query ||
        order.orderNumber.toLowerCase().includes(query) ||
        (order.customerName ?? "").toLowerCase().includes(query) ||
        (order.phone ?? "").toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all" || order.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  // --------------------------------------------------------------------------
  // RESET PAGE WHEN FILTER CHANGES
  // --------------------------------------------------------------------------

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  // --------------------------------------------------------------------------
  // PAGINATION
  // --------------------------------------------------------------------------

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const safePage = Math.min(currentPage, totalPages);

  const startIndex = (safePage - 1) * PAGE_SIZE;

  const paginatedOrders = filtered.slice(startIndex, startIndex + PAGE_SIZE);

  // --------------------------------------------------------------------------
  // TABLE COLUMNS
  // --------------------------------------------------------------------------

  const columns: Column<Order>[] = [
    {
      key: "orderNumber",
      label: "Order ID",
      sortable: true,
    },

    {
      key: "customerName",
      label: "Customer",
      sortable: true,

      render: (_, row) => (
        <div>
          <div
            style={{
              fontWeight: 600,
            }}
          >
            {row.customerName || "Unknown Customer"}
          </div>

          <div
            style={{
              fontSize: 11,
              color: "var(--ink-faint)",
              marginTop: 2,
            }}
          >
            {row.phone || "No phone"}
          </div>
        </div>
      ),
    },

    {
      key: "fuelType",
      label: "Fuel & Vol",

      render: (_, row) => `${row.item.fuelType} (${row.item.litres}L)`,
    },

    {
      key: "totalAmount",
      label: "Amount",
      sortable: true,

      render: (v) => (
        <span
          style={{
            fontWeight: 600,
          }}
        >
          {fmtZAR(v)}
        </span>
      ),
    },

    {
      key: "status",
      label: "Status",

      render: (v) => <StatusBadge status={v} />,
    },

    {
      key: "driverName",
      label: "Driver",

      render: (v) =>
        v || (
          <span
            style={{
              color: "var(--ink-faint)",
            }}
          >
            Unassigned
          </span>
        ),
    },

    {
      key: "createdAt",
      label: "Placed Date",
      sortable: true,

      render: (v) => fmtDate(v),
    },
  ];

  // --------------------------------------------------------------------------
  // EXPORT
  // --------------------------------------------------------------------------

  const handleExport = () => {
    const headers = [
      "Order ID",
      "Customer Name",
      "Phone",
      "Fuel Type",
      "Litres",
      "Total (ZAR)",
      "Status",
      "Driver",
      "Placed At",
    ];

    const rows = filtered.map((order) => [
      order.orderNumber,
      `"${order.customerName ?? ""}"`,
      `"${order.phone ?? ""}"`,
      order.item.fuelType,
      order.item.litres,
      order.totalAmount.toFixed(2),
      order.status,
      `"${order.driverName || "Unassigned"}"`,
      order.createdAt,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);

    const link = document.createElement("a");

    link.setAttribute("href", encodedUri);

    link.setAttribute(
      "download",
      `fuelnow_orders_export_${new Date().toISOString().slice(0, 10)}.csv`,
    );

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);
  };

  // --------------------------------------------------------------------------
  // PAGE NAVIGATION
  // --------------------------------------------------------------------------

  const goToPreviousPage = () => {
    setCurrentPage((page) => Math.max(1, page - 1));
  };

  const goToNextPage = () => {
    setCurrentPage((page) => Math.min(totalPages, page + 1));
  };

  // --------------------------------------------------------------------------
  // RENDER
  // --------------------------------------------------------------------------

  return (
    <div
      style={{
        animation: "fadeIn 0.3s ease",
      }}
    >
      <Card padding={0}>
        {/* ---------------------------------------------------------------- */}
        {/* HEADER                                                           */}
        {/* ---------------------------------------------------------------- */}

        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--divider)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 16,
              flex: 1,
              minWidth: 300,
            }}
          >
            <Input
              placeholder="Search by ID, name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon="🔍"
              style={{
                width: 280,
              }}
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: "10px 14px",
                borderRadius: "var(--radius-md)",
                border: "1.5px solid var(--divider)",
                background: "var(--white)",
                color: "var(--charcoal-ink)",
                fontSize: 14,
                outline: "none",
              }}
            >
              <option value="all">All Statuses</option>

              <option value="PENDING_PAYMENT">Pending Payment</option>

              <option value="PAID">Paid</option>

              <option value="FINDING_DRIVER">Finding Driver</option>

              <option value="ACCEPTED">Accepted</option>

              <option value="NAVIGATING">En Route</option>

              <option value="ARRIVED">Arrived</option>

              <option value="DISPENSING">Dispensing</option>

              <option value="COMPLETED">Completed</option>

              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <Button variant="outline" icon="⬇️" onClick={handleExport}>
            Export to Excel / CSV
          </Button>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* ERROR                                                            */}
        {/* ---------------------------------------------------------------- */}

        {error && (
          <div
            style={{
              padding: "16px 24px",
              color: "var(--danger)",
              borderBottom: "1px solid var(--divider)",
            }}
          >
            {error}
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* TABLE                                                            */}
        {/* ---------------------------------------------------------------- */}

        {loading ? (
          <div
            style={{
              padding: 48,
              textAlign: "center",
              color: "var(--ink-faint)",
            }}
          >
            Loading orders...
          </div>
        ) : (
          <>
            <DataTable columns={columns} data={paginatedOrders} rowKey="id" />

            {/* ------------------------------------------------------------ */}
            {/* PAGINATION                                                   */}
            {/* ------------------------------------------------------------ */}

            <div
              style={{
                padding: "16px 24px",
                borderTop: "1px solid var(--divider)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  color: "var(--ink-faint)",
                }}
              >
                {filtered.length === 0
                  ? "No orders found"
                  : `Showing ${startIndex + 1}-${Math.min(
                      startIndex + PAGE_SIZE,
                      filtered.length,
                    )} of ${filtered.length} orders`}
              </span>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <Button
                  variant="outline"
                  onClick={goToPreviousPage}
                  disabled={safePage === 1}
                >
                  Previous
                </Button>

                <span
                  style={{
                    fontSize: 13,
                    minWidth: 80,
                    textAlign: "center",
                  }}
                >
                  Page {safePage} of {totalPages}
                </span>

                <Button
                  variant="outline"
                  onClick={goToNextPage}
                  disabled={safePage >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
