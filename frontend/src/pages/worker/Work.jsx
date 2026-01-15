import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Card from "../../components/Card";
import NavWorker from "../../components/NavWorker";
import { workerApi } from "../../lib/api";
import { stampPhoto } from "../../lib/photoStamp";

function getGeoOnce() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy }),
      (e) => reject(e),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  });
}

export default function Work() {
  const loc = useLocation();
  const assignment = loc.state?.assignment;

  const [sessionId, setSessionId] = useState(localStorage.getItem("prooflog_session_id") || "");
  const [status, setStatus] = useState(sessionId ? "STARTED" : "READY");
  const [proof, setProof] = useState(null);
  const [otHours, setOtHours] = useState("0");

  useEffect(() => {
    if (!assignment) alert("Open from Home (Today Assignment).");
  }, [assignment]);

  const start = async () => {
    try {
      // GPS retry 3 times for inaccuracy
      let geo = null;
      for (let i = 0; i < 3; i++) {
        try { geo = await getGeoOnce(); break; } catch {}
      }
      if (!geo) return alert("GPS not available. Try again.");

      const r = await workerApi({
        url: "/api/worker/work/start",
        method: "POST",
        data: { assignmentId: assignment._id, lat: geo.lat, lng: geo.lng }
      });

      const sid = r.data.sessionId;
      setSessionId(sid);
      localStorage.setItem("prooflog_session_id", sid);
      setStatus("STARTED");
      alert("Work started");
    } catch (e) {
      const msg = e?.response?.data?.message || e?.response?.data?.error || e.message;
      alert(msg);
    }
  };

  const end = async () => {
    try {
      if (!proof) return alert("Final photo proof required");

      let geo = null;
      for (let i = 0; i < 3; i++) {
        try { geo = await getGeoOnce(); break; } catch {}
      }
      if (!geo) return alert("GPS not available. Try again.");

      const now = new Date();
      const stamp = `ProofLog\n${now.toLocaleString()}\nLat:${geo.lat.toFixed(6)} Lng:${geo.lng.toFixed(6)}`;
      const stamped = await stampPhoto(proof, stamp);

      const fd = new FormData();
      fd.append("photo", stamped);
      fd.append("sessionId", sessionId);
      fd.append("lat", String(geo.lat));
      fd.append("lng", String(geo.lng));
      fd.append("otHours", String(otHours || "0"));

      const r = await workerApi({
        url: "/api/worker/work/end",
        method: "POST",
        data: fd,
        headers: { "Content-Type": "multipart/form-data" }
      });

      localStorage.removeItem("prooflog_session_id");
      setSessionId("");
      setStatus("READY");
      setProof(null);

      if (r.data.warning) {
        alert("Work ended, but GPS inaccurate. Company will approve (Override).");
      } else {
        alert("Work ended successfully");
      }
    } catch (e) {
      const msg = e?.response?.data?.error || e.message;
      alert(msg);
    }
  };

  return (
    <div className="mx-auto max-w-md p-4 pb-24">
      <Card title="Work">
        {!assignment ? (
          <div className="text-sm">Go to Home and open assignment.</div>
        ) : (
          <>
            <div className="text-sm">
              <div><b>Site:</b> {assignment.site.name}</div>
              <div><b>Radius:</b> {assignment.site.radiusMeters}m</div>
            </div>

            {status === "READY" ? (
              <button onClick={start} className="mt-3 w-full rounded-xl border p-3 font-semibold">
                START WORK (GPS)
              </button>
            ) : (
              <div className="mt-3 rounded-xl border p-3 text-sm">
                <b>Status:</b> Working… (Battery safe: GPS only start/end)
              </div>
            )}

            <div className="mt-4">
              <label className="block text-sm">Final Photo Proof (Camera only)</label>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => setProof(e.target.files?.[0] || null)}
                className="mt-1 w-full"
              />
            </div>

            <label className="mt-3 block text-sm">OT Hours (number)</label>
            <input className="mt-1 w-full rounded-xl border p-3" value={otHours} onChange={(e) => setOtHours(e.target.value)} />

            <button
              onClick={end}
              disabled={!sessionId}
              className="mt-3 w-full rounded-xl border p-3 font-semibold disabled:opacity-50"
            >
              END WORK (GPS + Photo)
            </button>
          </>
        )}
      </Card>
      <NavWorker />
    </div>
  );
}
