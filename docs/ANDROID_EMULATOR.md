# Android Emulator Setup (Fedora 43)

Esta guia cubre la instalacion de Android Studio, configuracion de SDK, emulador, aceleracion por KVM, y Java (Temurin). No incluye Watchman.

## 1) Requisitos de virtualizacion

Verifica soporte de virtualizacion:

```bash
lscpu | grep -E "Virtualization|VT-x|AMD-V"
```

Si no aparece, activa VT-x/AMD-V en BIOS/UEFI.

## 2) Instalar Android Studio

1. Descarga Android Studio:
   https://developer.android.com/studio
2. Instala en /opt (recomendado):

```bash
tar -xzf android-studio-*.tar.gz
sudo mv android-studio /opt/
/opt/android-studio/bin/studio
```

## 3) Configurar SDK y herramientas

En Android Studio:

- More Actions -> SDK Manager
- SDK Platforms: instala un API actual (por ejemplo 34 o 35)
- SDK Tools:
  - Android SDK Platform-Tools
  - Android Emulator
  - Android SDK Command-line Tools (latest)

## 4) Variables de entorno (bash)

Agrega esto a tu ~/.bashrc:

```bash
export ANDROID_SDK_ROOT="$HOME/Android/Sdk"
export ANDROID_HOME="$ANDROID_SDK_ROOT"
export PATH="$ANDROID_SDK_ROOT/emulator:$ANDROID_SDK_ROOT/platform-tools:$ANDROID_SDK_ROOT/cmdline-tools/latest/bin:$PATH"
```

Luego:

```bash
source ~/.bashrc
```

Verifica:

```bash
which adb
which emulator
```

## 5) KVM (aceleracion del emulador)

Instala y habilita KVM:

```bash
sudo dnf install @virtualization qemu-kvm libvirt virt-install virt-manager
sudo systemctl enable --now libvirtd
sudo usermod -aG kvm $USER
```

Cierra sesion y vuelve a entrar. Verifica:

```bash
lsmod | grep kvm
```

## 6) Java (Temurin 17)

Instala Temurin:

```bash
sudo rpm --import https://packages.adoptium.net/artifactory/api/gpg/key/public
sudo tee /etc/yum.repos.d/adoptium.repo <<'EOF'
[Adoptium]
name=Adoptium
baseurl=https://packages.adoptium.net/artifactory/rpm/fedora/$releasever/$basearch
enabled=1
gpgcheck=1
gpgkey=https://packages.adoptium.net/artifactory/api/gpg/key/public
EOF

sudo dnf install temurin-17-jdk
```

Configura JAVA_HOME en ~/.bashrc:

```bash
export JAVA_HOME=/usr/lib/jvm/temurin-17-jdk
export PATH="$JAVA_HOME/bin:$PATH"
```

Verifica:

```bash
java -version
```

## 7) Crear un AVD (emulador)

En Android Studio:

- Device Manager -> Create Device
- Elige un dispositivo (Pixel 5, por ejemplo)
- Descarga un system image x86_64

Desde terminal:

```bash
emulator -list-avds
emulator -avd <NOMBRE_DEL_AVD>
```

## 8) Ejecutar la app (Expo)

Desde apps/mobile:

```bash
bun run android
```

O bien:

```bash
bun run start
```

y luego presiona "a" para Android.

## 9) Ajuste de entrada de menu (Android Studio)

Si Android Studio avisa que se lanzo con un .sh en lugar del binario, revisa el desktop entry:

```bash
sudo nano /usr/local/share/applications/jetbrains-studio.desktop
```

Asegura:

```
Exec=/opt/android-studio/bin/studio
Icon=/opt/android-studio/bin/studio.png
```

Luego:

```bash
update-desktop-database /usr/local/share/applications
```
