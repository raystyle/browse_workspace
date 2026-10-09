# challenge-stop

挑战页识别与条件停止对(安全类垫底)。probe 的 @detect 看 prelude 的
挑战 facts(turnstile/challenge DOM/captcha 脚本)出 CONFIRMED;常驻腿
MutationObserver 观察挑战节点,命中即 POST /userscript/stop
(slug=challenge-stop,data={vendor,hint})打断在跑编排。mech.rn 是
被停演示(长等待循环)。晚到挑战是主用例:编排起跑后才插入的 turnstile
也能停。装:置场 CLI 装 probe 进引擎 profile(端口替换),或采集对的
mech 注入道连带装。
