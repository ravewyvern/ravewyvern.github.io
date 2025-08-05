#!/bin/bash
#
# Interactive Arch Linux Installation Script
#
# This script provides a guided installation of Arch Linux with Btrfs subvolumes.
# It will prompt for all necessary configuration details, including username,
# passwords, hostname, and the target installation disk.
#
# WARNING: This script will format and partition the selected disk,
# resulting in the permanent loss of all data on that disk.
#

# --- Initial Setup & Safety Checks ---
# Exit immediately if a command exits with a non-zero status.
set -e

# Ensure the script is run as root
if [ "$EUID" -ne 0 ]; then
    echo "This script must be run as root. Please use sudo."
    exit 1
fi

# --- User Input & Configuration ---
clear
echo "======================================================"
echo "      Interactive Arch Linux Installation Setup       "
echo "======================================================"
echo
echo "This script will guide you through the installation."
echo "Please provide the following configuration details."
echo

# Get Hostname
read -p "Enter the desired hostname for this system: " HOSTNAME

# Get Username
read -p "Enter the desired username for the primary user: " USERNAME

# Get User Password with confirmation
while true; do
    read -s -p "Enter the password for user '${USERNAME}': " PASSWORD
    echo
    read -s -p "Confirm the password: " PASSWORD_CONFIRM
    echo
    if [ "$PASSWORD" = "$PASSWORD_CONFIRM" ]; then
        break
    else
        echo "Passwords do not match. Please try again."
    fi
done

# --- Disk Selection ---
echo
echo "--> Detecting available disks..."
# List block devices that are disks, excluding partitions and loop devices.
lsblk -d -o NAME,SIZE,MODEL
echo
echo "WARNING: The disk you select will be completely erased."
read -p "Enter the name of the disk to install to (e.g., sda or nvme0n1): " DISK_NAME

DISK="/dev/${DISK_NAME}"

# Verify that the selected device is a block device
if [ ! -b "$DISK" ]; then
    echo "Error: Device '${DISK}' is not a valid block device. Aborting."
    exit 1
fi

# Define partition variables based on user's disk selection
EFI_PARTITION="${DISK}p1"
ROOT_PARTITION="${DISK}p2"

# --- Final Confirmation ---
clear
echo "======================================================"
echo "           FINAL CONFIRMATION BEFORE WIPE             "
echo "======================================================"
echo
echo "The script will now proceed with the following configuration:"
echo "  - Hostname:       ${HOSTNAME}"
echo "  - Username:       ${USERNAME}"
echo "  - Target Disk:    ${DISK}"
echo
echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
echo "!!  WARNING: ALL DATA ON ${DISK} WILL BE ERASED.  !!"
echo "!!      THIS ACTION IS IRREVERSIBLE.              !!"
echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
echo
read -p "To confirm you understand and wish to proceed, type 'ERASE': " CONFIRMATION
if [ "$CONFIRMATION" != "ERASE" ]; then
    echo "Confirmation not received. Aborting installation."
    exit 1
fi

# --- Installation Begins ---
# Set TTY keyboard layout
KEYMAP="us"
loadkeys ${KEYMAP}

echo "--> Synchronizing system clock with NTP..."
timedatectl set-ntp true

echo "--> Wiping disk and creating new partitions on ${DISK}..."
# Zap all existing partition table structures and wipe filesystem signatures
sgdisk --zap-all "${DISK}"
wipefs -a "${DISK}"

# Create a new GPT partition table
sgdisk -o "${DISK}"

# Create partitions: 550M for EFI, and the rest for the root filesystem.
sgdisk -n 1:0:+550M -t 1:ef00 "${DISK}" # EFI System Partition
sgdisk -n 2:0:0 -t 2:8300 "${DISK}"   # Linux filesystem (root)

# Inform the kernel about the partition table changes
partprobe "${DISK}"
# Wait a moment for device nodes to be created
sleep 2

echo "--> Formatting partitions..."
mkfs.fat -F 32 -n EFI "${EFI_PARTITION}"
mkfs.btrfs -f -L ArchRoot "${ROOT_PARTITION}"

echo "--> Mounting file systems and creating Btrfs subvolumes..."
# Mount the top-level Btrfs volume to create subvolumes
mount "${ROOT_PARTITION}" /mnt

# Create Btrfs subvolumes for a clean system snapshot layout
btrfs subvolume create /mnt/@
btrfs subvolume create /mnt/@home
btrfs subvolume create /mnt/@log
btrfs subvolume create /mnt/@pkg
btrfs subvolume create /mnt/@snapshots

# Unmount the top-level volume
umount /mnt

# Mount the subvolumes with recommended options (e.g., compression, noatime)
BTRFS_OPTS="rw,noatime,compress=zstd,ssd,discard=async,space_cache=v2,subvol="
mount -o "${BTRFS_OPTS}@" "${ROOT_PARTITION}" /mnt
# Create mount points for other partitions/subvolumes
mkdir -p /mnt/{home,var/log,var/cache,efi,.snapshots}
mount -o "${BTRFS_OPTS}@home" "${ROOT_PARTITION}" /mnt/home
mount -o "${BTRFS_OPTS}@log" "${ROOT_PARTITION}" /mnt/var/log
mount -o "${BTRFS_OPTS}@pkg" "${ROOT_PARTITION}" /mnt/var/cache
mount -o "${BTRFS_OPTS}@snapshots" "${ROOT_PARTITION}" /mnt/.snapshots
mount "${EFI_PARTITION}" /mnt/efi

echo "--> Installing base system and essential packages..."
pacstrap -K /mnt base base-devel linux linux-firmware git btrfs-progs grub efibootmgr grub-btrfs inotify-tools timeshift vim networkmanager pipewire pipewire-alsa pipewire-pulse pipewire-jack wireplumber reflector zsh zsh-completions zsh-autosuggestions openssh man sudo

echo "--> Generating fstab for the new system..."
# The -U flag uses UUIDs for more robust mounting
genfstab -U /mnt >> /mnt/etc/fstab

# --- System Configuration (chroot) ---
echo "--> Entering chroot and configuring the system..."
arch-chroot /mnt /bin/bash <<EOF
set -e # Exit on error within chroot

echo "--> Setting timezone to America/Los_Angeles..."
ln -sf /usr/share/zoneinfo/America/Los_Angeles /etc/localtime
hwclock --systohc

echo "--> Configuring locale to en_US.UTF-8..."
sed -i 's/^#en_US.UTF-8 UTF-8/en_US.UTF-8 UTF-8/' /etc/locale.gen
locale-gen
echo "LANG=en_US.UTF-8" > /etc/locale.conf

echo "--> Setting TTY keyboard layout..."
echo "KEYMAP=${KEYMAP}" > /etc/vconsole.conf

echo "--> Setting hostname and hosts file..."
echo "${HOSTNAME}" > /etc/hostname
cat > /etc/hosts <<HOSTS
127.0.0.1 localhost
::1       localhost
127.0.1.1 ${HOSTNAME}.localdomain ${HOSTNAME}
HOSTS

echo "--> Setting root password..."
echo "root:${PASSWORD}" | chpasswd

echo "--> Creating user '${USERNAME}' and setting password..."
useradd -m -G wheel -s /bin/zsh "${USERNAME}"
echo "${USERNAME}:${PASSWORD}" | chpasswd

echo "--> Granting sudo privileges to the 'wheel' group..."
# This is safer than editing sudoers directly
echo "%wheel ALL=(ALL:ALL) ALL" > /etc/sudoers.d/wheel

echo "--> Installing and configuring GRUB bootloader..."
grub-install --target=x86_64-efi --efi-directory=/efi --bootloader-id=GRUB --recheck
grub-mkconfig -o /boot/grub/grub.cfg

echo "--> Enabling essential system services..."
systemctl enable NetworkManager.service
systemctl enable reflector.service # Keeps mirrorlist updated

EOF
# End of chroot commands

# --- Finalization ---
echo "--> Unmounting all partitions..."
umount -R /mnt

echo "======================================================"
echo "               INSTALLATION COMPLETE!                 "
echo "======================================================"
echo
echo "You can now reboot the system. Please remove the installation media."
echo "To reboot now, type: reboot"

