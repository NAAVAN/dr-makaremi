FROM eclipse-temurin:21-jre-alpine

ARG CANTALOUPE_VERSION=5.0.6

RUN apk add --no-cache wget curl unzip libjpeg-turbo libpng tiff

RUN mkdir -p /opt/cantaloupe /var/images /var/cache/cantaloupe \
    && wget -q https://github.com/cantaloupe-project/cantaloupe/releases/download/v${CANTALOUPE_VERSION}/cantaloupe-${CANTALOUPE_VERSION}.zip -O /tmp/cantaloupe.zip \
    && unzip -q /tmp/cantaloupe.zip -d /tmp \
    && cp /tmp/cantaloupe-${CANTALOUPE_VERSION}/cantaloupe-${CANTALOUPE_VERSION}.jar /opt/cantaloupe/cantaloupe.jar \
    && rm -rf /tmp/cantaloupe*

EXPOSE 8182

ENTRYPOINT ["java", "-Dcantaloupe.config=/etc/cantaloupe.properties", "-jar", "/opt/cantaloupe/cantaloupe.jar"]
