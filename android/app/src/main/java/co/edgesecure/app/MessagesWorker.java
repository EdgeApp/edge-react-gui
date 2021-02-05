package co.edgesecure.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.util.Log;
import androidx.core.app.NotificationCompat;
import androidx.work.Constraints;
import androidx.work.ExistingPeriodicWorkPolicy;
import androidx.work.ListenableWorker.Result;
import androidx.work.NetworkType;
import androidx.work.OneTimeWorkRequest;
import androidx.work.PeriodicWorkRequest;
import androidx.work.WorkManager;
import androidx.work.Worker;
import androidx.work.WorkerParameters;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.URL;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.concurrent.TimeUnit;
import javax.net.ssl.HttpsURLConnection;
import javax.net.ssl.SSLContext;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * Fetches messages in the background. The name of this class gets stored in the OS so it can
 * re-instantiate us, so we can't rename this class.
 */
public class MessagesWorker extends Worker {
  private static final String workId = "MessagesWorker";
  private static final int notificationId = 1;

  public MessagesWorker(Context context, WorkerParameters params) {
    super(context, params);
  }

  @Override
  public Result doWork() {
    Context context = getApplicationContext();
    Log.i(workId, "MessagesWorker running");

    // Snag the users:
    try {
      Iterable<String> problemUsers = fetchMessages();

      // Send a notification:
      StringBuilder builder = new StringBuilder();
      builder.append("Another device is trying to log into: ");
      int count = 0;
      for (String user : problemUsers) {
        if (count++ > 0) builder.append(", ");
        builder.append(user);
      }
      builder.append(
          ".\nPlease log in to approve or deny the request. Failure to approve or deny an unauthorized request could result in loss of funds.");
      if (count > 0) {
        sendNotification("Urgent Security Issue", builder.toString());
      } else {
        cancelNotification();
      }
    } catch (Exception e) {
      Log.e(workId, e.toString());
      return Result.failure();
    }

    return Result.success();
  }

  /** Fetches messages from the auth server, and returns an array of 2fa reset users. */
  private Iterable<String> fetchMessages() throws JSONException, IOException {
    Context context = getApplicationContext();
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

  /** Reads a file from disk. */
  private String readFile(File file) throws IOException {
    FileInputStream stream = new FileInputStream(file);
    try {
      return readInputStream(stream);
    } finally {
      stream.close();
    }
  }

  /** Show a local notification. */
  private void sendNotification(String title, String message) {
    Context context = getApplicationContext();
    NotificationManager notificationManager =
        (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);

    // If on Oreo then notification requires a notification channel:
    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
      int importance = 3; // NotificationManager.IMPORTANCE_DEFAULT
      NotificationChannel channel = new NotificationChannel("default", "Default", importance);
      notificationManager.createNotificationChannel(channel);
    }

    // Intent to open Edge:
    String packageName = context.getPackageName();
    Intent launchIntent = context.getPackageManager().getLaunchIntentForPackage(packageName);
    PendingIntent pendingIntent =
        PendingIntent.getActivity(
            context, notificationId, launchIntent, PendingIntent.FLAG_UPDATE_CURRENT);

    // Show the notification:
    Notification notification =
        new NotificationCompat.Builder(context, "default")
            .setContentTitle(title)
            .setContentText(message)
            .setContentIntent(pendingIntent)
            .setSmallIcon(R.mipmap.edge_logo_hollow)
            .build();
    notificationManager.notify(notificationId, notification);
  }

  /** Hides our local notification. */
  private void cancelNotification() {
    Context context = getApplicationContext();
    NotificationManager notificationManager =
        (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);

    notificationManager.cancel(notificationId);
  }

  /** Schedules this worker to run periodically in the background, if necessary. */
  public static void ensureScheduled(Context context) {
    WorkManager manager = WorkManager.getInstance(/* context */ );

    // Run periodically, but only with networking:
    Constraints constraints =
        new Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build();
    PeriodicWorkRequest messagesWorkRequest =
        new PeriodicWorkRequest.Builder(MessagesWorker.class, 12, TimeUnit.HOURS)
            .setConstraints(constraints)
            .build();

    // Add the task if it doesn't exist already:
    manager.enqueueUniquePeriodicWork(workId, ExistingPeriodicWorkPolicy.KEEP, messagesWorkRequest);
  }

  /** Schedules this worker to run once right away, for debugging. */
  public static void testRun(Context context) {
    WorkManager manager = WorkManager.getInstance(/* context */ );

    // Reset anything that might interfere with the test:
    manager.cancelAllWork();
    manager.pruneWork();

    // Schedule ourselves to run once:
    OneTimeWorkRequest messagesWorkRequest =
        new OneTimeWorkRequest.Builder(MessagesWorker.class).build();
    manager.enqueue(messagesWorkRequest);
  }

  /** Does a request / reply with the auth server. */
  public String authFetch(String uri, String body) throws IOException {
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

      String logMessage =
          new StringBuilder(uri).append(" ").append(connection.getResponseCode()).toString();
      Log.i(workId, logMessage);

      // Read the reply body:
      return readInputStream(connection.getInputStream());
    } catch (Exception e) {
      throw new IOException("Could not reach auth server " + uri, e);
    } finally {
      if (connection != null) connection.disconnect();
    }
  }

  /** Reads an input stream into a string, as utf-8. */
  private static String readInputStream(InputStream stream) throws IOException {
    ByteArrayOutputStream out = new ByteArrayOutputStream();

    int size;
    byte[] data = new byte[4096];
    while ((size = stream.read(data)) > 0) {
      out.write(data, 0, size);
    }

    return out.toString("UTF-8");
  }
}
