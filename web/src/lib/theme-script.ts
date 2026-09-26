export const THEME_KEY = "theme";

// Runs in <head> before first paint so a saved light theme never flashes dark.
export const THEME_SCRIPT = `try{if(localStorage.getItem("${THEME_KEY}")==="light")document.documentElement.dataset.theme="light"}catch(e){}`;
