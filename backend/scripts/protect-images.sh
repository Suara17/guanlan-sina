#!/bin/bash
# Docker 镜像保护脚本
# 用途: 防止关键镜像被意外删除

set -e

echo "🛡️ 保护 Docker 镜像..."

# 1. 为当前镜像添加版本标签
VERSION=${1:-"v$(date +%Y%m%d-%H%M%S)"}

echo "📌 添加版本标签: $VERSION"
docker tag guanlan-sina-backend:latest guanlan-sina-backend:$VERSION
docker tag guanlan-sina-prestart:latest guanlan-sina-prestart:$VERSION

# 2. 添加 stable 标签
echo "📌 添加 stable 标签"
docker tag guanlan-sina-backend:latest guanlan-sina-backend:stable
docker tag guanlan-sina-prestart:latest guanlan-sina-prestart:stable

# 3. 显示所有项目镜像
echo ""
echo "📋 当前项目镜像列表:"
docker images | grep -E "REPOSITORY|guanlan-sina"

echo ""
echo "✅ 镜像保护完成!"
echo "💡 提示:"
echo "   - latest 标签会在重新构建时被覆盖"
echo "   - $VERSION 和 stable 标签会保留历史版本"
echo "   - 使用 'docker rmi guanlan-sina-backend:$VERSION' 删除特定版本"
