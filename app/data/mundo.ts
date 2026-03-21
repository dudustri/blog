import visited from "@/content/countries.json";
import wantToGo from "@/content/wantToGo.json";

export const countries        = visited;
export const wantToGoCountries = wantToGo;

// Globe polygon colours — single source of truth for both MundoGlobe and the legend
export const COLOR_VISITED    = 'rgba(251, 113, 133, 0.55)';  // coral/rose — warm, places lived
export const COLOR_WANT_TO_GO = 'rgba(167, 139, 250, 0.50)';  // soft violet — dreamy, aspirational
export const COLOR_DEFAULT    = 'rgba(80, 85, 115, 0.50)';    // blue-grey — matches the space backdrop
export const COLOR_SELECTED   = 'rgba(59, 130, 246, 0.75)';   // blue — active selection
