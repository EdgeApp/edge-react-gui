#include <napi.h>

#include "zano-methods.hpp"

#include <condition_variable>
#include <functional>
#include <mutex>
#include <queue>
#include <stdexcept>
#include <string>
#include <thread>
#include <utility>
#include <vector>

namespace {

struct Job {
  std::string method;
  std::vector<std::string> args;
  std::function<void(std::string result, std::string error)> complete;
};

class SerialExecutor {
 public:
  SerialExecutor() { thread_ = std::thread([this] { run(); }); }

  ~SerialExecutor() {
    {
      std::lock_guard<std::mutex> lock(mu_);
      stop_ = true;
    }
    cv_.notify_all();
    if (thread_.joinable()) thread_.join();
  }

  void enqueue(Job job) {
    {
      std::lock_guard<std::mutex> lock(mu_);
      jobs_.push(std::move(job));
    }
    cv_.notify_one();
  }

 private:
  static std::string dispatch(
    const std::string &method,
    const std::vector<std::string> &args
  ) {
    for (unsigned i = 0; i < zanoMethodCount; ++i) {
      if (zanoMethods[i].name != method) continue;
      if (
        zanoMethods[i].argc != -1 &&
        static_cast<int>(args.size()) != zanoMethods[i].argc
      ) {
        throw std::runtime_error("zano incorrect C++ argument count");
      }
      return zanoMethods[i].method(args);
    }
    throw std::runtime_error("No zano C++ method " + method);
  }

  void run() {
    while (true) {
      Job job;
      {
        std::unique_lock<std::mutex> lock(mu_);
        cv_.wait(lock, [&] { return stop_ || !jobs_.empty(); });
        if (stop_ && jobs_.empty()) return;
        job = std::move(jobs_.front());
        jobs_.pop();
      }
      try {
        job.complete(dispatch(job.method, job.args), "");
      } catch (const std::exception &e) {
        job.complete("", e.what());
      } catch (...) {
        job.complete("", "zano threw a C++ exception");
      }
    }
  }

  std::mutex mu_;
  std::condition_variable cv_;
  std::queue<Job> jobs_;
  std::thread thread_;
  bool stop_ = false;
};

SerialExecutor *g_queue = nullptr;

struct CallResult {
  Napi::Promise::Deferred deferred;
  std::string value;
  std::string error;
  Napi::ThreadSafeFunction tsfn;

  CallResult(Napi::Promise::Deferred deferred_, Napi::ThreadSafeFunction tsfn_)
    : deferred(deferred_), tsfn(tsfn_) {}
};

} // namespace

static Napi::Value CallZano(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();
  if (info.Length() < 2 || !info[0].IsString() || !info[1].IsArray()) {
    Napi::TypeError::New(env, "callZano(method, string[]) expected")
      .ThrowAsJavaScriptException();
    return env.Undefined();
  }

  const std::string method = info[0].As<Napi::String>().Utf8Value();
  const Napi::Array arr = info[1].As<Napi::Array>();
  std::vector<std::string> args;
  args.reserve(arr.Length());
  for (uint32_t i = 0; i < arr.Length(); ++i) {
    Napi::Value value = arr.Get(i);
    if (!value.IsString()) {
      Napi::TypeError::New(env, "callZano arguments must be strings")
        .ThrowAsJavaScriptException();
      return env.Undefined();
    }
    args.push_back(value.As<Napi::String>().Utf8Value());
  }

  auto deferred = Napi::Promise::Deferred::New(env);
  Napi::ThreadSafeFunction tsfn = Napi::ThreadSafeFunction::New(
    env,
    Napi::Function::New(env, [](const Napi::CallbackInfo &) {}),
    "zano-call-complete",
    0,
    1
  );

  auto *result = new CallResult(deferred, tsfn);

  g_queue->enqueue(
    Job{
      method,
      std::move(args),
      [result](std::string value, std::string error) {
        result->value = std::move(value);
        result->error = std::move(error);
        result->tsfn.BlockingCall(result, [](Napi::Env env, Napi::Function, CallResult *r) {
          if (r->error.empty()) {
            r->deferred.Resolve(Napi::String::New(env, r->value));
          } else {
            r->deferred.Reject(Napi::Error::New(env, r->error).Value());
          }
          r->tsfn.Release();
          delete r;
        });
      }
    }
  );

  return deferred.Promise();
}

static Napi::Value GetMethodNames(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();
  Napi::Array out = Napi::Array::New(env, zanoMethodCount);
  for (unsigned i = 0; i < zanoMethodCount; ++i) {
    out.Set(i, Napi::String::New(env, zanoMethods[i].name));
  }
  return out;
}

static Napi::Object Init(Napi::Env env, Napi::Object exports) {
  if (g_queue == nullptr) g_queue = new SerialExecutor();

  exports.Set("callZano", Napi::Function::New(env, CallZano));
  exports.Set("methodNames", Napi::Function::New(env, GetMethodNames));
  return exports;
}

NODE_API_MODULE(zano, Init)
