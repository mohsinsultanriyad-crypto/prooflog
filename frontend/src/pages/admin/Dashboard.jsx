import { useEffect, useState } from "react";
import NavAdmin from "../../components/NavAdmin";
import Card from "../../components/Card";
import { adminApi } from "../../lib/api";

export default function Dashboard() {
  const [data, setData] = useState(null);

  const load = async () => {
    const r = await adminApi({ url: "/api/admin/live", method: "GET" });
    setData(r.data);
  };

  useEffect(() => { load().catch(() => {}); }, []);

  return (
    <div>
      <NavAdmin />
      <div className="mx-auto max-w-5xl p-4 space-y-4">
        <Card title={`Live Status (${data?.today || ""})`} right={<button onClick={load} className="rounded-xl border px-3 py-2 text-sm">Refresh</button>}>
          {!data ? <div>Loading...</div> : (
            <div className="grid gap-3 md:grid-cols-2">
              {data.result.map((x) => (
                <div key={x.worker._id} className="rounded-2xl border p-3">
                  <div className="flex items-center gap-3">
                    {x.worker.profilePhotoUrl ? (
                      <img src={x.worker.profilePhotoUrl} className="h-12 w-12 rounded-xl object-cover" />
                    ) : (
                      <div className="h-12 w-12 rounded-xl border" />
                    )}
                    <div>
                      <div className="font-semibold">{x.worker.name || "(No name)"} — {x.worker.trade || "(No trade)"}</div>
                      <div className="text-sm text-gray-600">{x.worker.phone}</div>
                    </div>
                  </div>
                  <div className="mt-2 text-sm">
                    <b>Status:</b> {x.status} {x.detail ? `(${x.detail})` : ""}
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
