# Docker 基础设施

该目录拥有本地 Docker Compose 开发所用的 Dockerfile。
这些镜像面向开发且刻意保持最小：安装现有 Node 或 Python 依赖，复制仓库，并运行 `docker-compose.yml` 中声明的命令。

## 所有权

- `frontend.Dockerfile` 支持 `frontend` Compose 服务和 `pnpm dev:h5` 工作流。
- `backend.Dockerfile` 支持 `backend` Compose 服务和 FastAPI `uvicorn` 工作流。

## 依赖边界

- Dockerfile 可以从 `package.json`、`pnpm-lock.yaml` 和 `pyproject.toml` 安装仓库依赖。
- Dockerfile 不应定义属于源码包、服务模块或契约文件的应用行为。
- 该目录不得为 `services/*` 引入容器；这些目录目前是领域边界，不是本地基础设施进程。

## 演进路径

1. Dockerfile 首先保持适合本地开发。
2. 只有生产镜像需求被定义后，才添加构建阶段。
3. 如果多个运行时镜像开始重复相同设置，再把共享镜像约定移动到该目录。
