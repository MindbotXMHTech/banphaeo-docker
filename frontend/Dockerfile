FROM node:18-alpine

WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
# Omit --production flag for TypeScript devDependencies
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm i; \
  else echo "Lockfile not found." && exit 1; \
  fi

COPY components ./components
COPY manager ./manager
COPY pages ./pages
COPY public ./public
COPY styles ./styles
COPY next.config.js .

# Environment variables must be present at build time
# https://github.com/vercel/next.js/discussions/14030

ARG NEXT_PUBLIC_HOST
ENV NEXT_PUBLIC_HOST=${NEXT_PUBLIC_HOST}
ARG NEXT_PUBLIC_SOCKET_URI
ENV NEXT_PUBLIC_SOCKET_URI=${NEXT_PUBLIC_SOCKET_URI}

# Uncomment the following line to disable telemetry at build time
# ENV NEXT_TELEMETRY_DISABLED 1

RUN yarn build

CMD yarn start
