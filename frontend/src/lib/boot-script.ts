// Plain module (no "use client"): the root layout inlines this string into <head>.
export const NIGHT_FROM = 19;
export const NIGHT_UNTIL = 6;

/**
 * Runs in <head> before first paint, so the page never flashes the wrong palette.
 * Also marks returning visitors who have already seen the preloader this session.
 */
export const BOOT_SCRIPT = `(function(){try{var d=document.documentElement,p='auto';var s=JSON.parse(localStorage.getItem('shakshi-account')||'null');if(s&&s.state&&s.state.theme)p=s.state.theme;var h=new Date().getHours();d.dataset.theme=(p==='night'||(p==='auto'&&(h>=${NIGHT_FROM}||h<${NIGHT_UNTIL})))?'night':'day';if(sessionStorage.getItem('shk-seen'))d.classList.add('seen');}catch(e){}})();`;

const LT_ESCAPE = String.fromCharCode(92) + "u003c"; // the six characters <

/** JSON-LD is written into a <script> tag, so escape "<" to keep content from closing it early. */
export const jsonLd = (data: unknown) => JSON.stringify(data).replace(/</g, LT_ESCAPE);
