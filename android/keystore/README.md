# Keystore de release Squad Planner

## Commande de generation (a executer UNE SEULE FOIS) :
```
keytool -genkeypair -v -storetype PKCS12 -keystore release.keystore -alias squadplanner -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Squad Planner, OU=Mobile, O=Squad Planner SAS, L=Paris, ST=IDF, C=FR"
```

## Variables d'environnement requises :
```
ANDROID_KEYSTORE_PATH=./android/keystore/release.keystore
ANDROID_KEYSTORE_PASSWORD=<votre_mot_de_passe>
ANDROID_KEY_ALIAS=squadplanner
ANDROID_KEY_PASSWORD=<votre_mot_de_passe>
```

## IMPORTANT :
- Ne JAMAIS commiter le fichier .keystore dans git
- Sauvegarder le keystore et les mots de passe dans un endroit sur
- Si le keystore est perdu, impossible de mettre a jour l'app sur le Play Store
