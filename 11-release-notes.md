# 发布说明

## 最新更改

## 0.9.0

### 新功能

* ✨ 为所有页面添加元标题支持。PR [#2039](https://github.com/fastapi/full-stack-fastapi-template/pull/2039)，作者 [@alejsdev](https://github.com/alejsdev)。
* 🛂 将前端迁移到 Shadcn。PR [#2010](https://github.com/fastapi/full-stack-fastapi-template/pull/2010)，作者 [@alejsdev](https://github.com/alejsdev)。

### 修复

* 🐛 修复 `EMAILS_FROM_NAME` 类型为 `str` 而不是 `EmailStr`。PR [#1940](https://github.com/fastapi/full-stack-fastapi-template/pull/1940)，作者 [@martin0258](https://github.com/martin0258)。
* 🐛 修复 `parse_cors` 函数，使其对于空字符串和空列表都保持一致。PR [#1672](https://github.com/fastapi/full-stack-fastapi-template/pull/1672)，作者 [@rolkotaki](https://github.com/rolkotaki)。
* 🐛 在用户选择时关闭侧边栏抽屉。PR [#1515](https://github.com/fastapi/full-stack-fastapi-template/pull/1515)，作者 [@dtellz](https://github.com/dtellz)。
* 🐛 修复编辑用户字段时所需的密码验证。PR [#1508](https://github.com/fastapi/full-stack-fastapi-template/pull/1508)，作者 [@jpizquierdo](https://github.com/jpizquierdo)。

### 重构

* ♻️ 更新密码最大长度。PR [#1447](https://github.com/fastapi/full-stack-fastapi-template/pull/1447)，作者 [@michaelAlvarino](https://github.com/michaelAlvarino)。
* 🚚 将后端测试移到 `app` 目录之外。PR [#1862](https://github.com/fastapi/full-stack-fastapi-template/pull/1862)，作者 [@YuriiMotov](https://github.com/YuriiMotov)。
* ✨ 为 Vite 环境变量添加 ImportMetaEnv 和 ImportMeta 接口。PR [#1860](https://github.com/fastapi/full-stack-fastapi-template/pull/1860)，作者 [@alejsdev](https://github.com/alejsdev)。
* 🔧 更新 `tsconfig.json` 并修复错误。PR [#1859](https://github.com/fastapi/full-stack-fastapi-template/pull/1859)，作者 [@alejsdev](https://github.com/alejsdev)。
* ♻️ 从 ChangePassword 组件的保存按钮中移除禁用属性。PR [#1844](https://github.com/fastapi/full-stack-fastapi-template/pull/1844)，作者 [@alejsdev](https://github.com/alejsdev)。
* 👷🏻‍♀️ 更新客户端生成的 CI。PR [#1573](https://github.com/fastapi/full-stack-fastapi-template/pull/1573)，作者 [@alejsdev](https://github.com/alejsdev)。
* ♻️ 从继承类中移除冗余字段。PR [#1520](https://github.com/fastapi/full-stack-fastapi-template/pull/1520)，作者 [@tzway](https://github.com/tzway)。
* 🎨 在骨架和其他组件中添加小的 UI 调整。PR [#1507](https://github.com/fastapi/full-stack-fastapi-template/pull/1507)，作者 [@alejsdev](https://github.com/alejsdev)。
* 🎨 添加小的 UI 调整。PR [#1506](https://github.com/fastapi/full-stack-fastapi-template/pull/1506)，作者 [@alejsdev](https://github.com/alejsdev)。

### 升级

* ⬆ 在 /frontend 中将 @types/react 从 19.1.12 升级到 19.1.13。PR [#1888](https://github.com/fastapi/full-stack-fastapi-template/pull/1888)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /frontend 中将 @tanstack/router-plugin 从 1.131.41 升级到 1.131.43。PR [#1887](https://github.com/fastapi/full-stack-fastapi-template/pull/1887)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /backend 中将 pydantic 从 2.11.7 升级到 2.11.9。PR [#1891](https://github.com/fastapi/full-stack-fastapi-template/pull/1891)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /frontend 中将 @chakra-ui/react 从 3.26.0 升级到 3.27.0。PR [#1890](https://github.com/fastapi/full-stack-fastapi-template/pull/1890)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /frontend 中将 axios 从 1.12.0 升级到 1.12.2。PR [#1889](https://github.com/fastapi/full-stack-fastapi-template/pull/1889)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /frontend 中将 @types/node 从 24.3.1 升级到 24.4.0。PR [#1886](https://github.com/fastapi/full-stack-fastapi-template/pull/1886)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /frontend 中将 @tanstack/router-devtools 从 1.131.41 升级到 1.131.42。PR [#1881](https://github.com/fastapi/full-stack-fastapi-template/pull/1881)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /frontend 中将 @tanstack/router-plugin 从 1.131.39 升级到 1.131.41。PR [#1879](https://github.com/fastapi/full-stack-fastapi-template/pull/1879)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /frontend 中将 @tanstack/react-query-devtools 从 5.87.3 升级到 5.87.4。PR [#1876](https://github.com/fastapi/full-stack-fastapi-template/pull/1876)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /frontend 中将 axios 从 1.11.0 升级到 1.12.0。PR [#1878](https://github.com/fastapi/full-stack-fastapi-template/pull/1878)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /frontend 中将 @tanstack/router-devtools 从 1.131.40 升级到 1.131.41。PR [#1877](https://github.com/fastapi/full-stack-fastapi-template/pull/1877)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /frontend 中将 @tanstack/react-router 从 1.131.40 升级到 1.131.41。PR [#1875](https://github.com/fastapi/full-stack-fastapi-template/pull/1875)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /frontend 中将 @tanstack/router-devtools 从 1.131.36 升级到 1.131.37。PR [#1871](https://github.com/fastapi/full-stack-fastapi-template/pull/1871)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /frontend 中将 @tanstack/router-plugin 从 1.131.36 升级到 1.131.37。PR [#1870](https://github.com/fastapi/full-stack-fastapi-template/pull/1870)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /frontend 中将 @tanstack/react-query 从 5.87.1 升级到 5.87.4。PR [#1868](https://github.com/fastapi/full-stack-fastapi-template/pull/1868)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /frontend 中将 @biomejs/biome 从 2.2.3 升级到 2.2.4。PR [#1869](https://github.com/fastapi/full-stack-fastapi-template/pull/1869)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /frontend 中将 @tanstack/react-router 从 1.131.36 升级到 1.131.37。PR [#1872](https://github.com/fastapi/full-stack-fastapi-template/pull/1872)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆️ 将 Biome 升级到最新版本。PR [#1861](https://github.com/fastapi/full-stack-fastapi-template/pull/1861)，作者 [@alejsdev](https://github.com/alejsdev)。
* ⬆️ 更新 TansTack Router 依赖项。PR [#1853](https://github.com/fastapi/full-stack-fastapi-template/pull/1853)，作者 [@alejsdev](https://github.com/alejsdev)。
* ⬆️ 将 @tanstack/react-query 从 5.28.14 升级到 5.87.1。PR [#1852](https://github.com/fastapi/full-stack-fastapi-template/pull/1852)，作者 [@alejsdev](https://github.com/alejsdev)。
* ⬆ 在 /frontend 中将 @chakra-ui/react 从 3.8.0 升级到 3.26.0。PR [#1796](https://github.com/fastapi/full-stack-fastapi-template/pull/1796)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆️ 更新 @hey-api/openapi-ts 依赖版本并更新 dependabot 配置。PR [#1845](https://github.com/fastapi/full-stack-fastapi-template/pull/1845)，作者 [@alejsdev](https://github.com/alejsdev)。
* ⬆️ 更新 Playwright。PR [#1793](https://github.com/fastapi/full-stack-fastapi-template/pull/1793)，作者 [@alejsdev](https://github.com/alejsdev)。
* ⬆️ 升级 React 和相关依赖项。PR [#1843](https://github.com/fastapi/full-stack-fastapi-template/pull/1843)，作者 [@alejsdev](https://github.com/alejsdev)。

### 文档

* 📝 添加用于本地电子邮件测试的 Mailcatcher 设置说明。PR [#2038](https://github.com/fastapi/full-stack-fastapi-template/pull/2038)，作者 [@alejsdev](https://github.com/alejsdev)。
* 📝 更新 `README` 以包含 Vite 的链接。PR [#2037](https://github.com/fastapi/full-stack-fastapi-template/pull/2037)，作者 [@alejsdev](https://github.com/alejsdev)。
* 📝 修复过时的工作流程徽章。PR [#2028](https://github.com/fastapi/full-stack-fastapi-template/pull/2028)，作者 [@AymanAlSuleihi](https://github.com/AymanAlSuleihi)。
* 📝 更新文档。PR [#2036](https://github.com/fastapi/full-stack-fastapi-template/pull/2036)，作者 [@alejsdev](https://github.com/alejsdev)。
* ✏️ 修复 `deployment.md` 中的小拼写错误。PR [#1679](https://github.com/fastapi/full-stack-fastapi-template/pull/1679)，作者 [@cassmtnr](https://github.com/cassmtnr)。

### 内部

* 🔥 移除未使用的依赖项。PR [#2035](https://github.com/fastapi/full-stack-fastapi-template/pull/2035)，作者 [@alejsdev](https://github.com/alejsdev)。
* ⬆ 在 /frontend 中将 react-dom 从 19.2.0 升级到 19.2.1。PR [#2032](https://github.com/fastapi/full-stack-fastapi-template/pull/2032)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /frontend 中将 vite 从 7.2.6 升级到 7.2.7。PR [#2033](https://github.com/fastapi/full-stack-fastapi-template/pull/2033)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /frontend 中将 @tanstack/router-plugin 从 1.139.12 升级到 1.140.0。PR [#2034](https://github.com/fastapi/full-stack-fastapi-template/pull/2034)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /frontend 中将 lucide-react 从 0.555.0 升级到 0.556.0。PR [#2031](https://github.com/fastapi/full-stack-fastapi-template/pull/2031)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* 🔧 在 biome 配置中添加 Tailwind CSS 指令支持。PR [#2029](https://github.com/fastapi/full-stack-fastapi-template/pull/2029)，作者 [@alejsdev](https://github.com/alejsdev)。
* ⬆ 在 /frontend 中将 react-hook-form 从 7.66.1 升级到 7.67.0。PR [#2018](https://github.com/fastapi/full-stack-fastapi-template/pull/2018)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /frontend 中将 @tanstack/react-query 从 5.90.10 升级到 5.90.11。PR [#2019](https://github.com/fastapi/full-stack-fastapi-template/pull/2019)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /frontend 中将 axios 从 1.12.2 升级到 1.13.2。PR [#2020](https://github.com/fastapi/full-stack-fastapi-template/pull/2020)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /frontend 中将 @tanstack/router-devtools 从 1.139.3 升级到 1.139.12。PR [#2021](https://github.com/fastapi/full-stack-fastapi-template/pull/2021)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /frontend 中将 playwright 从 v1.56.1-noble 升级到 v1.57.0-noble。PR [#2016](https://github.com/fastapi/full-stack-fastapi-template/pull/2016)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆️ 更新 `biome.json` 中的架构版本。PR [#2017](https://github.com/fastapi/full-stack-fastapi-template/pull/2017)，作者 [@alejsdev](https://github.com/alejsdev)。
* ⬆ 在 /frontend 中将 vite 从 7.2.2 升级到 7.2.6。PR [#2015](https://github.com/fastapi/full-stack-fastapi-template/pull/2015)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /frontend 中将 @biomejs/biome 从 2.3.7 升级到 2.3.8。PR [#2014](https://github.com/fastapi/full-stack-fastapi-template/pull/2014)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /frontend 中将 @tanstack/react-query-devtools 从 5.91.0 升级到 5.91.1。PR [#2013](https://github.com/fastapi/full-stack-fastapi-template/pull/2013)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /frontend 中将 @tanstack/router-plugin 从 1.133.15 升级到 1.139.12。PR [#2012](https://github.com/fastapi/full-stack-fastapi-template/pull/2012)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /frontend 中将 form-data 从 4.0.4 升级到 4.0.5。PR [#2011](https://github.com/fastapi/full-stack-fastapi-template/pull/2011)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 将 actions/checkout 从 5 升级到 6。PR [#2007](https://github.com/fastapi/full-stack-fastapi-template/pull/2007)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /frontend 中将 @types/react 从 19.2.2 升级到 19.2.7。PR [#2003](https://github.com/fastapi/full-stack-fastapi-template/pull/2003)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /frontend 中将 @tanstack/router-devtools 从 1.131.42 升级到 1.139.3。PR [#2001](https://github.com/fastapi/full-stack-fastapi-template/pull/2001)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /frontend 中将 typescript 从 5.9.2 升级到 5.9.3。PR [#2002](https://github.com/fastapi/full-stack-fastapi-template/pull/2002)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /frontend 中将 @types/react-dom 从 19.2.2 升级到 19.2.3。PR [#2004](https://github.com/fastapi/full-stack-fastapi-template/pull/2004)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /frontend 中将 @types/node 从 24.10.0 升级到 24.10.1。PR [#2005](https://github.com/fastapi/full-stack-fastapi-template/pull/2005)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /backend 中将 pydantic-settings 从 2.11.0 升级到 2.12.0。PR [#2000](https://github.com/fastapi/full-stack-fastapi-template/pull/2000)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /backend 中将 alembic 从 1.17.1 升级到 1.17.2。PR [#1999](https://github.com/fastapi/full-stack-fastapi-template/pull/1999)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /frontend 中将 @biomejs/biome 从 2.2.4 升级到 2.3.7。PR [#1998](https://github.com/fastapi/full-stack-fastapi-template/pull/1998)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /frontend 中将 react-hook-form 从 7.66.0 升级到 7.66.1。PR [#1997](https://github.com/fastapi/full-stack-fastapi-template/pull/1997)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /frontend 中将 @vitejs/plugin-react-swc 从 4.2.1 升级到 4.2.2。PR [#1996](https://github.com/fastapi/full-stack-fastapi-template/pull/1996)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /frontend 中将 @chakra-ui/react 从 3.29.0 升级到 3.30.0。PR [#1995](https://github.com/fastapi/full-stack-fastapi-template/pull/1995)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /frontend 中将 @tanstack/react-query-devtools 从 5.90.2 升级到 5.91.0。PR [#1994](https://github.com/fastapi/full-stack-fastapi-template/pull/1994)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* 🔧 为 Dependabot 更新添加标签。PR [#1992](https://github.com/fastapi/full-stack-fastapi-template/pull/1992)，作者 [@alejsdev](https://github.com/alejsdev)。
* ⬆ 在 /frontend 中将 dotenv 从 17.2.2 升级到 17.2.3。PR [#1957](https://github.com/fastapi/full-stack-fastapi-template/pull/1957)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /frontend 中将 @chakra-ui/react 从 3.27.0 升级到 3.29.0。PR [#1974](https://github.com/fastapi/full-stack-fastapi-template/pull/1974)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /frontend 中将 @types/react-dom 从 19.2.1 升级到 19.2.2。PR [#1975](https://github.com/fastapi/full-stack-fastapi-template/pull/1975)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /frontend 中将 @tanstack/react-query 从 5.90.2 升级到 5.90.7。PR [#1976](https://github.com/fastapi/full-stack-fastapi-template/pull/1976)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /frontend 中将 vite 从 7.1.11 升级到 7.2.2。PR [#1977](https://github.com/fastapi/full-stack-fastapi-template/pull/1977)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /backend 中将 pydantic 从 2.12.3 升级到 2.12.4。PR [#1978](https://github.com/fastapi/full-stack-fastapi-template/pull/1978)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /frontend 中将 js-yaml 从 4.1.0 升级到 4.1.1。PR [#1983](https://github.com/fastapi/full-stack-fastapi-template/pull/1983)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 将 actions/checkout 从 5 升级到 6。PR [#1988](https://github.com/fastapi/full-stack-fastapi-template/pull/1988)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* 👷 升级 `latest-changes` GitHub Action 并固定 `actions/checkout@v5`。PR [#2006](https://github.com/fastapi/full-stack-fastapi-template/pull/2006)，作者 [@svlandeg](https://github.com/svlandeg)。
* ⬆ 在 /frontend 中将 @vitejs/plugin-react-swc 从 4.1.0 升级到 4.2.0。PR [#1958](https://github.com/fastapi/full-stack-fastapi-template/pull/1958)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 将 actions/download-artifact 从 5 升级到 6。PR [#1959](https://github.com/fastapi/full-stack-fastapi-template/pull/1959)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /frontend 中将 @types/node 从 24.5.2 升级到 24.9.1。PR [#1961](https://github.com/fastapi/full-stack-fastapi-template/pull/1961)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 将 actions/upload-artifact 从 4 升级到 5。PR [#1962](https://github.com/fastapi/full-stack-fastapi-template/pull/1962)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /frontend 中将 react-hook-form 从 7.62.0 升级到 7.65.0。PR [#1964](https://github.com/fastapi/full-stack-fastapi-template/pull/1964)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /backend 中将 alembic 从 1.17.0 升级到 1.17.1。PR [#1970](https://github.com/fastapi/full-stack-fastapi-template/pull/1970)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* 🔧 修复 issue-manager 配置以进行提醒。PR [#1972](https://github.com/fastapi/full-stack-fastapi-template/pull/1972)，作者 [@tiangolo](https://github.com/tiangolo)。
* ⬆ 在 /frontend 中将 @vitejs/plugin-react-swc 从 4.0.1 升级到 4.1.0。PR [#1897](https://github.com/fastapi/full-stack-fastapi-template/pull/1897)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /frontend 中将 playwright 从 v1.55.0-noble 升级到 v1.56.1-noble。PR [#1943](https://github.com/fastapi/full-stack-fastapi-template/pull/1943)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* 🔧 在 `issue-manager` 中为 `waiting` 标签配置提醒。PR [#1939](https://github.com/fastapi/full-stack-fastapi-template/pull/1939)，作者 [@YuriiMotov](https://github.com/YuriiMotov)。
* ⬆ 在 /frontend 中将 vite 从 7.1.9 升级到 7.1.11。PR [#1949](https://github.com/fastapi/full-stack-fastapi-template/pull/1949)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /backend 中将 pydantic 从 2.11.10 升级到 2.12.3。PR [#1947](https://github.com/fastapi/full-stack-fastapi-template/pull/1947)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /frontend 中升级 react-dom 和 @types/react-dom。PR [#1934](https://github.com/fastapi/full-stack-fastapi-template/pull/1934)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /backend 中将 alembic 从 1.16.5 升级到 1.17.0。PR [#1935](https://github.com/fastapi/full-stack-fastapi-template/pull/1935)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 将 actions/setup-node 从 5 升级到 6。PR [#1937](https://github.com/fastapi/full-stack-fastapi-template/pull/1937)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /frontend 中将 @tanstack/router-plugin 从 1.132.41 升级到 1.133.15。PR [#1946](https://github.com/fastapi/full-stack-fastapi-template/pull/1946)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 将 astral-sh/setup-uv 从 6 升级到 7。PR [#1925](https://github.com/fastapi/full-stack-fastapi-template/pull/1925)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /frontend 中将 vite 从 7.1.7 升级到 7.1.9。PR [#1919](https://github.com/fastapi/full-stack-fastapi-template/pull/1919)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /frontend 中将 @tanstack/router-plugin 从 1.131.44 升级到 1.132.41。PR [#1920](https://github.com/fastapi/full-stack-fastapi-template/pull/1920)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /frontend 中将 @tanstack/react-query-devtools 从 5.87.4 升级到 5.90.2。PR [#1921](https://github.com/fastapi/full-stack-fastapi-template/pull/1921)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /backend 中将 pydantic 从 2.11.9 升级到 2.11.10。PR [#1922](https://github.com/fastapi/full-stack-fastapi-template/pull/1922)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 将 tiangolo/issue-manager 从 0.5.1 升级到 0.6.0。PR [#1912](https://github.com/fastapi/full-stack-fastapi-template/pull/1912)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /frontend 中将 @types/react 从 19.1.13 升级到 19.1.15。PR [#1906](https://github.com/fastapi/full-stack-fastapi-template/pull/1906)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /backend 中将 pydantic-settings 从 2.10.1 升级到 2.11.0。PR [#1907](https://github.com/fastapi/full-stack-fastapi-template/pull/1907)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /frontend 中将 @tanstack/react-query 从 5.90.1 升级到 5.90.2。PR [#1905](https://github.com/fastapi/full-stack-fastapi-template/pull/1905)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /frontend 中将 @types/node 从 24.4.0 升级到 24.5.2。PR [#1903](https://github.com/fastapi/full-stack-fastapi-template/pull/1903)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /frontend 中将 vite 从 7.1.5 升级到 7.1.7。PR [#1893](https://github.com/fastapi/full-stack-fastapi-template/pull/1893)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /frontend 中将 @tanstack/react-query 从 5.87.4 升级到 5.90.1。PR [#1896](https://github.com/fastapi/full-stack-fastapi-template/pull/1896)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /frontend 中将 @tanstack/react-router 从 1.131.44 升级到 1.131.50。PR [#1894](https://github.com/fastapi/full-stack-fastapi-template/pull/1894)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* 🔧 更新 dependabot uv 和 npm 依赖项的间隔为每周。PR [#1880](https://github.com/fastapi/full-stack-fastapi-template/pull/1880)，作者 [@alejsdev](https://github.com/alejsdev)。
* ⬆ 在 /backend 中将 pydantic 从 2.9.2 升级到 2.11.7。PR [#1864](https://github.com/fastapi/full-stack-fastapi-template/pull/1864)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* 🔧 更新覆盖率配置并简化测试脚本。PR [#1867](https://github.com/fastapi/full-stack-fastapi-template/pull/1867)，作者 [@alejsdev](https://github.com/alejsdev)。
* 🔧 将 T201 规则添加到 ruff 检查配置中，以禁止打印语句。PR [#1865](https://github.com/fastapi/full-stack-fastapi-template/pull/1865)，作者 [@alejsdev](https://github.com/alejsdev)。
* ⬆ 在 /frontend 中将 @tanstack/react-query-devtools 从 5.87.1 升级到 5.87.3。PR [#1863](https://github.com/fastapi/full-stack-fastapi-template/pull/1863)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /frontend 中将 vite 从 6.3.4 升级到 7.1.5。PR [#1857](https://github.com/fastapi/full-stack-fastapi-template/pull/1857)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /frontend 中将 @types/node 从 22.15.3 升级到 24.3.1。PR [#1854](https://github.com/fastapi/full-stack-fastapi-template/pull/1854)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /frontend 中将 @vitejs/plugin-react-swc 从 3.9.0 升级到 4.0.1。PR [#1856](https://github.com/fastapi/full-stack-fastapi-template/pull/1856)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /frontend 中将 axios 从 1.9.0 升级到 1.11.0。PR [#1855](https://github.com/fastapi/full-stack-fastapi-template/pull/1855)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /backend 中将 alembic 从 1.15.2 升级到 1.16.5。PR [#1847](https://github.com/fastapi/full-stack-fastapi-template/pull/1847)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /backend 中将 email-validator 从 2.2.0 升级到 2.3.0。PR [#1850](https://github.com/fastapi/full-stack-fastapi-template/pull/1850)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /backend 中将 pydantic-settings 从 2.9.1 升级到 2.10.1。PR [#1851](https://github.com/fastapi/full-stack-fastapi-template/pull/1851)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /frontend 中将 react-error-boundary 从 5.0.0 升级到 6.0.0。PR [#1849](https://github.com/fastapi/full-stack-fastapi-template/pull/1849)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /frontend 中将 @tanstack/react-query-devtools 从 5.74.9 升级到 5.87.1。PR [#1848](https://github.com/fastapi/full-stack-fastapi-template/pull/1848)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /frontend 中将 dotenv 从 16.4.5 升级到 17.2.2。PR [#1846](https://github.com/fastapi/full-stack-fastapi-template/pull/1846)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /frontend 中将 node 从 20 升级到 24。PR [#1621](https://github.com/fastapi/full-stack-fastapi-template/pull/1621)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 将 actions/labeler 从 5 升级到 6。PR [#1839](https://github.com/fastapi/full-stack-fastapi-template/pull/1839)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 将 actions/setup-python 从 5 升级到 6。PR [#1835](https://github.com/fastapi/full-stack-fastapi-template/pull/1835)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 将 actions/setup-node 从 4 升级到 5。PR [#1836](https://github.com/fastapi/full-stack-fastapi-template/pull/1836)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* 👷 自动检测和标记 PR 上的合并冲突。PR [#1838](https://github.com/fastapi/full-stack-fastapi-template/pull/1838)，作者 [@svlandeg](https://github.com/svlandeg)。
* 🔧 添加前端检查器预提交挂钩。PR [#1791](https://github.com/fastapi/full-stack-fastapi-template/pull/1791)，作者 [@alexrockhill](https://github.com/alexrockhill)。
* ⬆ 在 /frontend 中将 form-data 从 4.0.2 升级到 4.0.4。PR [#1725](https://github.com/fastapi/full-stack-fastapi-template/pull/1725)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 将 actions/checkout 从 4 升级到 5。PR [#1768](https://github.com/fastapi/full-stack-fastapi-template/pull/1768)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 将 actions/download-artifact 从 4 升级到 5。PR [#1754](https://github.com/fastapi/full-stack-fastapi-template/pull/1754)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 将 tiangolo/latest-changes 从 0.3.2 升级到 0.4.0。PR [#1744](https://github.com/fastapi/full-stack-fastapi-template/pull/1744)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /backend 中将 bcrypt 从 4.0.1 升级到 4.3.0。PR [#1601](https://github.com/fastapi/full-stack-fastapi-template/pull/1601)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /frontend 中将 react-error-boundary 从 4.0.13 升级到 5.0.0。PR [#1602](https://github.com/fastapi/full-stack-fastapi-template/pull/1602)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /frontend 中将 vite 从 6.3.3 升级到 6.3.4。PR [#1608](https://github.com/fastapi/full-stack-fastapi-template/pull/1608)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /frontend 中将 @playwright/test 从 1.45.2 升级到 1.52.0。PR [#1586](https://github.com/fastapi/full-stack-fastapi-template/pull/1586)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /backend 中将 pydantic-settings 从 2.5.2 升级到 2.9.1。PR [#1589](https://github.com/fastapi/full-stack-fastapi-template/pull/1589)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /frontend 中将 next-themes 从 0.4.4 升级到 0.4.6。PR [#1598](https://github.com/fastapi/full-stack-fastapi-template/pull/1598)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /frontend 中将 @types/node 从 20.10.5 升级到 22.15.3。PR [#1599](https://github.com/fastapi/full-stack-fastapi-template/pull/1599)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /frontend 中将 @tanstack/react-query-devtools 从 5.28.14 升级到 5.74.9。PR [#1597](https://github.com/fastapi/full-stack-fastapi-template/pull/1597)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /backend 中将 sqlmodel 从 0.0.22 升级到 0.0.24。PR [#1596](https://github.com/fastapi/full-stack-fastapi-template/pull/1596)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /backend 中将 python-multipart 从 0.0.10 升级到 0.0.20。PR [#1595](https://github.com/fastapi/full-stack-fastapi-template/pull/1595)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /backend 中将 alembic 从 1.13.2 升级到 1.15.2。PR [#1594](https://github.com/fastapi/full-stack-fastapi-template/pull/1594)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 将 postgres 从 12 升级到 17。PR [#1580](https://github.com/fastapi/full-stack-fastapi-template/pull/1580)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /frontend 中将 axios 从 1.8.2 升级到 1.9.0。PR [#1592](https://github.com/fastapi/full-stack-fastapi-template/pull/1592)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /frontend 中将 react-icons 从 5.4.0 升级到 5.5.0。PR [#1581](https://github.com/fastapi/full-stack-fastapi-template/pull/1581)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /backend 中将 jinja2 从 3.1.4 升级到 3.1.6。PR [#1591](https://github.com/fastapi/full-stack-fastapi-template/pull/1591)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /backend 中将 pyjwt 从 2.9.0 升级到 2.10.1。PR [#1588](https://github.com/fastapi/full-stack-fastapi-template/pull/1588)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /backend 中将 httpx 从 0.27.2 升级到 0.28.1。PR [#1587](https://github.com/fastapi/full-stack-fastapi-template/pull/1587)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
* ⬆ 在 /frontend 中将 form-data 从 4.0.0 升级到 4.0.2。PR [#1578](https://github.com/fastapi/full-stack-fastapi-template/pull/1578)，作者 [@dependabot[bot]](https://github.com/apps/dependabot)。
