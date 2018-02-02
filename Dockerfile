FROM node:6.3-slim

RUN groupadd user && useradd --create-home --home-dir /home/user -g user user

ENV NODE_SOURCE /usr/src/

WORKDIR $NODE_SOURCE

COPY . $NODE_SOURCE/

RUN set -x \
	&& apt-get update \
	&& apt-get install -y git \
	&& apt-get install -y libhiredis-dev \
	&& apt-get install -y node-gyp \
	&& rm -rf /var/lib/apt/lists/*

RUN buildDeps=' \
	gcc \
	make \
	python \
	' \
	&& set -x \
	&& apt-get update && apt-get install -y $buildDeps --no-install-recommends && rm -rf /var/lib/apt/lists/* \
	&& npm install \
	&& npm run build

EXPOSE 3000
CMD ["npm", "start"]