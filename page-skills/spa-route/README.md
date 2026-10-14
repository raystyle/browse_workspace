# spa-route

`@detect` 在检测到前端框架时返回 PLAUSIBLE。将页面 `history.pushState` 与 `replaceState` 设为不可写、不可配置。若已不可配置，则登记到 `__browseRouteHooks`。`popstate` 与 `hashchange` 上报 `see.spa-route`，数据为 `{kind}`。源位于 `build/pairs/spa-route/`。
