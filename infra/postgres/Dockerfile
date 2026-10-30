FROM postgres:17-alpine

RUN apk add --no-cache \
    git \
    build-base \
    clang19 \
    llvm19 \
    postgresql17-dev

# Clone and compile pgvector extension
RUN git clone --branch v0.8.0 https://github.com/pgvector/pgvector.git /tmp/pgvector \
    && cd /tmp/pgvector \
    && make \
    && make install \
    && rm -rf /tmp/pgvector \
    && apk del git build-base clang19 llvm19 postgresql17-dev
