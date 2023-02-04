package co.edgesecure.app;

import android.content.Context;
import android.util.Base64;
import android.util.Log;
import androidx.annotation.NonNull;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.URL;
import java.util.ArrayList;
import java.util.HashMap;
import javax.net.ssl.HttpsURLConnection;
import javax.net.ssl.SSLContext;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public class EdgeCore {
  Context context;
  String logId;

  public EdgeCore(String logId, Context context) {
    this.context = context;
    this.logId = logId;
  }

  /**
   * Fetches messages from the auth server, and returns an array of usernames with pending logins.
   */
  public @NonNull Iterable<String> fetchPendingLogins() throws JSONException, IOException {
    File basePath = context.getFilesDir();
    File loginsPath = new File(basePath, "logins");
    File[] files = loginsPath.listFiles();

    // Load the files:
    HashMap<String, String> loginIds = new HashMap();
    for (File file : files) {
      try {
        JSONObject json = new JSONObject(readFile(file));
        if (!json.has("loginAuthBox")) continue;
        String loginId = json.getString("loginId");
        String username = json.getString("username");
        loginIds.put(loginId, username);
      } catch (Exception e) {
        continue;
      }
    }

    // Bail out if there are no logged-in users:
    if (loginIds.size() == 0) return new ArrayList();

    // Prepare our payload:
    JSONObject payloadJson = new JSONObject();
    payloadJson.put("loginIds", new JSONArray(loginIds.keySet()));

    // Do the request:
    String uri = "https://auth.airbitz.co/api/v2/messages";
    JSONObject replyJson = new JSONObject(authFetch(uri, payloadJson.toString()));

    // Validate the response:
    int statusCode = replyJson.getInt("status_code");
    if (statusCode != 0) throw new JSONException("Incorrect status code");
    JSONArray messages = replyJson.getJSONArray("results");

    // Find messages with problems:
    ArrayList<String> problemUsers = new ArrayList();
    int messagesLength = messages.length();
    for (int i = 0; i < messagesLength; ++i) {
      JSONObject message = messages.getJSONObject(i);
      String loginId = message.getString("loginId");
      String username = loginIds.get(loginId);
      if (username == null) continue;

      JSONArray pendingVouchers = message.optJSONArray("pendingVouchers");
      boolean hasVoucher = pendingVouchers != null && pendingVouchers.length() > 0;
      boolean hasReset = message.optBoolean("otpResetPending", false);

      if (hasVoucher || hasReset) {
        problemUsers.add(username);
      }
    }

    return problemUsers;
  }

  public void updatePushToken(String token) throws JSONException, IOException {
    // Read the clientId:
    File basePath = context.getFilesDir();
    File file = new File(basePath, "client.json");
    JSONObject json = new JSONObject(readFile(file));
    String clientId64 = json.getString("clientId");
    String clientId = Base58.encode(Base64.decode(clientId64, Base64.DEFAULT));

    // Prepare our payload:
    JSONObject payloadJson = new JSONObject();
    payloadJson.put("apiKey", EdgeApiKey.apiKey);
    payloadJson.put("deviceId", clientId);
    payloadJson.put("deviceToken", token);

    // Do the request:
    String uri = EdgeApiKey.pushServer.concat("/v2/device/");
    pushFetch(uri, payloadJson.toString());
  }

  /** Does a request / reply with the auth server. */
  private String authFetch(String uri, String body) throws IOException {
    HttpsURLConnection connection = null;
    try {
      // Set up the HTTPS connection:
      connection = (HttpsURLConnection) new URL(uri).openConnection();
      SSLContext context = SSLContext.getInstance("TLS");
      context.init(null, null, null);
      connection.setSSLSocketFactory(context.getSocketFactory());

      // Add the auth server headers:
      byte[] bodyData = body.getBytes("UTF-8");
      connection.setRequestProperty("Accept", "application/json");
      connection.setRequestProperty("Content-Type", "application/json");
      connection.setRequestProperty("Authorization", "Token " + EdgeApiKey.apiKey);
      connection.setRequestProperty("Content-Length", Integer.toString(bodyData.length));
      connection.setRequestMethod("POST");
      connection.setDoInput(true);
      connection.setDoOutput(true);
      connection.setUseCaches(false);

      // Send the body:
      OutputStream wr = connection.getOutputStream();
      wr.write(bodyData);
      wr.flush();
      wr.close();
      connection.connect();

      Log.i(logId, String.format("%s %d", uri, connection.getResponseCode()));

      // Read the reply body:
      return readInputStream(connection.getInputStream());
    } catch (Exception e) {
      throw new IOException("Could not reach auth server " + uri, e);
    } finally {
      if (connection != null) connection.disconnect();
    }
  }

  /** Does a request / reply with the push server. */
  private void pushFetch(String uri, String body) throws IOException {
    HttpsURLConnection connection = null;
    try {
      // Set up the HTTPS connection:
      connection = (HttpsURLConnection) new URL(uri).openConnection();
      SSLContext context = SSLContext.getInstance("TLS");
      context.init(null, null, null);
      connection.setSSLSocketFactory(context.getSocketFactory());

      // Add the auth server headers:
      byte[] bodyData = body.getBytes("UTF-8");
      connection.setRequestProperty("Accept", "application/json");
      connection.setRequestProperty("Content-Type", "application/json");
      connection.setRequestProperty("Content-Length", Integer.toString(bodyData.length));
      connection.setRequestMethod("POST");
      connection.setDoInput(true);
      connection.setDoOutput(true);
      connection.setUseCaches(false);

      // Send the body:
      OutputStream wr = connection.getOutputStream();
      wr.write(bodyData);
      wr.flush();
      wr.close();
      connection.connect();

      Log.i(logId, String.format("%s %d", uri, connection.getResponseCode()));
    } catch (Exception e) {
      throw new IOException("Could not reach push server " + uri, e);
    } finally {
      if (connection != null) connection.disconnect();
    }
  }

  /** Reads a file from disk. */
  private static @NonNull String readFile(File file) throws IOException {
    try (FileInputStream stream = new FileInputStream(file)) {
      return readInputStream(stream);
    }
  }

  /** Reads an input stream into a string, as utf-8. */
  private static @NonNull String readInputStream(@NonNull InputStream stream) throws IOException {
    ByteArrayOutputStream out = new ByteArrayOutputStream();

    int size;
    byte[] data = new byte[4096];
    while ((size = stream.read(data)) > 0) {
      out.write(data, 0, size);
    }

    return out.toString("UTF-8");
  }
}
