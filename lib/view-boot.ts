/**
 * Presentation-mode constants and the inline <head> boot script. Kept free of
 * React so the root layout (a Server Component) can import it. See lib/view.ts.
 */

export type View = "immersive" | "classic";
export type ViewReason = "default" | "stored" | "url" | "user" | "no-webgl" | "error";

export const VIEW_STORAGE_KEY = "yk-view";
export const VIEW_PARAM = "view";

/** Browser UI colour (meta theme-color) per presentation. */
export const THEME_COLOR: Record<View, string> = { immersive: "#0f0d0b", classic: "#f4efe6" };

/**
 * Inline <head> script, run before the first paint. Kept tiny and dependency-free.
 * URL parameter → stored choice → Immersive; Classic if WebGL 2 does not exist.
 * Marks the document as scripted (`js` class) so controls that need
 * JavaScript are hidden in a no-JS visit.
 */
export const VIEW_BOOT_SCRIPT = `(function(){var d=document.documentElement;d.classList.add("js");try{var q=new URLSearchParams(location.search).get("${VIEW_PARAM}");var u=q==="classic"||q==="immersive"?q:null;var s=null;try{s=localStorage.getItem("${VIEW_STORAGE_KEY}")}catch(e){}if(s!=="classic"&&s!=="immersive")s=null;var v=u||s||"immersive";var r=u?"url":s?"stored":"default";if(v==="immersive"&&!("WebGL2RenderingContext" in window)){v="classic";r="no-webgl"}d.setAttribute("data-view",v);d.setAttribute("data-view-reason",r)}catch(e){d.setAttribute("data-view","classic")}})();`;
