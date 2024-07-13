FROM node:lts-alpine


WORKDIR /website
RUN chown node:node /website
USER node:node
COPY --chown=node:node package-lock.json .
COPY --chown=node:node package.json .
RUN npm install

COPY --chown=node:node . .
# have to copy the .env.local file so the variables will stick in the
# build ...
RUN --mount=type=secret,id=website-env,uid=1000,gid=100 cp /run/secrets/website-env .env
RUN npm run build
CMD npm run start
