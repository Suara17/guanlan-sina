@echo off
REM 安全的 Docker 清理脚本
REM 只清理未使用的镜像,保护项目相关镜像

echo 🧹 安全清理 Docker 资源...
echo.

echo ⚠️  此脚本将执行以下操作:
echo    1. 清理停止的容器
echo    2. 清理未使用的网络
echo    3. 清理悬空镜像 (dangling images)
echo    4. 保护所有 guanlan-sina 相关镜像
echo.

set /p confirm="是否继续? (Y/N): "
if /i not "%confirm%"=="Y" (
    echo 操作已取消
    pause
    exit /b
)

echo.
echo 📋 清理前的项目镜像:
docker images | findstr "guanlan-sina"
echo.

echo 🧹 清理停止的容器...
docker container prune -f

echo 🧹 清理未使用的网络...
docker network prune -f

echo 🧹 清理悬空镜像...
docker image prune -f

echo.
echo ✅ 清理完成!
echo.
echo 📋 清理后的项目镜像:
docker images | findstr "guanlan-sina"
echo.

echo 💡 提示: 项目镜像已被保护,未被删除
pause
