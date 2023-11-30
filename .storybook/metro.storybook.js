const path = require("path");
module.exports = {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: false,
      },
    }),
  },
  resolver: {
    resolverMainFields: ["sbmodern", "react-native", "browser", "main"],
  },
  watchFolders: [path.resolve(__dirname, "..")],
};