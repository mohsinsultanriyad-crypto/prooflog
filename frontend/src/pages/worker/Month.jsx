import { useEffect, useState } from "react";
import dayjs from "dayjs";
import Card from "../../components/Card";
import NavWorker from "../../components/NavWorker";
import { workerApi } from "../../lib/api";

export default function Month() {
  const [month, setMonth] = useState(dayjs().format("YYYY-MM"));
  const [data, setData] = useState(null);

  const load = async () => {
    const r = await workerApi({ url: `/api/worker/month-summary?month=${month}`, method: "GET" });
    setData(r.data);
  };

  useEffect(() => { load().catch(() => {}); }, [month]);

  return (
    <div className="mx-auto max-w-md p-4 pb-24">
      <Card title="My Month (Attendance + Salary)">
        <label className="block text-sm">Month</label>
        <input className="mt-1 w-full rounded-xl border p-3" type="month" value={month} onChange={(e) => setMonth(e.target.value)} />

        {!data ? <div className="mt-3">Loading...</div> : (
          <div className="mt-3 text-sm space-y-2">
            <div><b>Present Days:</b> {data.attendance.presentDays}</div>
            <div><b>Approved Leaves:</b> {data.attendance.approvedLeaves}</div>
            <div><b>Invalid Leaves (Penalty):</b> {data.attendance.approvedInvalid}</div>

            <div className="mt-3 rounded-xl border p-3">
              <div><b>Basic Salary:</b> {data.salary.basicSalary}</div>
              <div><b>Daily Rate:</b> {data.salary.dailyRate}</div>
              <div><b>OT Rate:</b> {data.salary.otRate}</div>
              <div><b>OT Hours:</b> {data.salary.totalOtHours}</div>
              <div><b>OT Pay:</b> {data.salary.otPay}</div>
              <div><b>Penalty:</b> {data.salary.penalty}</div>
              <div className="mt-2 text-base"><b>Total (Estimated):</b> {data.salary.totalEstimated}</div>
              <div className="text-xs text-gray-600">Final after company approval</div>
            </div>
          </div>
        )}
      </Card>
      <NavWorker />
    </div>
  );
}
