// Plain module (no "use client"): the root layout inlines this string into <head>.
export const NIGHT_FROM = 19;
export const NIGHT_UNTIL = 6;

/**
 * The browser cancels a page-transition animation if the page updates while its tab is in the
 * background, and reports that as an InvalidStateError. It's expected and harmless (the update
 * still happens, just without the fade), so it's silenced here, before any other script listens.
 */
const quietTransitions = `(function(){function q(r){return r&&r.name==='InvalidStateError'&&/Transition was aborted/.test(r.message||'')}window.addEventListener('unhandledrejection',function(e){if(q(e.reason)){e.preventDefault();e.stopImmediatePropagation()}},true);window.addEventListener('error',function(e){if(q(e.error)){e.preventDefault();e.stopImmediatePropagation()}},true)})();`;

/**
 * Runs in <head> before first paint, so the page never flashes the wrong palette.
 * Also marks returning visitors who have already seen the preloader this session.
 */
export const bootScript = (nightMode = true) => `${quietTransitions}(function(){try{var d=document.documentElement,p='auto';var s=JSON.parse(localStorage.getItem('shakshi-account')||'null');if(s&&s.state&&s.state.theme)p=s.state.theme;var h=new Date().getHours();d.dataset.theme=(p==='night'||(p==='auto'&&(h>=${NIGHT_FROM}||h<${NIGHT_UNTIL})))?'night':'day';${nightMode ? "" : "d.dataset.theme='day';"}if(sessionStorage.getItem('shk-seen'))d.classList.add('seen');}catch(e){}})();`;

const LT_ESCAPE = String.fromCharCode(92) + "u003c"; // the six characters <

/** JSON-LD is written into a <script> tag, so escape "<" to keep content from closing it early. */
export const jsonLd = (data: unknown) => JSON.stringify(data).replace(/</g, LT_ESCAPE);
