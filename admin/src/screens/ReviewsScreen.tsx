import { useEffect, useState } from "react";
import {
  reviewRepository,
  type ReviewModel as Review,
} from "../repositories/ReviewRepository";
import Card from "../components/Card";
import DataTable, { type Column } from "../components/DataTable";
import StatusBadge from "../components/StatusBadge";
import Button from "../components/Button";

export default function ReviewsScreen() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filter, setFilter] = useState<"all" | "flagged">("all");
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchReviews = async () => {
    const data = await reviewRepository.getReviews();
    setReviews(data);
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const filtered =
    filter === "flagged" ? reviews.filter((r) => r.flagged) : reviews;

  const handleAction = async (id: string, action: "approve" | "remove") => {
    try {
      setProcessing(id);

      if (action === "remove") {
        await reviewRepository.deleteReview(id);
      } else {
        await reviewRepository.setReviewFlag(id, false);
      }

      await fetchReviews();
    } catch (error) {
      console.error(`Failed to ${action} review:`, error);

      window.alert(`Failed to ${action} the review. Please try again.`);
    } finally {
      setProcessing(null);
    }
  };

  const handleFlag = async (id: string) => {
    try {
      setProcessing(id);

      await reviewRepository.setReviewFlag(id, true);

      await fetchReviews();
    } catch (error) {
      console.error("Failed to flag review:", error);

      window.alert("Failed to flag the review. Please try again.");
    } finally {
      setProcessing(null);
    }
  };

  const columns: Column<Review>[] = [
    {
      key: "orderId",
      label: "Order ID",
    },

    {
      key: "date",
      label: "Date",
      render: (v) => new Date(v).toLocaleDateString("en-ZA"),
    },

    {
      key: "rating",
      label: "Rating",
      render: (v) => (
        <span
          style={{
            color: v <= 2 ? "var(--signal-red)" : "var(--ignition-amber)",
            fontWeight: 600,
          }}
        >
          {"⭐".repeat(v)}
          {"☆".repeat(5 - v)}
        </span>
      ),
    },

    {
      key: "comment",
      label: "Review Comment",
      width: "40%",
      render: (v, row) => (
        <div style={{ lineHeight: 1.4 }}>
          <div
            style={{
              fontWeight: 600,
              fontSize: 13,
              color: "var(--ink-light)",
              marginBottom: 2,
            }}
          >
            {row.customerName} to {row.driverName}
          </div>

          <div>"{v}"</div>
        </div>
      ),
    },

    {
      key: "flagged",
      label: "Status",
      render: (v) =>
        v ? (
          <StatusBadge status="flagged" customLabel="Flagged for Review" />
        ) : (
          <span
            style={{
              color: "var(--ink-faint)",
            }}
          >
            Published
          </span>
        ),
    },

    {
      key: "actions",
      label: "",
      render: (_, row) =>
        row.flagged ? (
          <div
            style={{
              display: "flex",
              gap: 8,
            }}
          >
            <Button
              size="sm"
              variant="outline"
              loading={processing === row.id}
              onClick={() => handleAction(row.id, "approve")}
            >
              Approve
            </Button>

            <Button
              size="sm"
              variant="danger"
              loading={processing === row.id}
              onClick={() => handleAction(row.id, "remove")}
            >
              Remove
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            variant="ghost"
            loading={processing === row.id}
            onClick={() => handleFlag(row.id)}
          >
            Flag
          </Button>
        ),
    },
  ];

  return (
    <div
      style={{
        animation: "fadeIn 0.3s ease",
      }}
    >
      <Card padding={0}>
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--divider)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 12,
            }}
          >
            <Button
              variant={filter === "all" ? "primary" : "ghost"}
              onClick={() => setFilter("all")}
            >
              All Reviews
            </Button>

            <Button
              variant={filter === "flagged" ? "danger" : "ghost"}
              onClick={() => setFilter("flagged")}
            >
              Needs Moderation ({reviews.filter((r) => r.flagged).length})
            </Button>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filtered}
          rowKey="id"
          emptyMessage="No reviews match the current filter."
        />
      </Card>
    </div>
  );
}
