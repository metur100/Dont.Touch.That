/**
 * Config plugin: signs release builds with the app's upload key.
 *
 * The keystore and passwords never live in the repository. They are read at build time from Gradle
 * properties, normally `~/.gradle/gradle.properties`, using a prefix derived from the app slug,
 * e.g. for the slug `sira`:
 *
 *   SIRA_UPLOAD_STORE_FILE=C:/Users/me/keystore/sira
 *   SIRA_UPLOAD_STORE_PASSWORD=...
 *   SIRA_UPLOAD_KEY_ALIAS=sira.key
 *   SIRA_UPLOAD_KEY_PASSWORD=...
 *
 * When the properties are missing the release build falls back to the debug key, so local builds
 * keep working on machines without the upload key.
 */
const { withAppBuildGradle } = require('expo/config-plugins');

const MARKER = '// withReleaseSigning: upload key from Gradle properties';

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (cfg) => {
    const prefix = (cfg.slug ?? 'app').toUpperCase().replace(/[^A-Z0-9]+/g, '_');
    let contents = cfg.modResults.contents;
    if (contents.includes(MARKER)) return cfg;

    contents = contents.replace(
      /signingConfigs \{\n/,
      `signingConfigs {
        ${MARKER}
        if (findProperty('${prefix}_UPLOAD_STORE_FILE')) {
            release {
                storeFile file(findProperty('${prefix}_UPLOAD_STORE_FILE'))
                storePassword findProperty('${prefix}_UPLOAD_STORE_PASSWORD')
                keyAlias findProperty('${prefix}_UPLOAD_KEY_ALIAS')
                keyPassword findProperty('${prefix}_UPLOAD_KEY_PASSWORD')
            }
        }
`,
    );
    contents = contents.replace(
      /(release \{\n(?:\s*\/\/.*\n)*)(\s*)signingConfig signingConfigs\.debug/,
      `$1$2signingConfig findProperty('${prefix}_UPLOAD_STORE_FILE') ? signingConfigs.release : signingConfigs.debug`,
    );
    cfg.modResults.contents = contents;
    return cfg;
  });
};
