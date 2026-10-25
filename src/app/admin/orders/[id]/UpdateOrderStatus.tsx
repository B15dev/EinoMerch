"use client";

import { useState, useTransition } from "react";
import { updateOrderStatus } from "@/actions/admin";
import { useRouter } from "next/navigation";

const OPTIONS: Record<string, string[]> = {
  PENDING: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED", "CANCELLED"],
};

export default function UpdateOrderStatus({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: string;
}) {
  const options = OPTIONS[currentStatus] || [];
  const [status, setStatus] = useState(options[0] || "");
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");
  const router = useRouter();

  if (options.length === 0) {
    return <p style={{ fontSize: 13, color: "var(--text-faint)" }}>No further transitions</p>;
  }

  return (
    <div>
      <select
        className="form-select"
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        style={{ marginBottom: 8 }}
      >
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
      <button
        className="btn btn-primary btn-sm"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await updateOrderStatus(orderId, status);
            if (res.error) setMsg(res.error);
            else {
              setMsg("Updated");
              router.refresh();
            }
          })
        }
      >
        {pending ? "Updating..." : "Update Status"}
      </button>
      {msg && <p style={{ fontSize: 13, marginTop: 8 }}>{msg}</p>}
    </div>
  );
}
