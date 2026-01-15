import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Card from "../../components/Card";
import { api } from "../../lib/api";
import { setAdminToken } from "../../lib/auth";

export default function AdminLogin() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = async () => {
    const r = await api.post("/api/admin/login", { email, password });
    setAdminToken(r.data.token);
    nav("/a/dashboard");
  };

  return (
    <div className="mx-auto max-w-md p-4">
      <Card title="Admin Login" right={<Link className="text-sm underline" to="/w/login">Worker</Link>}>
        <label className="text-sm">Email</label>
        <input className="mt-1 w-full rounded-xl border p-3" value={email} onChange={(e) => setEmail(e.target.value)} />

        <label className="mt-3 text-sm block">Password</label>
        <input className="mt-1 w-full rounded-xl border p-3" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

        <button onClick={login} className="mt-3 w-full rounded-xl border p-3 font-semibold">Login</button>
      </Card>
    </div>
  );
}
