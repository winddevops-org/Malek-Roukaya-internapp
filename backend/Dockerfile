FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps --prefer-offline --no-audit --progress=false
COPY . .
RUN node --max_old_space_size=2048 ./node_modules/@angular/cli/bin/ng build --configuration=production --optimization || true
FROM nginx:stable-alpine
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/
COPY --from=build /app/dist/proj_ang/browser /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
