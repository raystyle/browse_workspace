# bh 域名知识迁移清单（2026-10-02，REQ-015 残留批）

源：browser-harness 仓 `assets/domain-skills/`（94 站 107 件）。策略：**逐字保真 + 顶部源注横幅**；文内 `helpers`/python 片段是 bh 运行时风味，browse 侧等价原语（`browse fetch`、`--js`、`cdp::*`）见各件横幅。无实弹不重写：改写任何站点件须先真站验证（种子四站 github/google/medium/x 是 browse 原生重写先例，本批不碰）。

## 目录名改段规则

goto 回执按「hostname 去 www 首段」命中 `domain-skills/<段>/`，故目录名 = 主浏览域的段名。两条裁量：

1. **垃圾段子域不采用**（news./store./admin./my./mail./web./hotels./sfbay. 等首标签跨站通用，采作目录名会误命中他站）：此类站保留品牌名目录，**无 goto 自动命中**（`browse workspace list/site` 仍可发现）。涉及：craigslist（sfbay.* 区域子域）、ctrip（hotels.*）、gmail（mail.google.com）、hackernews（news.ycombinator.com）、shopify（admin.shopify.com）、steam（store.steampowered.com）、atlas（my.recruitwithatlas.com）、wehotel（bestwehotel.com）、qbo（qbo.intuit.com）。
2. **域族并档**：archive-org 与 wayback-machine 同属 archive.org 域族，并入 `archive/`；arxiv-bulk 并入 `arxiv/`。

多域聚合簇（单站段名不适配，恒无自动命中）：job-boards（indeed/stepstone/glassdoor）、news-aggregation、package-registries（npm/pypi）、weather（wttr/open-meteo）、substack（自定义域）。

## 映射表（bh 目录 -> 段目录）

| bh 目录 | 段 | 备注 |
| --- | --- | --- |
| BOSS-zhipin | zhipin | |
| aa | aa | |
| agentlist | agentlist | |
| alaska | alaskaair | alaskaair.com |
| amazon | amazon | |
| archive-org | archive | 域族并档 |
| articulate-rise | articulate | Rise 是 articulate 产品 |
| arxiv | arxiv | arxiv-bulk 并入 |
| arxiv-bulk | arxiv | 并档（文件冲突 bh- 前缀） |
| atlas | atlas | 无自动命中（my. 子域） |
| bigbang-hr | bigbang | bigbang.hr |
| bilibili | bilibili | |
| booking-com | booking | |
| capterra | capterra | |
| centilebrain | centilebrain | |
| claude-ai | claude | 含伴件 extract-share-transcript.py |
| coingecko | coingecko | api 域不采 |
| coinmarketcap | coinmarketcap | |
| coursera | coursera | |
| craigslist | craigslist | 无自动命中（区域子域） |
| crossref | crossref | |
| ctrip | ctrip | 无自动命中（hotels. 子域） |
| dev-to | dev | dev.to |
| duckduckgo | duckduckgo | |
| ebay | ebay | |
| etsy | etsy | |
| eventbrite | eventbrite | |
| expedia | expedia | |
| facebook | facebook | |
| flipkart | flipkart | |
| framer | framer | |
| fred | fred | fred.stlouisfed.org 首标签恰 fred，自动命中 |
| g2 | g2 | |
| genius | genius | |
| github | github | 种子并档（bh- 前缀让名） |
| glassdoor | glassdoor | |
| gmail | gmail | 无自动命中（mail. 垃圾段） |
| goodreads | goodreads | |
| gutenberg | gutenberg | |
| hackernews | hackernews | 无自动命中（news. 垃圾段防 news.google.com 误命中） |
| howlongtobeat | howlongtobeat | |
| hubspot | hubspot | app-<region> 模式不采 |
| imdb | imdb | |
| itch-io | itch | itch.io |
| job-boards | job-boards | 聚合簇 |
| letterboxd | letterboxd | |
| linkedin | linkedin | |
| loom | loom | |
| ly-com | ly | ly.com |
| macrotrends | macrotrends | |
| manus | manus | |
| medium | medium | 种子并档（bh- 前缀让名） |
| metacritic | metacritic | backend api 域不采 |
| musicbrainz | musicbrainz | |
| nasa | nasa | |
| news-aggregation | news-aggregation | 聚合簇 |
| open-library | openlibrary | openlibrary.org |
| openalex | openalex | |
| openstreetmap | openstreetmap | nominatim/overpass api 域不采 |
| package-registries | package-registries | 聚合簇（npm/pypi） |
| perplexity | perplexity | |
| polymarket | polymarket | gamma-api 域不采 |
| producthunt | producthunt | |
| pubmed | pubmed | pubmed.ncbi.nlm.nih.gov 首标签恰 pubmed，自动命中 |
| qbo | qbo | 无自动命中（qbo.intuit.com） |
| quora | quora | |
| rawg | rawg | |
| reddit | reddit | |
| rest-countries | restcountries | restcountries.com |
| sec-edgar | sec | sec.gov |
| shopify-admin | shopify | 无自动命中（admin. 垃圾段） |
| soundcloud | soundcloud | |
| spotify | spotify | open.spotify oembed 域不采 |
| stackoverflow | stackoverflow | stackexchange api 域不采 |
| steam | steam | 无自动命中（store. 垃圾段） |
| substack | substack | 聚合簇（自定义域） |
| tasksquad-ai | tasksquad | tasksquad.ai |
| thetechgeeks | thetechgeeks | |
| tiktok | tiktok | |
| tradingview | tradingview | |
| trello | trello | |
| trustpilot | trustpilot | |
| vercel | vercel | |
| walmart | walmart | |
| wayback-machine | archive | 域族并档（bh- 前缀） |
| weather | weather | 聚合簇（wttr/open-meteo） |
| wehotel | wehotel | 无自动命中（bestwehotel.com） |
| wellfound | wellfound | |
| weread | weread | weread.qq.com 首标签恰 weread，自动命中 |
| world-bank | worldbank | worldbank.org |
| x | x | 种子并档（bh- 前缀让名） |
| xiaohongshu | xiaohongshu | |
| youtube | youtube | |
| zillow | zillow | |

## 后续（非本批）

- 无自动命中的九站：若某站高频使用，可加「goto 提示别名」机制或迁就子域段名（须先评估误命中面）
- 逐站 browse 原生化改写：按需小批进行，每站先真站验证
