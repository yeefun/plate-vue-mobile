ARG NODE_BASE=10.15.3-alpine
FROM node:${NODE_BASE}

# Use --no-cache to avoid rm -rf /var/cache/apk/*
RUN apk --update --no-cache add python make g++

CMD ["/bin/sh"]
