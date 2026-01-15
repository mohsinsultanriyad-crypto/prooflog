import { useEffect, useState } from "react";
import NavAdmin from "../../components/NavAdmin";
import Card from "../../components/Card";
import { adminApi } from "../../lib/api";

export default function Sites() {
  const [sites, setSites] = useState([]);
  const [form, setForm] = useState({ name: "", city: "", lat: "", lng: "", radiusMeters: 150 });

  const load = async () => {
    const r = await adminApi({ url: "/api/admin/sites", method: "GET" });
    setSites(r.data.sites);
  };

  useEffect(() => { load().catch(() => {}); }, []);

  const add = async () => {
    await adminApi({
      url: "/api/admin/sites",
      method: "POST",
      data: {
        ...form,
        lat: Number(form.lat),
        lng: Number(form.lng),
        radiusMeters: Number(form.radiusMeters)
      }
    });
    setForm({ name: "", city: "", lat: "", lng: "", radiusMeters: 150 });
    await load();
  };

  const updateRadius = async (id, radiusMeters) => {
    await adminApi({ url: `/api/admin/sites/${id}`, method: "POST", data: { radiusMeters: Number(radiusMeters) } });
    await load();
  };

  return (
    <div>
      <NavAdmin />
      <div className="mx-auto max-w-5xl p-4 space-y-4">
        <Card title="Sites (Geo-fence 150–300m)">
          <div className="grid gap-2 md:grid-cols-5">
            <input className="rounded-xl border p-2" placeholder="Name" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
            <input className="rounded-xl border p-2" placeholder="City" value={form.city} onChange={(e) => setForm(f => ({ ...f, city: e.target.value }))} />
            <input className="rounded-xl border p-2" placeholder="Lat" value={form.lat} onChange={(e) => setForm(f => ({ ...f, lat: e.target.value }))} />
            <input className="rounded-xl border p-2" placeholder="Lng" value={form.lng} onChange={(e) => setForm(f => ({ ...f, lng: e.target.value }))} />
            <button onClick={add} className="rounded-xl border p-2 font-semibold">Add</button>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {sites.map(s => (
              <div key={s._id} className="rounded-2xl border p-3">
                <div className="font-semibold">{s.name} ({s.city})</div>
                <div className="text-sm text-gray-600">Lat {s.lat} | Lng {s.lng}</div>
                <div className="mt-2 text-sm">Radius: <b>{s.radiusMeters}m</b></div>
                <div className="mt-2 flex gap-2">
                  <input className="w-full rounded-xl border p-2" defaultValue={s.radiusMeters} />
                  <button
                    onClick={(e) => {
                      const val = e.currentTarget.previousSibling.value;
                      updateRadius(s._id, val);
                    }}
                    className="rounded-xl border px-3 py-2 text-sm font-semibold"
                  >
                    Update
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
