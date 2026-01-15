import { Link, useLocation } from "react-router-dom";

const tabs = [
  { to: "/a/dashboard", label: "Live" },
  { to: "/a/workers", label: "Workers" },
  { to: "/a/sites", label: "Sites" },
  { to: "/a/assign", label: "Assign" },
  { to: "/a/leaves", label: "Leaves" },
  { to: "/a/salary", label: "Salary" },
  { to: "/a/sessions", label: "Sessions" }
];

export default function NavAdmin() {
  const loc = useLocation();
  return (
    <div className="sticky top-0 z-10 border-b bg-white">
      <div className="mx-auto flex max-w-5xl flex-wrap gap-2 p-3">
        {tabs.map(t => (
          <Link
            key={t.to}
            to={t.to}
            className={`rounded-xl px-3 py-2 text-sm ${loc.pathname === t.to ? "border font-bold" : "border-transparent"}`}
          >
            {t.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
