"use client";
import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Store, MapPin, Clock, Scissors, Rocket } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getMe } from "@/lib/auth.api";
import "./onboarding.css";

const STEP_ROUTES = [
  "/onboarding/steps/01-identity",
  "/onboarding/steps/02-location",
  "/onboarding/steps/03-hours",
  "/onboarding/steps/04-services",
  "/onboarding/steps/05-plan",
];
const STEP_ICONS: LucideIcon[] = [Store, MapPin, Clock, Scissors, Rocket];

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function sync() {
      try {
        const me = await getMe();
        if (cancelled) return;
        if (me.onboardingDone) {
          router.replace("/dashboard");
          return;
        }
        const step = me.onboardingStep ?? 1;
        const allowedIndex = step - 1;
        const idx = STEP_ROUTES.findIndex((r) => pathname.startsWith(r));
        if (idx !== -1 && idx > allowedIndex) {
          router.replace(STEP_ROUTES[allowedIndex]);
          return;
        }
        setChecking(false);
      } catch {
        if (!cancelled) router.replace("/login");
      }
    }
    sync();
    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  const currentIndex = STEP_ROUTES.findIndex((r) => pathname.startsWith(r));
  const stepNum = currentIndex === -1 ? 1 : currentIndex + 1;
  const StepIcon = STEP_ICONS[stepNum - 1] ?? Store;

  if (checking) {
    return (
      <div style={{ minHeight: "100dvh", background: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{`@keyframes eligi-spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid rgba(220,38,38,0.18)", borderTop: "3px solid #dc2626", animation: "eligi-spin 0.9s linear infinite" }} />
      </div>
    );
  }

  return (
    <div className="ob-root">
      <div className="ob-glow" />
      <div className="ob-shell">
        <div className="ob-shell-head">
          <span className="ob-wordmark">eligi</span>
          <span className="ob-stepcount">Passo {stepNum} de {STEP_ROUTES.length}</span>
        </div>
        <div className="ob-progress">
          <div className="ob-progress-fill" style={{ width: `${(stepNum / STEP_ROUTES.length) * 100}%` }} />
        </div>
        <div className="ob-card">
          <div key={stepNum} className="ob-card-badge ob-anim">
            <StepIcon size={22} />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
