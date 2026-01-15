import { useEffect, useState } from "react";
import dayjs from "dayjs";
import NavAdmin from "../../components/NavAdmin";
import Card from "../../components/Card";
import { adminApi } from "../../lib/api";

export default function Assign() {
  const [workers, setWorkers] = useState([]);
  const [sites, setSites] = useState([]);
  const [dutyDate, setDutyDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [workerId, setWorkerId] = useState("");
  const [siteId, setSiteId] = useState("");
  const [notes, setNotes] = useState("");
  const [list, setList] = useState([]);

  const load = async () => {
    const w = await adminApi({ url: "/api/admin/workers", method: "GET" });
    setWorkers(w.data.workers.map(x => x.worker));
    const s = await adminApi({ url: "/api/admin/sites", method: "GET" });
    setSites(s.data.sites);
    const a = await adminApi({ url: `/api/admin/assignments?dutyDate=${dutyDate}`, method: "GET" });
    setList(a.data.assignments);
  };

  useEffect(() => { load().catch(() => {}); }, [dutyDate]);

  const assign = async () => {
    if (!workerId || !siteId) return alert("Select worker & site");
    await adminApi({ url: "/api/admin/assign", method: "POST", data: { workerId, siteId, dutyDate, notes } });
    setNotes("");
    await load();
    alert("Assigned");
  };

  return (
    <div>
      <NavAdmin />
      <div className="mx-auto max-w-5xl p-4 space-y-4">
        <Card title="Assign Jobs (Night Planning)">
          <label className="text-sm">Duty Date</label>
          <input className="mt-1 rounded-xl border p-2" type="date" value={dutyDate} onChange={(e) => setDutyDate(e.target.value)} />

          <div className="mt-3 grid gap-2 md:grid-cols-3">
            <select className="rounded-xl border p-2" value={workerId} onChange={(e) => setWorkerId(e.target.value)}>
              <option value="">Select Worker</option>
              {workers.map(w => <option key={w._id} value={w._id}>{w.name || w.phone} ({w.trade || "-"})</option>)}
            </select>

            <select className="rounded-xl border p-2" value={siteId} onChange={(e) => setSiteId(e.target.value)}>
              <option value="">Select Site</option>
              {sites.map(s => <option key={s._id} value={s._id}>{s.name} ({s.city})</option>)}
            </select>

            <button onClick={assign} className="rounded-xl border p-2 font-semibold">Assign</button>
          </div>

          <label className="mt-3 block text-sm">Notes</label>
          <textarea className="mt-1 w-full rounded-xl border p-2" value={notes} onChange={(e) => setNotes(e.target.value)} />

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {list.map(a => (
              <div key={a._id} className="rounded-2xl border p-3">
                <div className="font-semibold">{a.workerId?.name || a.workerId?.phone} → {a.siteId?.name}</div>
                <div className="text-sm text-gray-600">{a.siteId?.city} | {a.status}</div>
                <div className="text-sm mt-1">{a.notes || "-"}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
