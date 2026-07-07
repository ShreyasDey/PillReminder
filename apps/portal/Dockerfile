# Static web server for the Arogya pharmacy portal.
# The app is plain HTML/JSX (transpiled in-browser), so no build step is needed —
# nginx just serves the files. env.js is regenerated at container start from
# environment variables so the SAME image runs on any domain.
FROM nginx:1.27-alpine

COPY . /usr/share/nginx/html/
RUN rm -f /usr/share/nginx/html/Dockerfile /usr/share/nginx/html/nginx.conf /usr/share/nginx/html/docker-entrypoint.sh

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker-entrypoint.sh /docker-entrypoint.d/40-saathipill-env.sh
RUN chmod +x /docker-entrypoint.d/40-saathipill-env.sh

EXPOSE 80
