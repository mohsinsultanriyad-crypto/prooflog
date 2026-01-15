import { Link, useLocation } from "react-router-dom";

const tabs = [
  { to: "/w/home", label: "Home" },
  { to: "/w/leave", label: "Leave" },
  { to: "/w/month", label: "Month" },
  { to: "/w/profile", label: "Profile" }
];

export default function NavWorker() {
  const loc = useLocation();
  return (
    <div className="fixed bottom-0 left-0 right-0 border-t bg-white">
      <div className="mx-auto flex max-w-md justify-around p-2">
        {tabs.map(t => (
          <Link
            key={t.to}
            to={t.to}
            className={`px-3 py-2 text-sm ${loc.pathname === t.to ? "font-bold" : ""}`}
          >
            {t.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
