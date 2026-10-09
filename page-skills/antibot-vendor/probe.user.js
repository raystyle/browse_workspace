// ==UserScript==
// @name         antibot-vendor probe
// @match        *://*/*
// @run-at       document-idle
// ==/UserScript==
/* @detect */
function browseDetect(facts) {
  var sv = facts.scriptVendor || {};
  var ckHit = facts.cfCookie || facts.akamaiCookie;
  if (sv.cloudflare || sv.akamai || sv.datadome || sv.imperva || ckHit) {
    return { slug: 'antibot-vendor', confidence: 'PLAUSIBLE' };
  }
  return null;
}
/* @enddetect */
