# 花火大会程序数据说明

本模拟器的大会模式不再随机发射，而按主办方公开程序推进。画面右上角显示当前节目、实际公布发数与下一节目。

## 当前基准

- **长冈祭大花火（2025・8月3日）**：从「白菊 10号3发」开始，依次纳入尼亚加拉／超大型星矿、10号28发、复兴祈愿花火凤凰、10号80发、10号60连发、正三尺玉3连发、正三尺玉、7号12发＋10号12发，最后为米百俵花火・尺玉100连发。
  - 官方程序：https://nagaokamatsuri.com/img/nagaoka_fw_2025_program_august3.pdf
  - 凤凰规格（约5分钟、9处、约2 km）：https://nagaokamatsuri.com/topics/799.html
- **大曲全国花火竞技大会（第97回・2025）**：按官方夜花火28家打上顺序推进；每家为10号芯入割物1发、10号自由玉1发、创作花火1组，终章采用大会提供花火《交响诗 芬兰颂》。
  - 官方打上顺序：https://www.oomagari-hanabi.com/images/97fireworks_om.pdf
  - 大仙市大会概要：https://www.city.daisen.lg.jp/uploads/contents/archive_0000000505_01/250731_press_01.pdf
- **隅田川花火大会（第48回・2025）**：使用官方时刻表与分段发数；第一会场9,507发、第二会场10,650发，合计20,157发。第一会场竞技花火为10家公司、每家约20发。
  - 官方程序：https://sumida-web-static.azurewebsites.net/program/index.html
- **诹访湖祭湖上花火大会（第77回・2025）**：按官方简明程序顺序，从 Welcome to Suwa／追悼花火、Music Gradation、9组竞技作品，进入水上大型星矿及 Kiss of Fire 终幕。
  - 官方程序：https://suwako-hanabi.com/wp-content/uploads/2025/07/77pg_simplifield.pdf
- **琉球海炎祭（2026）**：按官方公布曲序推进：开幕、DJ yori、北斋、小筱顺子设计、冲绳与亚洲六曲、Imagine／My Way、唐船ドーイ。官方公开的是全篇约10,000发、约1小时，并未公开每首曲目的独立发数。
  - 官方曲序与规格：https://www.ryukyu-kaiensai.com/about/

## 渲染比例

“实际发数”与“GPU粒子数”分开保存。浏览器（尤其手机）不会真的同时建立20,157个完整烟花壳体；程序保持**官方顺序、发数标签、会场结构、同步发射关系和相对密度**，以少量高粒子量烟花代表真实批次。没有公开分段发数的节目不会伪造数字。
