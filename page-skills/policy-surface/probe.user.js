// ==UserScript==
// @name         policy-surface probe
// @match        *://*/*
// @run-at       document-idle
// ==/UserScript==
/* @detect */
function browseDetect(facts) {
  if (facts.cspMeta || facts.passwordVisible) {
    return { slug: 'policy-surface', confidence: 'PLAUSIBLE' };
  }
  return null;
}
/* @enddetect */
