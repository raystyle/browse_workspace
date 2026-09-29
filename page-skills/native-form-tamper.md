# native-form-tamper(原生表单隐藏域篡改)

点名条件:页面含带隐藏域的表单(input[type=hidden] 或
不可见值域:price/quantity/username/userId/csrf 类),业务
动作(下单/改密/改邮箱/提交)直接消费表单值。

## 手法:改值后原生提交

原生 submit 自动带上全部隐藏域与既有 cookie,是篡改重放
的最稳通道(比手工 fetch 少踩 csrf/编码坑):

```
const f = [...document.querySelectorAll('form')].find(x => x.action.includes('/my-account/change-password'))
f.querySelector('input[name=username]').value = 'victim'
f.querySelector('input[name=current-password]').value = ''
f.submit()
```

## 战役实证(PortSwigger 逻辑批,2026-09-29)

- 价格隐藏域(price=133700)改 1 分直接成交
- 数量域负值/大数量(整数卷绕)对冲总价
- 改密表单 username 改 administrator + current-password
  整参删除(缺参跳过校验;留空不跳)
- 结账表单按 action 精确定位(/cart/checkout),同页多个
  数量调节表单会误中

## 判读

- 篡改生效判据 = 业务回执以篡改值成交/目标账户被改,
  不是 200 本身
- 400 大概率缺 csrf 或缺隐藏参数(报错文案即参数名情报),
  改走原生提交补齐

## 关联

参数删除与留空的分支差异、整数卷绕算术、交错序列等无页面
特征的配方走 intent-skills(business-logic /
credential-bruteforce)反查。
