@echo off
REM Docker 镜像保护脚本 (Windows 版本)
REM 用途: 防止关键镜像被意外删除

setlocal enabledelayedexpansion

echo 🛡️ 保护 Docker 镜像...
echo.

REM 1. 获取版本号 (使用参数或时间戳)
if "%~1"=="" (
    for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c%%a%%b)
    for /f "tokens=1-2 delims=/:" %%a in ('time /t') do (set mytime=%%a%%b)
    set VERSION=v!mydate!-!mytime!
) else (
    set VERSION=%~1
)

echo 📌 添加版本标签: %VERSION%
docker tag guanlan-sina-backend:latest guanlan-sina-backend:%VERSION%
docker tag guanlan-sina-prestart:latest guanlan-sina-prestart:%VERSION%

REM 2. 添加 stable 标签
echo 📌 添加 stable 标签
docker tag guanlan-sina-backend:latest guanlan-sina-backend:stable
docker tag guanlan-sina-prestart:latest guanlan-sina-prestart:stable

REM 3. 显示所有项目镜像
echo.
echo 📋 当前项目镜像列表:
docker images | findstr "REPOSITORY guanlan-sina"

echo.
echo ✅ 镜像保护完成!
echo 💡 提示:
echo    - latest 标签会在重新构建时被覆盖
echo    - %VERSION% 和 stable 标签会保留历史版本
echo    - 使用 'docker rmi guanlan-sina-backend:%VERSION%' 删除特定版本
echo.

pause
