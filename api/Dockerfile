FROM node:lts-alpine


WORKDIR /api
RUN chown node:node /api
USER node:node
COPY --chown=node:node package.json .
COPY --chown=node:node package-lock.json .
RUN npm install

COPY --chown=node:node . .
CMD npm run prod
