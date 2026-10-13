# spa-route

`@detect` 看 framework,出 PLAUSIBLE。封页面 `history.pushState`/`replaceState`(writable/configurable 均为 false)。已封则登记 `__browseRouteHooks`。`popstate`/`hashchange` 一并上报 `see.spa-route` `{kind}`。源 `build/pairs/spa-route/`。
