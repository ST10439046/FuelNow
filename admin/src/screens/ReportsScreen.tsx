import { useState } from "react";
import * as XLSX from "xlsx";
import Card from "../components/Card";
import Button from "../components/Button";
import Input from "../components/Input";
import { supabase } from "../services/supabase";

type Dataset = "financial" | "driver";

interface FinancialRow {
  orderId: string;
  orderStatus: string;
  orderMethod: string;
  deliveryType: string;
  fuelType: string;
  litres: number;
  fuelSubtotal: number;
  deliveryFee: number;
  serviceFee: number;
  vatAmount: number;
  totalAmount: number;
  paymentStatus: string;
  placedAt: string;
  deliveredAt: string;
}

interface DriverRow {
  driverId: string;
  driverName: string;
  phone: string;
  licenceNumber: string;
  zone: string;
  province: string;
  driverStatus: string;
  rating: number;
  orders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalLitres: number;
  totalRevenue: number;
  reviews: number;
  averageReviewRating: number;
  sosIncidents: number;
}

function formatZAR(value: number) {
  return `R ${Number(value || 0).toLocaleString("en-ZA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString("en-ZA");
}

function escapeCsv(value: unknown) {
  const text = String(value ?? "");

  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

function downloadBlob(content: BlobPart, fileName: string, type: string) {
  const blob = new Blob([content], {
    type,
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

function downloadCsv(rows: Record<string, unknown>[], fileName: string) {
  if (rows.length === 0) {
    throw new Error("There is no data available for the selected date range.");
  }

  const headers = Object.keys(rows[0]);

  const csv = [
    headers.map(escapeCsv).join(","),
    ...rows.map((row) =>
      headers.map((header) => escapeCsv(row[header])).join(","),
    ),
  ].join("\n");

  downloadBlob("\uFEFF" + csv, fileName, "text/csv;charset=utf-8;");
}

function downloadExcel(rows: Record<string, unknown>[], fileName: string) {
  if (rows.length === 0) {
    throw new Error("There is no data available for the selected date range.");
  }

  const worksheet = XLSX.utils.json_to_sheet(rows);

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Report");

  XLSX.writeFile(workbook, fileName);
}

export default function ReportsScreen() {
  const today = new Date().toISOString().split("T")[0];

  const [fromDate, setFromDate] = useState(`${new Date().getFullYear()}-01-01`);

  const [toDate, setToDate] = useState(today);

  const [dataset, setDataset] = useState<Dataset>("financial");

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [success, setSuccess] = useState<string | null>(null);

  const [recordCount, setRecordCount] = useState<number | null>(null);

  const validateDates = () => {
    if (!fromDate || !toDate) {
      setError("Please select both a start date and an end date.");

      return false;
    }

    if (fromDate > toDate) {
      setError("The start date cannot be after the end date.");

      return false;
    }

    return true;
  };

  const getDateRange = () => {
    const start = new Date(`${fromDate}T00:00:00`);

    const end = new Date(`${toDate}T23:59:59.999`);

    return {
      start: start.toISOString(),
      end: end.toISOString(),
    };
  };

  const fetchFinancialReport = async (): Promise<FinancialRow[]> => {
    const { start, end } = getDateRange();

    const [ordersResult, paymentsResult, fuelTypesResult] = await Promise.all([
      supabase
        .from("orders")
        .select(
          `
            order_id,
            order_method,
            delivery_type,
            volume_litres,
            rand_amount,
            status,
            placed_at,
            delivered_at,
            fuel_type_id
          `,
        )
        .gte("placed_at", start)
        .lte("placed_at", end)
        .order("placed_at", {
          ascending: true,
        }),

      supabase
        .from("payments")
        .select(
          `
            order_id,
            fuel_subtotal,
            delivery_fee,
            service_fee,
            vat_amount,
            total_amount,
            status,
            charged_at
          `,
        )
        .gte("charged_at", start)
        .lte("charged_at", end),

      supabase.from("fuel_types").select(`
            fuel_type_id,
            name
          `),
    ]);

    if (ordersResult.error) {
      throw ordersResult.error;
    }

    if (paymentsResult.error) {
      throw paymentsResult.error;
    }

    if (fuelTypesResult.error) {
      throw fuelTypesResult.error;
    }

    const fuelMap = new Map<string, string>();

    for (const fuel of fuelTypesResult.data ?? []) {
      fuelMap.set(fuel.fuel_type_id, fuel.name);
    }

    const paymentMap = new Map<string, any>();

    for (const payment of paymentsResult.data ?? []) {
      paymentMap.set(payment.order_id, payment);
    }

    return (ordersResult.data ?? []).map((order: any) => {
      const payment = paymentMap.get(order.order_id);

      return {
        orderId: order.order_id,

        orderStatus: order.status ?? "",

        orderMethod: order.order_method ?? "",

        deliveryType: order.delivery_type ?? "",

        fuelType: fuelMap.get(order.fuel_type_id) ?? "Unknown Fuel",

        litres: Number(order.volume_litres ?? 0),

        fuelSubtotal: Number(payment?.fuel_subtotal ?? order.rand_amount ?? 0),

        deliveryFee: Number(payment?.delivery_fee ?? 0),

        serviceFee: Number(payment?.service_fee ?? 0),

        vatAmount: Number(payment?.vat_amount ?? 0),

        totalAmount: Number(payment?.total_amount ?? order.rand_amount ?? 0),

        paymentStatus: payment?.status ?? "No Payment Record",

        placedAt: formatDate(order.placed_at),

        deliveredAt: formatDate(order.delivered_at),
      };
    });
  };

  const fetchDriverReport = async (): Promise<DriverRow[]> => {
    const { start, end } = getDateRange();

    const [driversResult, ordersResult, reviewsResult, sosResult] =
      await Promise.all([
        supabase.from("drivers").select(`
            driver_id,
            licence_number,
            rating,
            status,
            zone,
            province,
            users (
              full_name,
              phone_number
            )
          `),

        supabase
          .from("orders")
          .select(
            `
            order_id,
            driver_id,
            volume_litres,
            rand_amount,
            status
          `,
          )
          .not("driver_id", "is", null)
          .gte("placed_at", start)
          .lte("placed_at", end),

        supabase
          .from("reviews")
          .select(
            `
            review_id,
            driver_id,
            rating
          `,
          )
          .gte("created_at", start)
          .lte("created_at", end),

        supabase
          .from("sos_alerts")
          .select(
            `
            alert_id,
            driver_id
          `,
          )
          .gte("reported_at", start)
          .lte("reported_at", end),
      ]);

    if (driversResult.error) {
      throw driversResult.error;
    }

    if (ordersResult.error) {
      throw ordersResult.error;
    }

    if (reviewsResult.error) {
      throw reviewsResult.error;
    }

    if (sosResult.error) {
      throw sosResult.error;
    }

    const ordersByDriver = new Map<string, any[]>();

    for (const order of ordersResult.data ?? []) {
      if (!order.driver_id) {
        continue;
      }

      const existing = ordersByDriver.get(order.driver_id) ?? [];

      existing.push(order);

      ordersByDriver.set(order.driver_id, existing);
    }

    const reviewsByDriver = new Map<string, any[]>();

    for (const review of reviewsResult.data ?? []) {
      const existing = reviewsByDriver.get(review.driver_id) ?? [];

      existing.push(review);

      reviewsByDriver.set(review.driver_id, existing);
    }

    const sosByDriver = new Map<string, number>();

    for (const alert of sosResult.data ?? []) {
      sosByDriver.set(
        alert.driver_id,
        (sosByDriver.get(alert.driver_id) ?? 0) + 1,
      );
    }

    return (driversResult.data ?? []).map((driver: any) => {
      const orders = ordersByDriver.get(driver.driver_id) ?? [];

      const reviews = reviewsByDriver.get(driver.driver_id) ?? [];

      const completedOrders = orders.filter(
        (order) => order.status === "COMPLETED",
      ).length;

      const cancelledOrders = orders.filter(
        (order) => order.status === "CANCELLED" || order.status === "CANCELED",
      ).length;

      const totalLitres = orders.reduce(
        (total, order) => total + Number(order.volume_litres ?? 0),
        0,
      );

      const totalRevenue = orders.reduce(
        (total, order) => total + Number(order.rand_amount ?? 0),
        0,
      );

      const averageReviewRating =
        reviews.length > 0
          ? reviews.reduce(
              (total, review) => total + Number(review.rating ?? 0),
              0,
            ) / reviews.length
          : 0;

      return {
        driverId: driver.driver_id,

        driverName: driver.users?.full_name ?? "Unknown Driver",

        phone: driver.users?.phone_number ?? "",

        licenceNumber: driver.licence_number ?? "",

        zone: driver.zone ?? "",

        province: driver.province ?? "",

        driverStatus: driver.status ?? "",

        rating: Number(driver.rating ?? 0),

        orders: orders.length,

        completedOrders,

        cancelledOrders,

        totalLitres,

        totalRevenue,

        reviews: reviews.length,

        averageReviewRating,

        sosIncidents: sosByDriver.get(driver.driver_id) ?? 0,
      };
    });
  };

  const generateReport = async (): Promise<Record<string, unknown>[]> => {
    if (!validateDates()) {
      throw new Error("Invalid date range.");
    }

    if (dataset === "financial") {
      const data = await fetchFinancialReport();

      return data.map((row) => ({
        "Order ID": row.orderId,

        "Order Status": row.orderStatus,

        "Order Method": row.orderMethod,

        "Delivery Type": row.deliveryType,

        "Fuel Type": row.fuelType,

        Litres: row.litres,

        "Fuel Subtotal (ZAR)": row.fuelSubtotal,

        "Delivery Fee (ZAR)": row.deliveryFee,

        "Service Fee (ZAR)": row.serviceFee,

        "VAT (ZAR)": row.vatAmount,

        "Total Amount (ZAR)": row.totalAmount,

        "Payment Status": row.paymentStatus,

        "Placed At": row.placedAt,

        "Delivered At": row.deliveredAt,
      }));
    }

    const data = await fetchDriverReport();

    return data.map((row) => ({
      "Driver ID": row.driverId,

      "Driver Name": row.driverName,

      Phone: row.phone,

      "Licence Number": row.licenceNumber,

      Zone: row.zone,

      Province: row.province,

      "Driver Status": row.driverStatus,

      "Driver Rating": Number(row.rating.toFixed(2)),

      Orders: row.orders,

      "Completed Orders": row.completedOrders,

      "Cancelled Orders": row.cancelledOrders,

      "Fuel Delivered (L)": Number(row.totalLitres.toFixed(2)),

      "Order Revenue (ZAR)": Number(row.totalRevenue.toFixed(2)),

      Reviews: row.reviews,

      "Average Review Rating": Number(row.averageReviewRating.toFixed(2)),

      "SOS Incidents": row.sosIncidents,
    }));
  };

  const handleExport = async (format: "csv" | "xlsx") => {
    setError(null);
    setSuccess(null);
    setRecordCount(null);

    if (!validateDates()) {
      return;
    }

    try {
      setLoading(true);

      const rows = await generateReport();

      setRecordCount(rows.length);

      if (rows.length === 0) {
        throw new Error("No records were found for the selected date range.");
      }

      const prefix =
        dataset === "financial"
          ? "fuelnow_financial_ledger"
          : "fuelnow_driver_performance";

      const dateSuffix = `${fromDate}_to_${toDate}`;

      if (format === "csv") {
        downloadCsv(rows, `${prefix}_${dateSuffix}.csv`);
      } else {
        downloadExcel(rows, `${prefix}_${dateSuffix}.xlsx`);
      }

      setSuccess(
        `${rows.length} record${
          rows.length === 1 ? "" : "s"
        } exported successfully.`,
      );
    } catch (err) {
      console.error("Report generation failed:", err);

      setError(
        err instanceof Error ? err.message : "Failed to generate report.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        animation: "fadeIn 0.3s ease",
        maxWidth: 800,
      }}
    >
      <Card>
        <h2
          style={{
            fontSize: 20,
            fontWeight: 700,
            marginBottom: 8,
          }}
        >
          Export System Reports
        </h2>

        <p
          style={{
            color: "var(--ink-light)",
            fontSize: 14,
            marginBottom: 32,
            lineHeight: 1.5,
          }}
        >
          Generate aggregated data reports for accounting and compliance. Select
          a date range and the required dataset.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 20,
            marginBottom: 28,
          }}
        >
          <Input
            type="date"
            label="Start Date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />

          <Input
            type="date"
            label="End Date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>

        <div
          style={{
            marginBottom: 32,
          }}
        >
          <label
            style={{
              display: "block",
              fontSize: 13,
              fontWeight: 600,
              color: "var(--ink-light)",
              marginBottom: 12,
            }}
          >
            Select Dataset
          </label>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: 16,
                border:
                  dataset === "financial"
                    ? "1px solid var(--petrol-deep)"
                    : "1px solid var(--divider)",
                borderRadius: "var(--radius-md)",
                background:
                  dataset === "financial"
                    ? "var(--petrol-faint)"
                    : "transparent",
                cursor: "pointer",
              }}
            >
              <input
                type="radio"
                name="dataset"
                checked={dataset === "financial"}
                onChange={() => setDataset("financial")}
                style={{
                  accentColor: "var(--petrol-deep)",
                  transform: "scale(1.2)",
                }}
              />

              <div>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: 14,
                    color:
                      dataset === "financial"
                        ? "var(--petrol-deep)"
                        : "var(--charcoal-ink)",
                  }}
                >
                  Complete Financial Ledger (Orders)
                </div>

                <div
                  style={{
                    fontSize: 12,
                    color: "var(--ink-light)",
                    marginTop: 2,
                  }}
                >
                  Includes order statuses, fuel volumes, revenue, delivery fees,
                  service fees, VAT, and payment status.
                </div>
              </div>
            </label>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: 16,
                border:
                  dataset === "driver"
                    ? "1px solid var(--petrol-deep)"
                    : "1px solid var(--divider)",
                borderRadius: "var(--radius-md)",
                background:
                  dataset === "driver" ? "var(--petrol-faint)" : "transparent",
                cursor: "pointer",
              }}
            >
              <input
                type="radio"
                name="dataset"
                checked={dataset === "driver"}
                onChange={() => setDataset("driver")}
                style={{
                  accentColor: "var(--petrol-deep)",
                  transform: "scale(1.2)",
                }}
              />

              <div>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: 14,
                    color:
                      dataset === "driver"
                        ? "var(--petrol-deep)"
                        : "var(--charcoal-ink)",
                  }}
                >
                  Driver Performance & Earnings
                </div>

                <div
                  style={{
                    fontSize: 12,
                    color: "var(--ink-light)",
                    marginTop: 2,
                  }}
                >
                  Breakdown of orders, completed deliveries, fuel delivered,
                  revenue, ratings, reviews, and SOS incidents.
                </div>
              </div>
            </label>
          </div>
        </div>

        {error && (
          <div
            style={{
              marginBottom: 20,
              padding: 14,
              borderRadius: "var(--radius-md)",
              background: "var(--red-light)",
              color: "var(--signal-red)",
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            style={{
              marginBottom: 20,
              padding: 14,
              borderRadius: "var(--radius-md)",
              background: "var(--petrol-faint)",
              color: "var(--petrol-deep)",
              fontSize: 13,
            }}
          >
            {success}
          </div>
        )}

        {recordCount !== null && (
          <div
            style={{
              marginBottom: 20,
              fontSize: 13,
              color: "var(--ink-light)",
            }}
          >
            Last generated report: <strong>{recordCount}</strong> records
          </div>
        )}

        <div
          style={{
            display: "flex",
            gap: 16,
          }}
        >
          <Button
            icon="⬇️"
            onClick={() => handleExport("csv")}
            loading={loading}
          >
            Download CSV
          </Button>

          <Button
            variant="outline"
            icon="📊"
            onClick={() => handleExport("xlsx")}
            disabled={loading}
          >
            Export to Excel (.xlsx)
          </Button>
        </div>
      </Card>
    </div>
  );
}
