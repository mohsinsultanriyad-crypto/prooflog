import { useEffect, useState } from "react";
import dayjs from "dayjs";
import NavAdmin from "../../components/NavAdmin";
import Card from "../../components/Card";
import { adminApi } from "../../lib/api";

export default function Sessions() {
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [data, setData] = useState(null);

  const load = async () => {
    const r = await adminApi({ url: `/api/admin/sessions?dutyDate=${date}`, method: "GET" });
    setData(r.data.sessions);
  };

  useEffect(() => { load().catch(() => {}); }, [date]);

  const override = async (id, approveEnd) => {
    const note = prompt("Override note (GPS inaccurate etc.)", "Approved by admin");
    await adminApi({ url: `/api/admin/sessions/${id}/override`, method: "POST", data: { approveEnd, note } });
    await load();
    alert("Override saved");
  };

  return (
    <div>
      <NavAdmin />
      <div className="mx-auto max-w-5xl p-4 space-y-4">
        <Card title="Work Sessions (GPS Override)">
          <input className="rounded-xl border p-2" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          {!data ? <div className="mt-3">Loading...</div> : (
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {data.map(s => (
                <div key={s._id} className="rounded-2xl border p-3">
                  <div className="font-semibold">{s.workerId?.name || s.workerId?.phone}</div>
                  <div className="text-sm">{s.siteId?.name} | {s.status}</div>
                  <div className="text-sm mt-1">OT: {s.extraOtHours}</div>
                  {s.endProofUrl ? <a className="text-sm underline" href={s.endProofUrl} target="_blank">End Proof</a> : <div className="text-sm">No proof</div>}
                  <div className="text-xs text-gray-600 mt-1">OverrideEndApproved: {String(s.overrideEndApproved)}</div>
                  {!s.overrideEndApproved ? (
                    <button onClick={() => override(s._id, true)} className="mt-2 rounded-xl border px-3 py-2 text-sm font-semibold">
                      Approve End (Override)
                    </button>
                  ) : null}
                  {s.overrideNote ? <div className="mt-2 text-xs text-gray-600">{s.overrideNote}</div> : null}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
