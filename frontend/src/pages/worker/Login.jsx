import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth } from "../../firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import Card from "../../components/Card";

export default function Login() {
  const nav = useNavigate();
  const [phone, setPhone] = useState("+966");
  const [code, setCode] = useState("");
  const [step, setStep] = useState("PHONE");
  const [loading, setLoading] = useState(false);

  const sendOtp = async () => {
    setLoading(true);
    try {
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha", { size: "invisible" });
      }
      const result = await signInWithPhoneNumber(auth, phone, window.recaptchaVerifier);
      window.confirmationResult = result;
      setStep("CODE");
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const verify = async () => {
    setLoading(true);
    try {
      await window.confirmationResult.confirm(code);
      nav("/w/home");
    } catch (e) {
      alert("Invalid code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md p-4">
      <Card title="ProofLog - Worker Login" right={<Link className="text-sm underline" to="/a/login">Admin</Link>}>
        {step === "PHONE" ? (
          <>
            <label className="text-sm">Phone (+966...)</label>
            <input className="mt-1 w-full rounded-xl border p-3" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <button disabled={loading} onClick={sendOtp} className="mt-3 w-full rounded-xl border p-3 font-semibold">
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </>
        ) : (
          <>
            <label className="text-sm">OTP Code</label>
            <input className="mt-1 w-full rounded-xl border p-3" value={code} onChange={(e) => setCode(e.target.value)} />
            <button disabled={loading} onClick={verify} className="mt-3 w-full rounded-xl border p-3 font-semibold">
              {loading ? "Verifying..." : "Verify"}
            </button>
          </>
        )}
        <div id="recaptcha" />
      </Card>
    </div>
  );
}
