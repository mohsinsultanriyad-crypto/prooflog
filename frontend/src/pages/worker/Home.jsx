import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../components/Card";
import NavWorker from "../../components/NavWorker";
import { workerApi } from "../../lib/api";

export default function Home() {
  const nav = useNavigate();
  const [assignment, setAssignment] = useState(null);

  const load = async () => {
    const r = await workerApi({ url: "/api/worker/today-assignment", method: "GET" });
    setAssignment(r.data.assignment);
  };

  useEffect(() => { load().catch(() => {}); }, []);

  return (
    <div className="mx-auto max-w-md p-4 pb-24">
      <Card title="Today Assignment">
        {!assignment ? (
          <div className="text-sm">
            No assignment. <br />
            Status: <b>Waiting</b> (Company will see you as IDLE)
          </div>
        ) : (
          <div className="text-sm">
            <div><b>Site:</b> {assignment.site.name} ({assignment.site.city})</div>
            <div><b>Radius:</b> {assignment.site.radiusMeters}m</div>
            <div className="mt-2"><b>Notes:</b> {assignment.notes || "-"}</div>
            <button
              onClick={() => nav("/w/work", { state: { assignment } })}
              className="mt-3 w-full rounded-xl border p-3 font-semibold"
            >
              Open Work Screen
            </button>
          </div>
        )}
      </Card>
      <NavWorker />
    </div>
  );
}
