import { useEffect, useState } from "react";
import dayjs from "dayjs";
import NavAdmin from "../../components/NavAdmin";
import Card from "../../components/Card";
import { adminApi } from "../../lib/api";

export default function Salary() {
  const [month, setMonth] = useState(dayjs().format("YYYY-MM"));
  const [data, setData] = useState(null);

  const load = async () => {
    const r = await adminApi({ url: `/api/admin/salary-sheet?month=${month}`, method: "GET" });
    setData(r.data);
  };

  useEffect(() => { load().catch(() => {}); }, [month]);

  return (
    <div>
      <NavAdmin />
      <div className="mx-auto max-w-5xl p-4 space-y-4">
        <Card title="Salary Sheet">
          <input className="rounded-xl border p-2" type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
          {!data ? <div className="mt-3">Loading...</div> : (
            <div className="mt-3 overflow-auto">
              <table className="min-w-[900px] w-full border text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="p-2 text-left">Name</th>
                    <th className="p-2">Trade</th>
                    <th className="p-2">Present</th>
                    <th className="p-2">Basic</th>
                    <th className="p-2">OT Hours</th>
                    <th className="p-2">OT Pay</th>
                    <th className="p-2">Invalid</th>
                    <th className="p-2">Penalty</th>
                    <th className="p-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.sheet.map(r => (
                    <tr key={r.workerId} className="border-b">
                      <td className="p-2">{r.name || r.phone}</td>
                      <td className="p-2 text-center">{r.trade || "-"}</td>
                      <td className="p-2 text-center">{r.presentDays}</td>
                      <td className="p-2 text-center">{r.basicSalary}</td>
                      <td className="p-2 text-center">{r.totalOtHours}</td>
                      <td className="p-2 text-center">{r.otPay}</td>
                      <td className="p-2 text-center">{r.invalidLeaves}</td>
                      <td className="p-2 text-center">{r.penalty}</td>
                      <td className="p-2 text-center font-semibold">{r.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-2 text-xs text-gray-600">
                Note: Export to Excel/PDF can be added next (backend already provides JSON sheet).
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
