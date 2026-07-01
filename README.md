# Job Tracker

本项目是一个本地求职记录管理工具，包含 Chrome 和 Microsoft Edge 浏览器插件。插件可以从招聘页面读取公司、职位、投递时间、投递状态和链接，并在本地管理、筛选、编辑、导入或导出 CSV。

当前版本：`v1.4.6`

## 目录

- `outputs/job-tracker-extension/`：Chrome 插件源码目录
- `outputs/job-tracker-edge-extension/`：Microsoft Edge 插件源码目录
- `work/test_job_tracker_extension.ps1`：Chrome 插件检查脚本
- `work/test_job_tracker_edge_extension.ps1`：Edge 插件检查脚本
- `docs/`：功能规划和实现记录

## 安装 Chrome 插件

1. 打开 Chrome。
2. 进入 `chrome://extensions/`。
3. 打开“开发者模式”。
4. 点击“加载已解压的扩展程序”。
5. 选择 `outputs/job-tracker-extension`。

## 安装 Edge 插件

1. 打开 Microsoft Edge。
2. 进入 `edge://extensions/`。
3. 打开“开发人员模式”。
4. 点击“加载解压缩的扩展”。
5. 选择 `outputs/job-tracker-edge-extension`。

## 使用

1. 打开招聘职位页或投递状态页。
2. 点击插件图标，插件会预填求职记录。
3. 保存前可以手动修改公司、职位、日期、状态和备注。
4. 点击“管理器”查看全部记录，支持搜索、状态筛选、排序、状态下拉修改、CSV 导入和导出。

## 数据说明

数据保存在浏览器插件本地存储 `chrome.storage.local` 中，不会上传到服务器。卸载插件前请先在管理器里导出 CSV。

## 测试

在 PowerShell 中运行：

```powershell
Invoke-Expression -Command ([System.IO.File]::ReadAllText((Resolve-Path '.\work\test_job_tracker_extension.ps1'), [System.Text.Encoding]::UTF8))
Invoke-Expression -Command ([System.IO.File]::ReadAllText((Resolve-Path '.\work\test_job_tracker_edge_extension.ps1'), [System.Text.Encoding]::UTF8))
```
