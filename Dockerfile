FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .
RUN npm run build --prod

FROM nginx:stable-alpine

RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/

COPY --from=build /app/dist/wind-dev-ops-plattform /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
