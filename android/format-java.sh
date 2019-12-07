#!/usr/bin/env sh

here=$(dirname $0)

formatJava() {
  tool="google-java-format-1.7-all-deps.jar"
  url="https://github.com/google/google-java-format/releases/download/google-java-format-1.7/$tool"
  jar="$here/$tool"

  # If the tool is missing, grab it from GitHub:
  if [ ! -e "$jar" ]; then
    curl -L -o "$jar" "$url"
  fi

  echo $(find "$here/app/src" -name "*.java")
  java -jar "$jar" --replace $(find "$here/app/src" -name "*.java")
}

formatJava
