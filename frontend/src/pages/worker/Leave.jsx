import { useState } from "react";
import dayjs from "dayjs";
import Card from "../../components/Card";
import NavWorker from "../../components/NavWorker";
import { workerApi } from "../../lib/api";

export default function Leave() {
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [type, setType] = useState("MEDICAL");
  const [reasonText, setReasonText] = useState("");
  const [photo, setPhoto] = useState(null);

  const submit = async () => {
    const fd = new FormData();
    fd.append("date", date);
    fd.append("type", type);
    fd.append("reasonText", reasonText);
    if (photo) fd.append("photo", photo);

    await workerApi({
      url: "/api/worker/leave",
      method: "POST",
      data: fd,
      headers: { "Content-Type": "multipart/form-data" }
    });

    alert("Submitted. Company will approve/reject.");
    setReasonText("");
    setPhoto(null);
  };

  return (
    <div className="mx-auto max-w-md p-4 pb-24">
      <Card title="Leave / Absent / Problem">
        <label className="block text-sm">Date</label>
        <input className="mt-1 w-full rounded-xl border p-3" type="date" value={date} onChange={(e) => setDate(e.target.value)} />

        <label className="mt-3 block text-sm">Type</label>
        <select className="mt-1 w-full rounded-xl border p-3" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="MEDICAL">Medical</option>
          <option value="EMERGENCY">Emergency</option>
          <option value="PERSONAL">Personal</option>
          <option value="SITE_CLOSED">Site closed / No assignment</option>
        </select>

        <label className="mt-3 block text-sm">Reason / Problem detail</label>
        <textarea className="mt-1 w-full rounded-xl border p-3" value={reasonText} onChange={(e) => setReasonText(e.target.value)} />

        <label className="mt-3 block text-sm">Proof photo (optional)</label>
        <input type="file" accept="image/*" capture="environment" onChange={(e) => setPhoto(e.target.files?.[0] || null)} />

        <button onClick={submit} className="mt-3 w-full rounded-xl border p-3 font-semibold">Submit</button>
      </Card>
      <NavWorker />
    </div>
  );
}
