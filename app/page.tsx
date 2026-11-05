import { SmoothScrollProvider } from "@/components/providers/smooth-scroll";
import { Experience } from "@/components/experience/Experience";
import { Portfolio } from "@/components/portfolio/Portfolio";
import { RecordPanel } from "@/components/record/RecordPanel";
import { IndexOverlay } from "@/components/index/IndexOverlay";
import { TopBar } from "@/components/shared/TopBar";

/**
 * One continuous page. A skip link and the persistent bar come first; then the
 * World Tree journey (a fixed canvas driven by the scroll range of #journey);
 * then the written portfolio, rendered on the server so it is readable before
 * — and without — any JavaScript or WebGL.
 */
export default function Home() {
  return (
    <SmoothScrollProvider>
      <a href="#record" className="sr-only-focusable fixed left-4 top-20 z-50 rounded-full bg-paper px-4 py-2 text-sm font-medium text-ink">
        Skip the 3D journey and go to the portfolio
      </a>
      <TopBar />
      <Experience />
      <Portfolio />
      <RecordPanel />
      <IndexOverlay />
    </SmoothScrollProvider>
  );
}
