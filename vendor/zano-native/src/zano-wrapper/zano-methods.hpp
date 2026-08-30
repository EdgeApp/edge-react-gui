#ifndef ZANO_METHODS_HPP_INCLUDED
#define ZANO_METHODS_HPP_INCLUDED

#include <string>
#include <vector>

struct ZanoMethod {
  const char *name;
  int argc;
  std::string (*method)(const std::vector<std::string> &args);
};
extern const ZanoMethod zanoMethods[];
extern const unsigned zanoMethodCount;

#endif
