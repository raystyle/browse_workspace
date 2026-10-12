// ==UserScript==
// @name         response-tap probe
// @match        *://*/*
// @connect      127.0.0.1
// @grant        GM_xmlhttpRequest
// @run-at       document-start
// ==/UserScript==
/* @detect */
function browseDetect(facts) {
  return null; // 采集型无判定腿(任何页都可挂)
}
/* @enddetect */

"use strict";
(() => {
  // build/pairs/response-tap/probe.body.ts
  (function() {
    window.__browseTap = window.__browseTap || { filters: [], buf: [], seq: 0 };
    var T = window.__browseTap;
    var PORT = (function() {
      var p = "%%BROWSE_PORT%%";
      return p.indexOf("%%") === 0 ? "9880" : p;
    })();
    var BODY_CAP = 256 * 1024;
    var N_CAP = 2e3;
    function match(url) {
      var f = window.__RT_FILTER;
      if (!f || !f.length) return true;
      for (var i = 0; i < f.length; i++) if (url.indexOf(f[i]) >= 0) return true;
      return false;
    }
    function keep(url, status, body) {
      if (!match(url)) return;
      if (T.buf.length >= N_CAP) T.buf.shift();
      T.buf.push({ url, status, body: ("" + body).slice(0, BODY_CAP), ts: Date.now(), seq: T.seq++ });
    }
    function summary(url, status, bytes, keys) {
      GM_xmlhttpRequest({
        method: "POST",
        url: "http://127.0.0.1:" + PORT + "/events",
        headers: { "Content-Type": "application/json" },
        data: JSON.stringify({ type: "see", slug: "response-tap", url: location.href, data: { hit: url, status, bytes, topKeys: keys } })
      });
    }
    if (!T.fetchWrapped) {
      T.fetchWrapped = true;
      var of = window.fetch;
      if (of) {
        window.fetch = function() {
          var args = arguments;
          return of.apply(this, args).then(function(resp) {
            try {
              var a0 = args[0];
              var u = "" + (a0 && a0.url || args[0]);
              if (match(u)) {
                var c = resp.clone();
                c.text().then(function(tx) {
                  var keys = null;
                  try {
                    keys = Object.keys(JSON.parse(tx)).slice(0, 12);
                  } catch (e) {
                  }
                  keep(u, resp.status, tx);
                  summary(u, resp.status, tx.length, keys);
                }).catch(function() {
                });
              }
            } catch (e) {
            }
            return resp;
          });
        };
      }
      var oo = XMLHttpRequest.prototype.open, os = XMLHttpRequest.prototype.send;
      XMLHttpRequest.prototype.open = function(m, u) {
        this.__rtUrl = u;
        return oo.apply(this, arguments);
      };
      XMLHttpRequest.prototype.send = function() {
        var xhr = this;
        xhr.addEventListener("load", function() {
          try {
            var u = "" + xhr.__rtUrl;
            if (match(u)) {
              var tx = xhr.responseType === "json" ? JSON.stringify(xhr.response) : "" + (xhr.responseText || "");
              var keys = null;
              try {
                keys = Object.keys(JSON.parse(tx)).slice(0, 12);
              } catch (e) {
              }
              keep(u, xhr.status, tx);
              summary(u, xhr.status, tx.length, keys);
            }
          } catch (e) {
          }
        });
        return os.apply(this, arguments);
      };
    }
  })();
})();
