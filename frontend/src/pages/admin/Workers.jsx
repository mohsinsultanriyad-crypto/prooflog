import { useEffect, useState } from "react";
import dayjs from "dayjs";
import NavAdmin from "../../components/NavAdmin";
import Card from "../../components/Card";
import { adminApi } from "../../lib/api";

export default function Workers() {
  const [month, setMonth] = useState(dayjs().format("YYYY-MM"));
  const [data, setData] = useState(null);
  const [salaryEdits, setSalaryEdits] = useState({});

  const load = async () => {
    const r = await adminApi({ url: `/api/admin/workers?month=${month}`, method: "GET" });
    setData(r.data);
  };

  useEffect(() => { load().catch(() => {}); }, [month]);

  const savePay = async (workerId) => {
    const basicSalary = Number(salaryEdits[workerId] || 1000);
    await adminApi({ url: `/api/admin/workers/${workerId}/pay`, method: "POST", data: { basicSalary } });
    alert("Saved");
    await load();
  };

  return (
    <div>
      <NavAdmin />
      <div className="mx-auto max-w-5xl p-4 space-y-4">
        <Card title="Workers + Performance">
          <label className="text-sm">Month</label>
          <input className="mt-1 rounded-xl border p-2" type="month" value={month} onChange={(e) => setMonth(e.target.value)} />

          {!data ? <div className="mt-3">Loading...</div> : (
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {data.workers.map((w) => (
                <div key={w.worker._id} className="rounded-2xl border p-3">
                  <div className="font-semibold">{w.worker.name || "(No name)"} — {w.worker.trade || "(No trade)"}</div>
                  <div className="text-sm text-gray-600">{w.worker.phone}</div>
                  <div className="mt-2 text-sm">
                    Present: <b>{w.performance.presentDays}</b> | Jobs: <b>{w.performance.jobsCompleted}</b> |
                    Invalid: <b>{w.performance.invalidLeaves}</b> | Score: <b>{w.performance.score}</b>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <input
                      className="w-full rounded-xl border p-2"
                      placeholder={`Basic salary (${w.pay.basicSalary})`}
                      value={salaryEdits[w.worker._id] ?? ""}
                      onChange={(e) => setSalaryEdits(s => ({ ...s, [w.worker._id]: e.target.value }))}
                    />
                    <button onClick={() => savePay(w.worker._id)} className="rounded-xl border px-3 py-2 text-sm font-semibold">Save</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
