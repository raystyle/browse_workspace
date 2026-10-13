// ==UserScript==
// @name         response-tap probe
// @match        *://*/*
// @connect      127.0.0.1
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
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
    var page = typeof unsafeWindow !== "undefined" && unsafeWindow ? unsafeWindow : window;
    page.__browseTap = page.__browseTap || { filters: [], buf: [], seq: 0 };
    var T = page.__browseTap;
    var PORT = (function() {
      var p = "%%BROWSE_PORT%%";
      return p.indexOf("%%") === 0 ? "9880" : p;
    })();
    var BODY_CAP = 256 * 1024;
    var N_CAP = 2e3;
    function match(url) {
      var f = page.__RT_FILTER;
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
    function note(kind, url) {
      var u = "" + (url == null ? "" : url);
      if (!match(u)) return;
      keep(u, 0, "");
      summary(u, 0, 0, [kind]);
    }
    function seal(obj, name, fn) {
      try {
        Object.defineProperty(obj, name, { value: fn, writable: false, configurable: false });
      } catch (e) {
        try {
          obj[name] = fn;
        } catch (e2) {
        }
      }
    }
    if (!T.fetchWrapped) {
      T.fetchWrapped = true;
      try {
        var of = page.fetch;
        if (of) {
          page.fetch = function() {
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
      } catch (e) {
      }
      try {
        var XHR = page.XMLHttpRequest;
        var oo = XHR.prototype.open, os = XHR.prototype.send;
        XHR.prototype.open = function(m, u) {
          this.__rtUrl = u;
          return oo.apply(this, arguments);
        };
        XHR.prototype.send = function() {
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
      } catch (e) {
      }
    }
    try {
      if (page.open && !T.openWrapped) {
        T.openWrapped = true;
        var op = page.open;
        seal(page, "open", function(url) {
          try {
            note("open", url);
          } catch (e) {
          }
          return op.apply(page, arguments);
        });
      }
    } catch (e) {
    }
    try {
      var OW = page.WebSocket;
      if (OW && !T.wsWrapped) {
        let WsWrap2 = function(url) {
          try {
            note("websocket", url);
          } catch (e) {
          }
          return Reflect.construct(OW, arguments, new.target);
        };
        var WsWrap = WsWrap2;
        T.wsWrapped = true;
        WsWrap2.prototype = OW.prototype;
        seal(page, "WebSocket", WsWrap2);
      }
    } catch (e) {
    }
    try {
      var OE = page.EventSource;
      if (OE && !T.esWrapped) {
        let EsWrap2 = function(url) {
          try {
            note("eventsource", url);
          } catch (e) {
          }
          return Reflect.construct(OE, arguments, new.target);
        };
        var EsWrap = EsWrap2;
        T.esWrapped = true;
        EsWrap2.prototype = OE.prototype;
        seal(page, "EventSource", EsWrap2);
      }
    } catch (e) {
    }
  })();
})();
