import { SmoothScrollProvider } from "@/components/providers/smooth-scroll";
import { Experience } from "@/components/experience/Experience";
import { Portfolio } from "@/components/portfolio/Portfolio";
import { RecordPanel } from "@/components/record/RecordPanel";
import { IndexOverlay } from "@/components/index/IndexOverlay";
import { TopBar } from "@/components/shared/TopBar";
import { ViewController } from "@/components/view/ViewController";
import { DiscoveryToast } from "@/components/view/DiscoveryToast";
import { AimHost } from "@/components/aim/AimHost";

/**
 * One page, two presentations (lib/view.ts):
 *
 *   Immersive — the World Tree journey (a fixed canvas driven by the scroll
 *               range of #journey), followed by the written portfolio;
 *   Classic   — the written portfolio alone, in its light editorial theme.
 *
 * The written portfolio is rendered on the server, so it is complete before —
 * and without — any JavaScript or WebGL. Without JavaScript the page is Classic.
 */
export default function Home() {
  return (
    <SmoothScrollProvider>
      <a href="#record" data-immersive-only className="sr-only-focusable fixed left-4 top-20 z-50 rounded-full bg-paper px-4 py-2 text-sm font-medium text-ink">
        Skip the 3D journey and go to the portfolio
      </a>
      <a href="#work" data-classic-only className="sr-only-focusable fixed left-4 top-20 z-50 rounded-full bg-paper px-4 py-2 text-sm font-medium text-ink">
        Skip to the projects
      </a>
      <TopBar />
      <ViewController />
      <Experience />
      <Portfolio />
      <RecordPanel />
      <IndexOverlay />
      <AimHost />
      <DiscoveryToast />
    </SmoothScrollProvider>
  );
}
