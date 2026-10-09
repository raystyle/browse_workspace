# scroll-until-end

滚动采集对(爬虫类)。@detect 看页高 >= 4 倍视口出 PLAUSIBLE;常驻腿
MutationObserver 监听节点增量,连续三拍无新增判稳定,POST
/userscript/stop(slug=scroll-until-end,data={nodes,reason:'stable'})
打断滚动编排——被停即「收齐了」。mech 按步滚动(600ms 步距,300 步帽,
无 abort 的滚不停教训在 X 检索轮)。停后由调用方跑 response-tap 的导出。
素材:Kyosukyuu 滚动脚本(MIT)的停条件。
