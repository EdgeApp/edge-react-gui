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
import com.google.android.gms.tasks.OnSuccessListener;
import com.google.firebase.messaging.FirebaseMessaging;
import java.util.concurrent.TimeUnit;

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
      EdgeCore core = new EdgeCore(workId, context);
      Iterable<String> problemUsers = core.fetchPendingLogins();

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

      // Update the push server:
      updateFirebaseToken(core);
    } catch (Exception e) {
      Log.e(workId, e.toString());
      return Result.failure();
    }

    return Result.success();
  }

  /** Show a local notification. */
  private void sendNotification(String title, String message) {
    Context context = getApplicationContext();
    NotificationManager notificationManager =
        (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
    Log.i(workId, "Background notification: " + message);

    // If on Oreo then notification requires a notification channel:
    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
      int importance = NotificationManager.IMPORTANCE_DEFAULT;
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

  private void updateFirebaseToken(EdgeCore core) {
    OnSuccessListener listener =
        new OnSuccessListener<String>() {
          @Override
          public void onSuccess(String token) {
            try {
              core.updatePushToken(token);
            } catch (Exception e) {
            }
          }
        };

    FirebaseMessaging messaging = FirebaseMessaging.getInstance();
    messaging.getToken().addOnSuccessListener(listener);
  }
}
