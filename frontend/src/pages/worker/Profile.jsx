import { useEffect, useState } from "react";
import NavWorker from "../../components/NavWorker";
import Card from "../../components/Card";
import { workerApi } from "../../lib/api";

export default function Profile() {
  const [me, setMe] = useState(null);
  const [name, setName] = useState("");
  const [trade, setTrade] = useState("");
  const [photo, setPhoto] = useState(null);

  const load = async () => {
    const r = await workerApi({ url: "/api/worker/me", method: "GET" });
    setMe(r.data.worker);
    setName(r.data.worker.name || "");
    setTrade(r.data.worker.trade || "");
  };

  useEffect(() => { load().catch(() => {}); }, []);

  const save = async () => {
    await workerApi({ url: "/api/worker/profile", method: "POST", data: { name, trade } });
    alert("Saved");
    await load();
  };

  const uploadPhoto = async () => {
    if (!photo) return;
    const fd = new FormData();
    fd.append("photo", photo);
    await workerApi({ url: "/api/worker/profile/photo", method: "POST", data: fd, headers: { "Content-Type": "multipart/form-data" } });
    alert("Photo updated");
    setPhoto(null);
    await load();
  };

  return (
    <div className="mx-auto max-w-md p-4 pb-24">
      <Card title="My Profile">
        {!me ? <div>Loading...</div> : (
          <>
            <div className="text-sm text-gray-600">Phone: {me.phone}</div>
            <label className="mt-3 block text-sm">Name</label>
            <input className="mt-1 w-full rounded-xl border p-3" value={name} onChange={(e) => setName(e.target.value)} />

            <label className="mt-3 block text-sm">Trade</label>
            <input className="mt-1 w-full rounded-xl border p-3" value={trade} onChange={(e) => setTrade(e.target.value)} />

            <button onClick={save} className="mt-3 w-full rounded-xl border p-3 font-semibold">Save Profile</button>

            <div className="mt-4">
              {me.profilePhotoUrl ? <img className="h-28 w-28 rounded-2xl object-cover" src={me.profilePhotoUrl} /> : <div className="text-sm">No photo</div>}
            </div>

            <label className="mt-3 block text-sm">Profile Photo (Camera)</label>
            <input
              type="file"
              accept="image/*"
              capture="user"
              onChange={(e) => setPhoto(e.target.files?.[0] || null)}
              className="mt-1 w-full"
            />
            <button onClick={uploadPhoto} className="mt-3 w-full rounded-xl border p-3 font-semibold">Upload Photo</button>
          </>
        )}
      </Card>
      <NavWorker />
    </div>
  );
}
