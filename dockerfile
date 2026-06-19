#stage 1-frontend
FROM node:20-alpine AS frontend-build


WORKDIR /app

COPY ./Frontend/package*.json /app

RUN npm install

COPY ./Frontend  /app
RUN npm run build

#stage 2-fullstack


FROM node:20-alpine

WORKDIR /app

COPY ./Backend/package*.json /app

RUN npm install

COPY ./Backend /app

COPY --from=frontend-build /app/dist /app/public
EXPOSE 3000
CMD ["node", "server.js"] 