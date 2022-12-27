#!/bin/bash -e

if [[ $UID != 0 ]]; then
  >&2 echo "Error: must have root permissions!"
  exit 1
fi

if [ -e /dev/hidg0 ]; then
  echo "/dev/hidg0 already exists!"
  exit 0
fi

OTG_DIR="/sys/kernel/config/usb_gadget/usb_otg"
USB_NUM="usb0"
CONFIG_NUM="1"

# Create OTG Directory
mkdir -p "${OTG_DIR}"
cd "${OTG_DIR}"

# USB Device ID
echo 0x1d6b > idVendor 	# Linux Foundation
echo 0x0104 > idProduct # Multifunction Composite Gadget
echo 0x0100 > bcdDevice # v1.0.0
echo 0x0200 > bcdUSB 	# USB2

# Set strings
mkdir -p strings/0x409
echo "aaaaaaaaaaaaaaaa" > strings/0x409/serialnumber
echo "bbbbbbbbbbbbbbbb" > strings/0x409/manufacturer
echo "PiKVM USB Device" > strings/0x409/product

# Set config
mkdir -p configs/c."${CONFIG_NUM}"/strings/0x409
echo "Config ${CONFIG_NUM}: ECM network" > configs/c."${CONFIG_NUM}"/strings/0x409/configuration
echo 250 > configs/c."${CONFIG_NUM}"/MaxPower

# Set functions
mkdir -p functions/hid."${USB_NUM}"
echo 1 > functions/hid."${USB_NUM}"/protocol
echo 1 > functions/hid."${USB_NUM}"/subclass
echo 8 > functions/hid."${USB_NUM}"/report_length
echo -ne \\x05\\x01\\x09\\x06\\xa1\\x01\\x05\\x07\\x19\\xe0\\x29\\xe7\\x15\\x00\\x25\\x01\\x75\\x01\\x95\\x08\\x81\\x02\\x95\\x01\\x75\\x08\\x81\\x03\\x95\\x05\\x75\\x01\\x05\\x08\\x19\\x01\\x29\\x05\\x91\\x02\\x95\\x01\\x75\\x03\\x91\\x03\\x95\\x06\\x75\\x08\\x15\\x00\\x25\\x65\\x05\\x07\\x19\\x00\\x29\\x65\\x81\\x00\\xc0 > functions/hid."${USB_NUM}"/report_desc

ln -s functions/hid."${USB_NUM}" configs/c."${CONFIG_NUM}"/
ls /sys/class/udc > UDC

# Set permissions
#sleep 5
chgrp pi /dev/hidg0
chmod 770 /dev/hidg0

echo "Setup complete!"
