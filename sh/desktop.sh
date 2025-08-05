#!/bin/bash
#
# Arch Linux Post-Installation Setup Script v2
#
# Changes:
# - Automatically enables the [multilib] repository.
# - Re-run safe: Skips steps that are already complete.
# - Corrected order of operations for service configuration.
#
# USAGE:
# ./desktop.sh
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
echo "  - Install a list of Flatpak applications."
echo "  - Enable the SDDM display manager."
echo "  - Optionally, run an external script to configure Hyprland."
echo
read -p "Do you want to continue with the setup? (y/N): " CONFIRM
if [[ ! "$CONFIRM" =~ ^[yY](es)?$ ]]; then
    echo "Setup cancelled by user."
    exit 1
fi

# Exit immediately if a command fails
set -e

# --- PACKAGE LISTS ---

# Packages from the official Arch repositories
PACMAN_PACKAGES=(
    # NVIDIA Drivers
    nvidia nvidia-utils lib32-nvidia-utils

    # Display Server, WM, and Core Components
    sddm wayland kitty

    # File Managers & Editors
    neovim kate dolphin superfile

    # System Utilities & Monitoring
    flatpak fastfetch cava lolcat

    # GNOME Applications
    gnome-clocks gnome-calendar gnome-maps evince
    gnome-logs gnome-contacts gnome-boxes gnome-software
    file-roller bluez bluez-utils
    # General Applications
    gimp kdeconnect sddm-kcm
)

# Packages from the Arch User Repository (AUR)
AUR_PACKAGES=(
    hyprland-nvidia-git
    youtube-music-bin
    timeshift-autosnap
)

# Flatpak application IDs
FLATPAK_APPS=(
    com.usebottles.bottles com.github.flxzt.rnote com.valvesoftware.Steam
    io.missioncenter.MissionCenter org.prismlauncher.PrismLauncher
    app.zen_browser.zen md.obsidian.Obsidian com.vysp3r.ProtonPlus
    com.protonvpn.www org.gnome.Cheese dev.vencord.Vesktop
    com.core447.StreamController org.telegram.desktop org.signal.Signal
    org.gnome.Fractal org.gnome.Decibels io.github.celluloid_player.Celluloid
    com.bitwarden.desktop org.libreoffice.LibreOffice io.github.amit9838.mousam
    com.belmoussaoui.Authenticator it.mijorus.gearlever com.github.tchx84.Flatseal
    org.kde.kalk org.mozilla.Thunderbird org.torproject.torbrowser-launcher
    org.gnome.Loupe com.vixalien.sticky org.gnome.DejaDup
)


# --- (1) ENABLE MULTILIB REPOSITORY ---
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
echo "## Installing AUR Helper (yay)..."
if ! command -v yay &> /dev/null; then
    sudo pacman -S --needed --noconfirm git base-devel
    git clone https://aur.archlinux.org/yay.git
    cd yay
    makepkg -si --noconfirm
    cd ..
    rm -rf yay
    echo "yay installed successfully."
else
    echo "yay is already installed. Skipping."
fi


# --- (3) Install Packages ---
echo "## Installing packages from official repositories..."
sudo pacman -S --needed --noconfirm "${PACMAN_PACKAGES[@]}"

echo "## Installing packages from the AUR..."
yay -S --needed --noconfirm "${AUR_PACKAGES[@]}"

echo "All system and AUR packages installed."


# --- (4) GRUB-BTRFSD SETUP ---
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
echo "## Enabling SDDM Display Manager..."
sudo systemctl enable sddm
echo "SDDM enabled."


# --- (6) Flatpak Setup ---
echo "## Setting up Flatpak and installing applications..."
sudo flatpak remote-add --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo
flatpak install -y flathub "${FLATPAK_APPS[@]}"
echo "Flatpak apps installed."

echo "## Applying Flatpak GTK theme overrides..."
sudo flatpak override --filesystem=xdg-config/gtk-3.0 --user &>/dev/null || true
sudo flatpak override --filesystem=xdg-config/gtk-4.0 --user &>/dev/null || true
echo "Flatpak overrides applied."


# --- (7) Hyprland Configuration ---
echo "## Preparing to run Hyprland dotfiles setup script..."
echo "## WARNING: This will run a configuration script from the internet."
echo "## Source: https://end-4.github.io/dots-hyprland-wiki/setup.sh"
read -p "Do you want to continue? (y/N): " HYPR_CONFIRM
if [[ "$HYPR_CONFIRM" =~ ^[yY](es)?$ ]]; then
    bash <(curl -s "https://end-4.github.io/dots-hyprland-wiki/setup.sh")
    echo "Hyprland setup script finished."
else
    echo "Skipped Hyprland setup script."
fi


# --- Final Reminders ---
echo ""
echo "========================================================"
echo "          Post-Installation Setup Complete!           "
echo "========================================================"
echo ""
echo "   REMINDER: Don't forget to install the JetBrains Toolbox App"
echo "   from their official website to get your IDEs."
echo "   https://www.jetbrains.com/toolbox-app/"
echo ""
echo "To reboot, type: sudo reboot"
