/**
 * Config plugin: makes local Android release builds reliable on Windows.
 *
 * 1. The Kotlin compile daemon can crash on large Expo projects ("Unexpected exception thrown"),
 *    which leaves Gradle hanging; compiling Kotlin in-process with a larger heap avoids that.
 * 2. Windows limits paths to 260 characters. CMake object files embed the full source path inside
 *    the `.cxx` staging folder, which overflows for longer project paths. On Windows the staging
 *    folder is moved to a short location at the root of the project's drive.
 */
const { withAppBuildGradle, withGradleProperties } = require('expo/config-plugins');

const PROPERTIES = {
  'kotlin.compiler.execution.strategy': 'in-process',
  'org.gradle.jvmargs': '-Xmx4g -XX:MaxMetaspaceSize=1g -Dfile.encoding=UTF-8',
};

const MARKER = '// withStableAndroidBuild: short CMake staging directory';

module.exports = function withStableAndroidBuild(config) {
  config = withGradleProperties(config, (cfg) => {
    for (const [key, value] of Object.entries(PROPERTIES)) {
      const existing = cfg.modResults.find((item) => item.type === 'property' && item.key === key);
      if (existing) existing.value = value;
      else cfg.modResults.push({ type: 'property', key, value });
    }
    return cfg;
  });

  return withAppBuildGradle(config, (cfg) => {
    const slug = cfg.slug ?? 'app';
    if (!cfg.modResults.contents.includes(MARKER)) {
      cfg.modResults.contents = cfg.modResults.contents.replace(
        /android \{\n/,
        `android {
    ${MARKER}
    if (System.getProperty("os.name").toLowerCase().contains("windows")) {
        externalNativeBuild {
            cmake {
                buildStagingDirectory = new File(rootDir.toPath().getRoot().toFile(), "cxx/${slug}")
            }
        }
    }
`,
      );
    }
    return cfg;
  });
};
