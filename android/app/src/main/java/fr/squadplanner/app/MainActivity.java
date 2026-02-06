package fr.squadplanner.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Créer les notification channels au démarrage
        createNotificationChannels();
    }

    private void createNotificationChannels() {
        // Les channels sont requis pour Android 8.0 (API 26) et supérieur
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager notificationManager =
                (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);

            // Channel pour les appels entrants - HAUTE PRIORITÉ avec son et vibration
            NotificationChannel callsChannel = new NotificationChannel(
                "calls",
                "Appels entrants",
                NotificationManager.IMPORTANCE_HIGH
            );
            callsChannel.setDescription("Notifications pour les appels vocaux entrants");
            callsChannel.enableVibration(true);
            callsChannel.setVibrationPattern(new long[]{0, 300, 100, 300, 100, 300});
            callsChannel.enableLights(true);
            callsChannel.setBypassDnd(true); // Passer outre le mode Ne pas déranger

            // Utiliser la sonnerie par défaut du téléphone
            Uri ringtoneUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
            AudioAttributes audioAttributes = new AudioAttributes.Builder()
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
                .build();
            callsChannel.setSound(ringtoneUri, audioAttributes);

            // Channel par défaut pour les autres notifications
            NotificationChannel defaultChannel = new NotificationChannel(
                "default",
                "Notifications",
                NotificationManager.IMPORTANCE_DEFAULT
            );
            defaultChannel.setDescription("Notifications générales de Squad Planner");
            defaultChannel.enableVibration(true);

            // Créer les channels
            notificationManager.createNotificationChannel(callsChannel);
            notificationManager.createNotificationChannel(defaultChannel);
        }
    }
}
