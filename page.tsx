// app/signup/page.tsx
"use client";

import { useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/browser";

type Step = "idle" | "creatingUser" | "seedingData" | "done" | "error";

export default function SignupPage() {
  const supabase = createBrowserSupabase();

  const [step, setStep] = useState<Step>("idle");
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [locationLabel, setLocationLabel] = useState("Home Garden");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [lat, setLat] = useState<string>("");
  const [lng, setLng] = useState<string>("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password || !fullName || !accountName || !locationLabel) {
      setError("Please fill all required fields.");
      return;
    }

    try {
      setStep("creatingUser");
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName } // optional: mirrors profiles.full_name
        }
      });

      if (signUpError) throw signUpError;

      const userId = authData.user?.id;
      if (!userId) throw new Error("User not created.");

      setStep("seedingData");

      const resp = await fetch("/api/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          accountName,
          fullName,
          locationLabel,
          city: city || null,
          region: region || null,
          lat: lat ? Number(lat) : null,
          lng: lng ? Number(lng) : null
        })
      });

      const payload = await resp.json();
      if (!resp.ok) {
        throw new Error(payload.error || "Failed to onboard user");
      }

      setStep("done");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong");
      setStep("error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-xl rounded-2xl shadow p-6 border">
        <h1 className="text-2xl font-semibold mb-4">Create your garden swap account</h1>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Auth */}
            <div>
              <label className="block text-sm font-medium">Email *</label>
              <input
                type="email"
                className="mt-1 w-full rounded-md border px-3 py-2"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Password *</label>
              <input
                type="password"
                className="mt-1 w-full rounded-md border px-3 py-2"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                minLength={6}
              />
            </div>

            {/* Business info */}
            <div>
              <label className="block text-sm font-medium">Full name *</label>
              <input
                className="mt-1 w-full rounded-md border px-3 py-2"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Account name *</label>
              <input
                className="mt-1 w-full rounded-md border px-3 py-2"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                required
                placeholder="e.g., Nelson’s Garden"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium">Location label *</label>
              <input
                className="mt-1 w-full rounded-md border px-3 py-2"
                value={locationLabel}
                onChange={(e) => setLocationLabel(e.target.value)}
                required
                placeholder="Home Garden"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">City</label>
              <input
                className="mt-1 w-full rounded-md border px-3 py-2"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Irvine"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Region / State</label>
              <input
                className="mt-1 w-full rounded-md border px-3 py-2"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="CA"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Latitude</label>
              <input
                type="number"
                step="any"
                className="mt-1 w-full rounded-md border px-3 py-2"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                placeholder="33.6846"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Longitude</label>
              <input
                type="number"
                step="any"
                className="mt-1 w-full rounded-md border px-3 py-2"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                placeholder="-117.8265"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={step === "creatingUser" || step === "seedingData"}
            className="w-full rounded-md border px-4 py-2 font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            {step === "idle" && "Create account"}
            {step === "creatingUser" && "Creating user..."}
            {step === "seedingData" && "Setting up your workspace..."}
            {step === "done" && "Done!"}
            {step === "error" && "Try again"}
          </button>

          {step === "done" && (
            <p className="text-sm text-green-700 mt-2">
              Account created! Check your email for a verification link.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
