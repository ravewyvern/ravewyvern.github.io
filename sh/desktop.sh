#!/bin/bash
#
# Arch Linux Post-Installation Setup Script v2 (modified)
#
# Changes added by user request:
# - Download JetBrains Toolbox tarball, extract to /opt and symlink executable.
# - git clone vinceliuice/Fluent-icon-theme and run ./install.sh.
# - git clone sandesh236/sleek--themes and run Sleek\ theme-dark/install.sh.
# - Add interactive "Restore backup" feature that lists drives, finds backup folder,
#   and uses rsync to copy into $HOME with option to overwrite or skip duplicates.
#
# USAGE: ./desktop.sh
#

# --- SCRIPT START & CONFIRMATION ---
echo "================================================================="
echo "      Arch Linux Post-Installation & Desktop Setup Script        "
echo "================================================================="
echo
echo "This script will:"
echo "  - Enable the [multilib] repository for 32-bit support."
echo "  - Install 'yay' as an AUR helper."
echo "  - Install packages for NVIDIA, Hyprland, SDDM, and more."
echo "  - Configure grub-btrfsd for Timeshift snapshots."
echo "  - Install Flatpak apps."
echo "  - Optionally, run the Hyprland dotfiles setup script."
echo "  - Download & install JetBrains Toolbox."
echo "  - Install Fluent icon theme and Sleek theme-dark from GitHub."
echo "  - Provide a Restore Backup helper to copy a 'backup' folder from a drive into your home."
echo
read -p "Do you want to continue with the setup? (y/N): " CONFIRM
if [[ ! "$CONFIRM" =~ ^[yY](es)?$ ]]; then
    echo "Setup cancelled by user."
    exit 1
fi

# Exit immediately if a command fails
set -e

# Remember original working directory
ORIG_PWD="$(pwd)"
# Create a local src dir to keep clones (persistent)
SRC_DIR="${HOME}/.local/src"
mkdir -p "$SRC_DIR"

# --- PACKAGE LISTS ---

# Packages from the official Arch repositories
PACMAN_PACKAGES=(
    # NVIDIA Drivers
    nvidia nvidia-utils lib32-nvidia-utils

    # Display Server, WM, and Core Components
    sddm wayland kitty tree

    # File Managers & Editors
    neovim kate dolphin superfile ollama

    # System Utilities & Monitoring
    flatpak fastfetch cava earlyoom
    nodejs npm python python-pip
    # GNOME Applications
    gnome-clocks gnome-calendar gnome-maps evince
    gnome-logs gnome-contacts gnome-boxes gnome-software
    bluez bluez-utils ark
    # General Applications
    gimp kdeconnect sddm-kcm android-tools
)

# Packages from the Arch User Repository (AUR)
AUR_PACKAGES=(
    hyprland-nvidia-git
    timeshift-autosnap
    sddm-silent-theme
)

# Flatpak application IDs
FLATPAK_APPS=(
    com.usebottles.bottles com.github.flxzt.rnote com.valvesoftware.Steam
    io.missioncenter.MissionCenter org.prismlauncher.PrismLauncher
    app.zen_browser.zen md.obsidian.Obsidian com.vysp3r.ProtonPlus
    com.protonvpn.www dev.vencord.Vesktop com.vivaldi.Vivaldi
    com.core447.StreamController io.github.kukuruzka165.materialgram org.signal.Signal
    org.gnome.Fractal org.gnome.Decibels io.github.celluloid_player.Celluloid
    com.bitwarden.desktop org.libreoffice.LibreOffice io.github.amit9838.mousam
    com.belmoussaoui.Authenticator it.mijorus.gearlever com.github.tchx84.Flatseal
    org.kde.kalk org.mozilla.Thunderbird org.torproject.torbrowser-launcher
    org.gnome.Loupe com.vixalien.sticky org.gnome.DejaDup de.haeckerfelix.Fragments 
    io.github.alainm23.planify io.github.nozwock.Packet io.github.qwersyk.Newelle
    io.github.TheWisker.Cavasik net.blockbench.Blockbench org.gnome.Snapshot
)

# -------------------------
# --- BEGIN EARLY SETUP ---
# -------------------------
echo
echo "################################################################"
echo "  Performing initial downloads & theme installs (non-interactive)"
echo "################################################################"
echo

# --- (A) DOWNLOAD & INSTALL JetBrains Toolbox ---
JETBRAINS_URL="https://download-cdn.jetbrains.com/toolbox/jetbrains-toolbox-2.8.1.52155.tar.gz"
JETBRAINS_VERSION="jetbrains-toolbox-2.8.1.52155"
JETBRAINS_TARGET="/opt/${JETBRAINS_VERSION}"
JETBRAINS_BIN_SYMLINK="/usr/local/bin/jetbrains-toolbox"

echo "## JetBrains Toolbox: checking installation..."
if [[ -x "$JETBRAINS_BIN_SYMLINK" ]] || command -v jetbrains-toolbox &>/dev/null ; then
    echo "JetBrains Toolbox already available. Skipping download."
else
    echo "Downloading JetBrains Toolbox from ${JETBRAINS_URL}..."
    TMPTGZ="$(mktemp --suffix=.tar.gz)"
    curl -L -o "$TMPTGZ" "$JETBRAINS_URL"

    echo "Extracting to ${JETBRAINS_TARGET}..."
    sudo mkdir -p "$JETBRAINS_TARGET"
    sudo tar -xzf "$TMPTGZ" -C /opt/
    # The tar likely extracts to a folder named 'jetbrains-toolbox-<ver>' or similar; handle generically:
    # Find the extracted directory under /opt matching the version name or containing 'jetbrains-toolbox'
    EXTRACTED_DIR="$(tar -tzf "$TMPTGZ" | head -n1 | cut -f1 -d"/" || true)"
    # If that doesn't help, find an executable under /opt named jetbrains-toolbox
    BINPATH="$(find /opt -maxdepth 2 -type f -name 'jetbrains-toolbox' -perm /111 2>/dev/null | head -n1 || true)"

    if [[ -n "$BINPATH" ]]; then
        echo "Found toolbox binary at: $BINPATH"
        echo "Creating symlink $JETBRAINS_BIN_SYMLINK -> $BINPATH"
        sudo ln -sf "$BINPATH" "$JETBRAINS_BIN_SYMLINK"
        sudo chmod +x "$BINPATH"
    else
        echo "Couldn't find jetbrains-toolbox binary automatically. Leaving extracted files in /opt."
    fi

    rm -f "$TMPTGZ"
    echo "JetBrains Toolbox download/extract finished."
fi


# --- (B) Clone and install Fluent-icon-theme ---
FLUENT_REPO="https://github.com/vinceliuice/Fluent-icon-theme.git"
FLUENT_DIR="${SRC_DIR}/Fluent-icon-theme"
echo
echo "## Fluent icon theme: cloning and installing..."
if [[ -d "$FLUENT_DIR" && -f "$FLUENT_DIR/install.sh" ]]; then
    echo "Fluent-icon-theme already cloned. Attempting to run install script."
else
    rm -rf "$FLUENT_DIR"
    git clone "$FLUENT_REPO" "$FLUENT_DIR"
fi

if [[ -f "$FLUENT_DIR/install.sh" ]]; then
    pushd "$FLUENT_DIR" > /dev/null
    sudo chmod +x ./install.sh || true
    # Some installs expect non-interactive; we try to run unattended if possible.
    echo "Running Fluent-icon-theme install script..."
    ./install.sh || echo "Fluent install script returned non-zero exit code; continuing."
    popd > /dev/null
else
    echo "Fluent-icon-theme install script not found. Skipping."
fi


# --- (C) Clone and install Sleek theme-dark (handles spaces in path) ---
SLEEK_REPO="https://github.com/sandesh236/sleek--themes.git"
SLEEK_DIR="${SRC_DIR}/sleek--themes"
SLEEK_SUBDIR="Sleek theme-dark"
echo
echo "## Sleek theme: cloning and installing 'Sleek theme-dark'..."
if [[ -d "$SLEEK_DIR" && -f "$SLEEK_DIR/${SLEEK_SUBDIR}/install.sh" ]]; then
    echo "sleek--themes already cloned. Attempting to run install script."
else
    rm -rf "$SLEEK_DIR"
    git clone "$SLEEK_REPO" "$SLEEK_DIR"
fi

if [[ -f "$SLEEK_DIR/${SLEEK_SUBDIR}/install.sh" ]]; then
    pushd "$SLEEK_DIR/${SLEEK_SUBDIR}" > /dev/null
    sudo chmod +x ./install.sh || true
    echo "Running Sleek theme-dark install script (requires sudo)..."
    sudo ./install.sh || echo "Sleek install script returned non-zero exit code; continuing."
    popd > /dev/null
else
    echo "Sleek theme-dark install script not found. Skipping."
fi

# --- (D) Restore Backup helper (interactive) ---
echo
echo "################################################################"
echo "  Restore Backup Helper (interactive)"
echo "################################################################"
echo "This helper will list block devices and mounted paths. You can pick a device or a mount point"
echo "to search for a 'backup' folder. The contents of the chosen backup folder will be copied into"
echo "\$HOME. You will be asked whether to overwrite duplicates or skip them."
read -p "Do you want to run the Restore Backup helper now? (y/N): " RESTORE_CONFIRM
if [[ "$RESTORE_CONFIRM" =~ ^[yY](es)?$ ]]; then

    # List block devices with mount info
    echo
    echo "Detected block devices and mountpoints:"
    lsblk -o NAME,SIZE,TYPE,MOUNTPOINT,LABEL -p

    echo
    read -p "Enter device node (e.g. /dev/sdb1) or full mount point (e.g. /run/media/$USER/MyDrive): " DRIVE_INPUT
    if [[ -z "$DRIVE_INPUT" ]]; then
        echo "No input given. Skipping restore helper."
    else
        MOUNTED_BY_SCRIPT=0
        MOUNT_POINT=""

        # If input points to a device, check if it is mounted
        if [[ -b "$DRIVE_INPUT" ]]; then
            # It's a block device node
            MOUNT_POINT="$(lsblk -no MOUNTPOINT "$DRIVE_INPUT" | tr -d '[:space:]' || true)"
            if [[ -z "$MOUNT_POINT" ]]; then
                # Try to mount it temporarily
                TMP_MOUNT_DIR="/mnt/restore_tmp_$(date +%s)"
                sudo mkdir -p "$TMP_MOUNT_DIR"
                echo "Mounting $DRIVE_INPUT -> $TMP_MOUNT_DIR (requires sudo)..."
                sudo mount "$DRIVE_INPUT" "$TMP_MOUNT_DIR"
                MOUNT_POINT="$TMP_MOUNT_DIR"
                MOUNTED_BY_SCRIPT=1
            fi
        elif [[ -d "$DRIVE_INPUT" ]]; then
            # User supplied a mount point
            MOUNT_POINT="$DRIVE_INPUT"
        else
            echo "Input is not a block device nor an existing directory. Trying to interpret as device path..."
            if [[ -b "$DRIVE_INPUT" ]]; then
                MOUNT_POINT="$(lsblk -no MOUNTPOINT "$DRIVE_INPUT" | tr -d '[:space:]' || true)"
            fi
            if [[ -z "$MOUNT_POINT" ]]; then
                echo "Could not mount or find the provided input. Skipping restore helper."
                MOUNT_POINT=""
            fi
        fi

        if [[ -n "$MOUNT_POINT" ]]; then
            echo "Searching for backup folders under: $MOUNT_POINT"
            # Find candidate backup dirs (case-insensitive, depth-limited)
            mapfile -t CANDIDATES < <(find "$MOUNT_POINT" -maxdepth 3 -type d \( -iname 'backup' -o -iname 'backup*' \) 2>/dev/null || true)

            if [[ ${#CANDIDATES[@]} -eq 0 ]]; then
                echo "No 'backup' folders found under $MOUNT_POINT (searched depth 3)."
            else
                echo "Found backup folders:"
                idx=1
                for p in "${CANDIDATES[@]}"; do
                    echo "  [$idx] $p"
                    idx=$((idx+1))
                done
                read -p "Enter number of the backup folder to restore (or 'q' to cancel): " SEL
                if [[ "$SEL" =~ ^[0-9]+$ ]] && (( SEL >= 1 && SEL <= ${#CANDIDATES[@]} )); then
                    CHOSEN="${CANDIDATES[$((SEL-1))]}"
                    echo "You chose: $CHOSEN"
                    echo
                    echo "How should duplicate files be handled?"
                    echo "  [1] Overwrite duplicates"
                    echo "  [2] Skip existing files (do not overwrite)"
                    read -p "Choose 1 or 2 (default 2): " DUPOPT
                    if [[ "$DUPOPT" == "1" ]]; then
                        RSYNC_OPTS="-a --progress --verbose"
                        echo "Will overwrite duplicates."
                    else
                        RSYNC_OPTS="-a --progress --verbose --ignore-existing"
                        echo "Will skip files that already exist in \$HOME."
                    fi

                    read -p "Start restoring backup from '$CHOSEN' to '$HOME'? (y/N): " GO
                    if [[ "$GO" =~ ^[yY](es)?$ ]]; then
                        echo "Starting restore..."
                        # Use rsync to copy contents of chosen directory into $HOME
                        # Trailing slash ensures contents copied rather than folder itself
                        sudo rsync $RSYNC_OPTS --omit-dir-times --no-perms --chmod=ugo=rwX "$CHOSEN"/ "$HOME"/ || true
                        echo "Restore completed."
                    else
                        echo "Restore cancelled by user."
                    fi
                else
                    echo "Invalid selection or cancelled. Skipping restore."
                fi
            fi

            # If script mounted the device, unmount it
            if (( MOUNTED_BY_SCRIPT == 1 )); then
                echo "Unmounting $MOUNT_POINT..."
                sudo umount "$MOUNT_POINT" || echo "Warning: failed to unmount $MOUNT_POINT"
                sudo rmdir "$MOUNT_POINT" || true
            fi
        fi
    fi
else
    echo "Skipping Restore Backup helper."
fi

# Return to original working directory in case of earlier pushes
cd "$ORIG_PWD" || true

# -------------------------
# --- CONTINUE ORIGINAL FLOW ---
# -------------------------

# --- (1) ENABLE MULTILIB REPOSITORY ---
echo
echo "## Checking and enabling [multilib] repository..."
if ! grep -q "^\s*\[multilib\]" /etc/pacman.conf; then
    echo "Enabling the [multilib] repository..."
    sudo sed -i "/\[multilib\]/,/Include/"'s/^#//' /etc/pacman.conf
    echo "Syncing package databases..."
    sudo pacman -Syy
else
    echo "[multilib] repository is already enabled."
fi


# --- (2) Install AUR Helper (yay) ---
echo
echo "## Installing AUR Helper (yay)..."
if ! command -v yay &> /dev/null; then
    sudo pacman -S --needed --noconfirm git base-devel
    git clone https://aur.archlinux.org/yay.git "$SRC_DIR/yay"
    pushd "$SRC_DIR/yay" > /dev/null
    makepkg -si --noconfirm
    popd > /dev/null
    rm -rf "$SRC_DIR/yay"
    echo "yay installed successfully."
else
    echo "yay is already installed. Skipping."
fi


# --- (3) Install Packages ---
echo
echo "## Installing packages from official repositories..."
sudo pacman -S --needed --noconfirm "${PACMAN_PACKAGES[@]}"

echo
echo "## Installing packages from the AUR..."
yay -S --needed --noconfirm "${AUR_PACKAGES[@]}"

echo "All system and AUR packages installed."


# --- (4) GRUB-BTRFSD SETUP ---
echo
echo "## Configuring grub-btrfsd for Timeshift..."
OVERRIDE_FILE="/etc/systemd/system/grub-btrfsd.service.d/override.conf"
if [ -f "$OVERRIDE_FILE" ] && grep -q "timeshift-auto" "$OVERRIDE_FILE"; then
    echo "grub-btrfsd already configured for Timeshift. Skipping."
else
    timedatectl set-ntp true
    sudo mkdir -p /etc/systemd/system/grub-btrfsd.service.d/
    sudo tee "$OVERRIDE_FILE" > /dev/null <<EOF
[Service]
ExecStart=
ExecStart=/usr/bin/grub-btrfsd --syslog --timeshift-auto
EOF
    sudo systemctl daemon-reload
    sudo systemctl enable --now grub-btrfsd
    echo "The grub-btrfsd service is now configured for Timeshift and running."
fi


# --- (5) Enable Services ---
echo
echo "## Enabling SDDM Display Manager..."
sudo systemctl enable sddm
echo "SDDM enabled."


# --- (6) Flatpak Setup ---
echo
echo "## Setting up Flatpak and installing applications..."
sudo flatpak remote-add --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo
flatpak install -y flathub "${FLATPAK_APPS[@]}"
echo "Flatpak apps installed."

echo "## Applying Flatpak GTK theme overrides..."
sudo flatpak override --filesystem=xdg-config/gtk-3.0 --user &>/dev/null || true
sudo flatpak override --filesystem=xdg-config/gtk-4.0 --user &>/dev/null || true
echo "Flatpak overrides applied."


# --- (7) Hyprland Configuration (optional external script) ---
echo
echo "## Preparing to run Hyprland dotfiles setup script..."
echo "## WARNING: This will run a configuration script from the internet."
echo "## Source: https://end-4.github.io/dots-hyprland-wiki/setup.sh"
read -p "Do you want to continue with the Hyprland setup script? (y/N): " HYPR_CONFIRM
if [[ "$HYPR_CONFIRM" =~ ^[yY](es)?$ ]]; then
    bash <(curl -s "https://end-4.github.io/dots-hyprland-wiki/setup.sh")
    echo "Hyprland setup script finished."
else
    echo "Skipped Hyprland setup script."
fi


# --- Final Reminders ---
echo
echo "========================================================"
echo "          Post-Installation Setup Complete!             "
echo "========================================================"
echo
echo "If you installed JetBrains Toolbox to /opt manually, you can run it with: jetbrains-toolbox"
echo "To reboot, type: sudo reboot"
