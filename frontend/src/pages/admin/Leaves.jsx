import { useEffect, useState } from "react";
import NavAdmin from "../../components/NavAdmin";
import Card from "../../components/Card";
import { adminApi } from "../../lib/api";

export default function Leaves() {
  const [status, setStatus] = useState("PENDING");
  const [list, setList] = useState([]);

  const load = async () => {
    const r = await adminApi({ url: `/api/admin/leaves?status=${status}`, method: "GET" });
    setList(r.data.leaves);
  };

  useEffect(() => { load().catch(() => {}); }, [status]);

  const approve = async (id) => { await adminApi({ url: `/api/admin/leaves/${id}/approve`, method: "POST" }); await load(); };
  const reject = async (id) => { await adminApi({ url: `/api/admin/leaves/${id}/reject`, method: "POST" }); await load(); };

  return (
    <div>
      <NavAdmin />
      <div className="mx-auto max-w-5xl p-4 space-y-4">
        <Card title="Leaves Approvals">
          <select className="rounded-xl border p-2" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {list.map(l => (
              <div key={l._id} className="rounded-2xl border p-3">
                <div className="font-semibold">{l.workerId?.name || l.workerId?.phone}</div>
                <div className="text-sm">{l.date} | <b>{l.type}</b> | {l.status}</div>
                <div className="text-sm mt-1">{l.reasonText || "-"}</div>
                {l.proofUrl ? <a className="text-sm underline" href={l.proofUrl} target="_blank">View Proof</a> : null}

                {status === "PENDING" ? (
                  <div className="mt-2 flex gap-2">
                    <button onClick={() => approve(l._id)} className="rounded-xl border px-3 py-2 text-sm font-semibold">Approve</button>
                    <button onClick={() => reject(l._id)} className="rounded-xl border px-3 py-2 text-sm font-semibold">Reject</button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
