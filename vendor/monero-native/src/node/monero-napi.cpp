#include <napi.h>

#include "monero-methods.hpp"

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
    for (unsigned i = 0; i < moneroMethodCount; ++i) {
      if (moneroMethods[i].name != method) continue;
      if (
        moneroMethods[i].argc != -1 &&
        static_cast<int>(args.size()) != moneroMethods[i].argc
      ) {
        throw std::runtime_error("monero incorrect C++ argument count");
      }
      return moneroMethods[i].method(args);
    }
    throw std::runtime_error("No monero C++ method " + method);
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
        job.complete("", "monero threw a C++ exception");
      }
    }
  }

  std::mutex mu_;
  std::condition_variable cv_;
  std::queue<Job> jobs_;
  std::thread thread_;
  bool stop_ = false;
};

SerialExecutor *g_mainQueue = nullptr;
SerialExecutor *g_nymQueue = nullptr;
Napi::ThreadSafeFunction *g_eventTsfn = nullptr;
std::mutex g_eventTsfnMutex;

bool isNymCompletionMethod(const std::string &method) {
  return method == "resolveFetch" || method == "rejectFetch";
}

struct CallResult {
  Napi::Promise::Deferred deferred;
  std::string value;
  std::string error;
  Napi::ThreadSafeFunction tsfn;

  CallResult(Napi::Promise::Deferred deferred_, Napi::ThreadSafeFunction tsfn_)
    : deferred(deferred_), tsfn(tsfn_) {}
};

struct EventPayload {
  std::string walletId;
  std::string eventName;
  std::string data;
};

} // namespace

static Napi::Value CallMonero(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();
  if (info.Length() < 2 || !info[0].IsString() || !info[1].IsArray()) {
    Napi::TypeError::New(env, "callMonero(method, string[]) expected")
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
      Napi::TypeError::New(env, "callMonero arguments must be strings")
        .ThrowAsJavaScriptException();
      return env.Undefined();
    }
    args.push_back(value.As<Napi::String>().Utf8Value());
  }

  auto deferred = Napi::Promise::Deferred::New(env);
  Napi::ThreadSafeFunction tsfn = Napi::ThreadSafeFunction::New(
    env,
    Napi::Function::New(env, [](const Napi::CallbackInfo &) {}),
    "monero-call-complete",
    0,
    1
  );

  auto *result = new CallResult(deferred, tsfn);
  SerialExecutor *queue =
    isNymCompletionMethod(method) ? g_nymQueue : g_mainQueue;

  queue->enqueue(
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
  Napi::Array out = Napi::Array::New(env, moneroMethodCount);
  for (unsigned i = 0; i < moneroMethodCount; ++i) {
    out.Set(i, Napi::String::New(env, moneroMethods[i].name));
  }
  return out;
}

static Napi::Value SetEventListener(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();
  if (info.Length() < 1 || !info[0].IsFunction()) {
    Napi::TypeError::New(env, "setEventListener(fn) expected")
      .ThrowAsJavaScriptException();
    return env.Undefined();
  }

  std::lock_guard<std::mutex> lock(g_eventTsfnMutex);
  if (g_eventTsfn != nullptr) {
    g_eventTsfn->Abort();
    g_eventTsfn->Release();
    delete g_eventTsfn;
    g_eventTsfn = nullptr;
  }
  g_eventTsfn = new Napi::ThreadSafeFunction(
    Napi::ThreadSafeFunction::New(
      env,
      info[0].As<Napi::Function>(),
      "monero-wallet-event",
      0,
      1
    )
  );
  g_eventTsfn->Unref(env);
  return env.Undefined();
}

static Napi::Object Init(Napi::Env env, Napi::Object exports) {
  if (g_mainQueue == nullptr) g_mainQueue = new SerialExecutor();
  if (g_nymQueue == nullptr) g_nymQueue = new SerialExecutor();

  moneroSetEventCallback(
    [](
      const std::string &walletId,
      const std::string &eventName,
      const std::string &jsonPayload
    ) {
      auto *payload = new EventPayload{walletId, eventName, jsonPayload};
      std::lock_guard<std::mutex> lock(g_eventTsfnMutex);
      if (g_eventTsfn == nullptr) {
        delete payload;
        return;
      }
      napi_status status = g_eventTsfn->NonBlockingCall(
        payload,
        [](Napi::Env env, Napi::Function jsCallback, EventPayload *p) {
          jsCallback.Call(
            {Napi::String::New(env, p->walletId),
             Napi::String::New(env, p->eventName),
             Napi::String::New(env, p->data)}
          );
          delete p;
        }
      );
      if (status != napi_ok) delete payload;
    }
  );

  exports.Set("callMonero", Napi::Function::New(env, CallMonero));
  exports.Set("methodNames", Napi::Function::New(env, GetMethodNames));
  exports.Set("setEventListener", Napi::Function::New(env, SetEventListener));
  return exports;
}

NODE_API_MODULE(monero, Init)
