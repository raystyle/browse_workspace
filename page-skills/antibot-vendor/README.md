# antibot-vendor

反爬产品识别对(安全类,只识别不绕过)。@detect 看 prelude 的 cookie 名
与脚本 URL 特征出 PLAUSIBLE;mech goto 后把 vendor 清单读进 rune 返回值。
边界:cookie 名与脚本路径是公开特征(值不读);只有名字没有挑战 DOM 时
不停(正常站点也带这些 cookie)。素材:scraping-wiki 特征表(X 检索轮)。
无常驻腿(纯判定+读),不需要装。
