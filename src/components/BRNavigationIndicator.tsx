"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * Small TRAX navigation emblem. Gives users a perceptible motion cue after
 * same-origin navigation starts. It is not a network-request progress meter.
 */
export default function BRNavigationIndicator() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = `${pathname ?? ""}?${searchParams.toString()}`;
  const [moving, setMoving] = useState(false);
  const currentRoute = useRef(routeKey);
  const started = useRef(0);
  const stopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const stop = () => {
      const minimum = 1250;
      const remaining = Math.max(0, minimum - (Date.now() - started.current));
      if (stopTimer.current) clearTimeout(stopTimer.current);
      stopTimer.current = setTimeout(() => setMoving(false), remaining);
    };
    if (currentRoute.current !== routeKey) {
      currentRoute.current = routeKey;
      if (started.current) stop();
    }
  }, [routeKey]);

  useEffect(() => {
    const start = () => {
      started.current = Date.now();
      setMoving(true);
      if (stopTimer.current) clearTimeout(stopTimer.current);
      // Fallback if navigation aborts / a form reload never completes.
      stopTimer.current = setTimeout(() => setMoving(false), 8000);
    };
    const click = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest("a[href]") as HTMLAnchorElement | null;
      if (!link || link.hasAttribute("download") || (link.target && link.target !== "_self")) return;
      try {
        const url = new URL(link.href, window.location.href);
        if (url.origin === window.location.origin && (url.pathname !== window.location.pathname || url.search !== window.location.search)) start();
      } catch { /* ignore invalid URLs */ }
    };
    const submit = (event: SubmitEvent) => {
      if (event.defaultPrevented) return;
      const form = event.target;
      if (!(form instanceof HTMLFormElement) || form.method.toLowerCase() !== "get") return;
      try {
        if (new URL(form.action, window.location.href).origin === window.location.origin) start();
      } catch { /* ignore invalid actions */ }
    };
    const popstate = () => start();
    document.addEventListener("click", click, true);
    document.addEventListener("submit", submit, true);
    window.addEventListener("popstate", popstate);
    return () => {
      document.removeEventListener("click", click, true);
      document.removeEventListener("submit", submit, true);
      window.removeEventListener("popstate", popstate);
      if (stopTimer.current) clearTimeout(stopTimer.current);
    };
  }, []);

  // Use two identical transparent copies, clipped at the midpoint: at rest
  // they form the original BR emblem exactly, rather than a hand-drawn approximation.
  return (
    <div role="status" aria-label={moving ? "TRAX navigating" : "TRAX double-arrow"} title="TRAX" className={`trax-br-badge${moving ? " trax-br-active" : ""}`}>
      <div className="trax-br-art" aria-hidden="true">
        <img src="/br-double-arrow-trax.png" alt="" draggable={false} className="trax-br-top" />
        <img src="/br-double-arrow-trax.png" alt="" draggable={false} className="trax-br-bottom" />
      </div>
      <style>{`
        .trax-br-badge{position:fixed;bottom:16px;left:16px;z-index:10000;width:32px;height:32px;
          display:grid;place-items:center;pointer-events:none;border-radius:50%;background:#090f18;
          border:1px solid #48576b;box-shadow:0 1px 4px rgba(0,0,0,.45);transition:border-color .18s,box-shadow .18s}
        .trax-br-art{position:relative;width:26px;height:17px;overflow:visible}
        .trax-br-art img{position:absolute;left:0;top:0;width:26px;height:17px;object-fit:fill;max-width:none;max-height:none}
        .trax-br-top{clip-path:inset(0 0 50% 0)}
        .trax-br-bottom{clip-path:inset(50% 0 0 0)}
        .trax-br-active{border-color:#ed1725;box-shadow:0 0 0 2px rgba(237,23,37,.15),0 0 12px rgba(237,23,37,.45)}
        .trax-br-active .trax-br-top{animation:trax-br-forward .7s ease-in-out infinite}
        .trax-br-active .trax-br-bottom{animation:trax-br-backward .7s ease-in-out infinite}
        @keyframes trax-br-forward{0%,100%{transform:translateX(0)}50%{transform:translateX(3px)}}
        @keyframes trax-br-backward{0%,100%{transform:translateX(0)}50%{transform:translateX(-3px)}}
        @media(prefers-reduced-motion:reduce){.trax-br-active .trax-br-top,.trax-br-active .trax-br-bottom{animation:none}}
      `}</style>
    </div>
  );
}
