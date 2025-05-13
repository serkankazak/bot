# Raspberry Camera Bot (Discord/Telegram)
#### with Person detection (tensorflow lite)

<img src="demo.gif">

https://www.youtube.com/watch?v=55k0FqwHrls

[![setup](http://img.youtube.com/vi/55k0FqwHrls/0.jpg)](http://www.youtube.com/watch?v=55k0FqwHrls "setup")

## Tested on Raspberry legacy Bullseye OS

### on computer:
```
ssh-keygen -f ~/.ssh/known_hosts -R "<rasp_ip>"
ssh pi@<rasp_ip>
sshpass -p <pass> ssh pi@<rasp_ip>
```

### turn off ssh password authentication since cameras will use raspberry password for ftp:
```
cd ~/Downloads/rasp
mkdir ssh
cd ssh
ssh-keygen
ssh-copy-id -i ./id_rsa.pub pi@<rasp_ip>
ssh -i ~/Downloads/rasp/ssh/id_rsa pi@<rasp_ip>

sudo nano /etc/ssh/sshd_config # on raspberry
	PasswordAuthentication no

sudo /etc/init.d/ssh restart # on raspberry
```

### on raspberry:

```
sudo dphys-swapfile swapoff

sudo nano /sbin/dphys-swapfile
	CONF_SWAPSIZE=4096
	CONF_MAXSWAP=4096

sudo nano /etc/dphys-swapfile
	CONF_SWAPSIZE=4096

sudo dphys-swapfile setup
sudo dphys-swapfile swapon

free -h

sudo raspi-config # performance: gpu memory: 64 --> 128

sudo reboot
```

```
sudo apt-get update
sudo apt-get install -y build-essential cmake git unzip pkg-config libjpeg-dev libtiff-dev libpng-dev libavcodec-dev libavformat-dev libswscale-dev libgtk2.0-dev libcanberra-gtk* libgtk-3-dev libgstreamer1.0-dev gstreamer1.0-gtk3 libgstreamer-plugins-base1.0-dev gstreamer1.0-gl libxvidcore-dev libx264-dev python3-dev python3-numpy python3-pip libtbb2 libtbb-dev libdc1394-22-dev libv4l-dev v4l-utils libopenblas-dev libatlas-base-dev libblas-dev liblapack-dev gfortran libhdf5-dev libprotobuf-dev libgoogle-glog-dev libgflags-dev protobuf-compiler libffi-dev libncursesw5-dev libsqlite3-dev tk-dev libgdbm-dev libc6-dev libbz2-dev vsftpd libncurses5-dev libreadline6-dev libdb5.3-dev libexpat1-dev liblzma-dev zlib1g-dev watchdog ca-certificates gnupg curl

curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | sudo gpg --dearmor -o /usr/share/keyrings/nodesource.gpg
echo "deb [signed-by=/usr/share/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" | sudo tee /etc/apt/sources.list.d/nodesource.list
sudo apt update
sudo apt install -y nodejs

cd ~/Downloads
git clone https://github.com/serkankazak/bot.git
cd bot
npm i ws@8.13.0 async-lock@1.4.0 discord.js@14.19.3 chokidar@3.5.3 sharp@0.32.1
sed -i 's/\("dependencies": {\)/"type": "module",\n  \1/' package.json
curl -L https://github.com/serkankazak/Tensorflow-Object-Detection/raw/refs/heads/main/efficientdet_lite0.tflite > tf2/efficientdet_lite0.tflite

cd ~/Downloads
wget https://github.com/openssl/openssl/releases/download/OpenSSL_1_1_1/openssl-1.1.1.tar.gz
tar zxf openssl-1.1.1.tar.gz
cd openssl-1.1.1
sudo ./config --openssldir=/usr/local/ssl shared zlib
sudo make -j $(nproc)
sudo make install
sudo ldconfig

cd ~/Downloads
wget https://www.python.org/ftp/python/3.9.19/Python-3.9.19.tgz
tar zxf Python-3.9.19.tgz
cd Python-3.9.19
LDFLAGS="${LDFLAGS} -Wl,-rpath=/usr/local/lib" sudo ./configure --enable-optimizations --with-openssl=/usr/local
sudo make -j $(nproc) build_all
sudo make altinstall
echo "alias python=/usr/local/bin/python3.9" >> ~/.bashrc
echo "alias python3=/usr/local/bin/python3.9" >> ~/.bashrc
source ~/.bashrc
sudo update-alternatives --install /usr/bin/python python /usr/local/bin/python3.9 1
sudo update-alternatives --install /usr/bin/python3 python3 /usr/local/bin/python3.9 1

python3 -m pip install numpy==1.26.4
python3 -m pip install tflite-support==0.4.3
python3 -m pip install tflite-runtime==2.11.0

cd ~/Downloads
wget -O opencv.zip https://github.com/opencv/opencv/archive/4.5.0.zip
unzip opencv.zip
cd opencv-4.5.0
mkdir build
cd build
cmake -D CMAKE_BUILD_TYPE=RELEASE \
-D CMAKE_INSTALL_PREFIX=/usr/local \
-D ENABLE_NEON=ON \
-D ENABLE_VFPV3=ON \
-D WITH_OPENMP=ON \
-D BUILD_ZLIB=ON \
-D BUILD_TIFF=ON \
-D WITH_FFMPEG=ON \
-D WITH_TBB=ON \
-D BUILD_TBB=ON \
-D BUILD_TESTS=OFF \
-D WITH_EIGEN=OFF \
-D WITH_GSTREAMER=ON \
-D WITH_V4L=ON \
-D WITH_LIBV4L=ON \
-D WITH_VTK=OFF \
-D WITH_QT=OFF \
-D OPENCV_ENABLE_NONFREE=ON \
-D INSTALL_C_EXAMPLES=OFF \
-D INSTALL_PYTHON_EXAMPLES=OFF \
-D BUILD_NEW_PYTHON_SUPPORT=ON \
-D BUILD_opencv_python3=TRUE \
-D OPENCV_GENERATE_PKGCONFIG=ON \
-D OPENCV_FORCE_LIBATOMIC_COMPILER_CHECK=1 \
-D PYTHON3_PACKAGES_PATH=/usr/local/lib/python3.9/site-packages \
-D BUILD_EXAMPLES=OFF ..
sudo make -j $(nproc)
sudo make install
sudo ldconfig

sudo reboot
```

---
```
crontab -e
```
```
0 0 * * * /bin/bash /home/pi/Downloads/bot/clear.sh >> /home/pi/Downloads/bot/clog.txt
*/10 * * * * /bin/bash /home/pi/Downloads/bot/clear_oldest.sh >> /home/pi/Downloads/bot/clear_oldest_log.txt
```
```
crontab -l
```
---

```
sudo nano /etc/systemd/system/picambot.service
```
```
[Unit]
Description=PiCamBot
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=pi
Group=pi
WorkingDirectory=/home/pi/Downloads/bot/
ExecStartPre=/bin/sleep 10
ExecStart=/usr/bin/node /home/pi/Downloads/bot/bot.js
StandardOutput=append:/home/pi/Downloads/bot/log.txt
StandardError=append:/home/pi/Downloads/bot/log.txt
Restart=always

[Install]
WantedBy=multi-user.target
```

---

```
sudo nano /etc/systemd/system/picambotrtsp.service
```
```
[Unit]
Description=PiCamBotRTSP
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=pi
Group=pi
WorkingDirectory=/home/pi/Downloads/bot/
ExecStartPre=/bin/sleep 10
ExecStart=/usr/bin/node /home/pi/Downloads/bot/rtsp.js
StandardOutput=append:/home/pi/Downloads/bot/log_rtsp.txt
StandardError=append:/home/pi/Downloads/bot/log_rtsp.txt
Restart=always

[Install]
WantedBy=multi-user.target
```

#### edit as necessary:
```
sudo mkdir /home/pi/ftp
sudo chown nobody:nogroup /home/pi/ftp
sudo chmod a-w /home/pi/ftp
sudo mkdir /home/pi/ftp/files
sudo mkdir -p /home/pi/ftp/files/cam1
sudo mkdir -p /home/pi/ftp/files/cam2
sudo mkdir -p /home/pi/ftp/files/cam3
sudo mkdir -p /home/pi/ftp/files/cam4
sudo mkdir -p /home/pi/ftp/files/ipcam1
sudo mkdir -p /home/pi/ftp/files/ipcam1/record
sudo mkdir -p /home/pi/ftp/files/ipcam1/snap
sudo mkdir -p /home/pi/ftp/files/ipcam1/snap/done
sudo mkdir -p /home/pi/ftp/files/ipcam1/snap/done2
sudo mkdir -p /home/pi/ftp/files/ipcam2
sudo mkdir -p /home/pi/ftp/files/ipcam2/record
sudo mkdir -p /home/pi/ftp/files/ipcam2/snap
sudo mkdir -p /home/pi/ftp/files/ipcam2/snap/done
sudo mkdir -p /home/pi/ftp/files/ipcam2/snap/done2
sudo mkdir -p /home/pi/ftp/files/ipcam3
sudo mkdir -p /home/pi/ftp/files/ipcam3/record
sudo mkdir -p /home/pi/ftp/files/ipcam3/snap
sudo mkdir -p /home/pi/ftp/files/ipcam3/snap/done
sudo mkdir -p /home/pi/ftp/files/ipcam3/snap/done2
sudo mkdir -p /home/pi/ftp/files/ipcam4
sudo mkdir -p /home/pi/ftp/files/ipcam4/record
sudo mkdir -p /home/pi/ftp/files/ipcam4/snap
sudo mkdir -p /home/pi/ftp/files/ipcam4/snap/done
sudo mkdir -p /home/pi/ftp/files/ipcam4/snap/done2
sudo mkdir -p /home/pi/ftp/files/cam5
sudo mkdir -p /home/pi/ftp/files/cam5/record
sudo mkdir -p /home/pi/ftp/files/cam5/snap
sudo mkdir -p /home/pi/ftp/files/cam5/snap/done
sudo mkdir -p /home/pi/ftp/files/cam5/snap/done2
sudo mkdir -p /home/pi/ftp/files/cam6
sudo mkdir -p /home/pi/ftp/files/cam6/record
sudo mkdir -p /home/pi/ftp/files/cam6/snap
sudo mkdir -p /home/pi/ftp/files/cam6/snap/done
sudo mkdir -p /home/pi/ftp/files/cam6/snap/done2
sudo chown -R pi:pi /home/pi/ftp/files
```

---

```
sudo rm /etc/vsftpd.conf
sudo nano /etc/vsftpd.conf
```
```
# Example config file /etc/vsftpd.conf
#
# The default compiled in settings are fairly paranoid. This sample file
# loosens things up a bit, to make the ftp daemon more usable.
# Please see vsftpd.conf.5 for all compiled in defaults.
#
# READ THIS: This example file is NOT an exhaustive list of vsftpd options.
# Please read the vsftpd.conf.5 manual page to get a full idea of vsftpd's
# capabilities.
#
#
# Run standalone?  vsftpd can run either from an inetd or as a standalone
# daemon started from an initscript.
listen=NO
#
# This directive enables listening on IPv6 sockets. By default, listening
# on the IPv6 "any" address (::) will accept connections from both IPv6
# and IPv4 clients. It is not necessary to listen on *both* IPv4 and IPv6
# sockets. If you want that (perhaps because you want to listen on specific
# addresses) then you must run two copies of vsftpd with two configuration
# files.
listen_ipv6=YES
#
# Allow anonymous FTP? (Disabled by default).
anonymous_enable=NO
#
# Uncomment this to allow local users to log in.
local_enable=YES
#
# Uncomment this to enable any form of FTP write command.
write_enable=YES
#
# Default umask for local users is 077. You may wish to change this to 022,
# if your users expect that (022 is used by most other ftpd's)
local_umask=011
#
# Uncomment this to allow the anonymous FTP user to upload files. This only
# has an effect if the above global write enable is activated. Also, you will
# obviously need to create a directory writable by the FTP user.
#anon_upload_enable=YES
#
# Uncomment this if you want the anonymous FTP user to be able to create
# new directories.
#anon_mkdir_write_enable=YES
#
# Activate directory messages - messages given to remote users when they
# go into a certain directory.
dirmessage_enable=YES
#
# If enabled, vsftpd will display directory listings with the time
# in  your  local  time  zone.  The default is to display GMT. The
# times returned by the MDTM FTP command are also affected by this
# option.
use_localtime=YES
#
# Activate logging of uploads/downloads.
xferlog_enable=YES
#
# Make sure PORT transfer connections originate from port 20 (ftp-data).
connect_from_port_20=YES
#
# If you want, you can arrange for uploaded anonymous files to be owned by
# a different user. Note! Using "root" for uploaded files is not
# recommended!
#chown_uploads=YES
#chown_username=whoever
#
# You may override where the log file goes if you like. The default is shown
# below.
#xferlog_file=/var/log/vsftpd.log
#
# If you want, you can have your log file in standard ftpd xferlog format.
# Note that the default log file location is /var/log/xferlog in this case.
#xferlog_std_format=YES
#
# You may change the default value for timing out an idle session.
#idle_session_timeout=600
#
# You may change the default value for timing out a data connection.
#data_connection_timeout=120
#
# It is recommended that you define on your system a unique user which the
# ftp server can use as a totally isolated and unprivileged user.
#nopriv_user=ftpsecure
#
# Enable this and the server will recognise asynchronous ABOR requests. Not
# recommended for security (the code is non-trivial). Not enabling it,
# however, may confuse older FTP clients.
#async_abor_enable=YES
#
# By default the server will pretend to allow ASCII mode but in fact ignore
# the request. Turn on the below options to have the server actually do ASCII
# mangling on files when in ASCII mode.
# Beware that on some FTP servers, ASCII support allows a denial of service
# attack (DoS) via the command "SIZE /big/file" in ASCII mode. vsftpd
# predicted this attack and has always been safe, reporting the size of the
# raw file.
# ASCII mangling is a horrible feature of the protocol.
#ascii_upload_enable=YES
#ascii_download_enable=YES
#
# You may fully customise the login banner string:
#ftpd_banner=Welcome to blah FTP service.
#
# You may specify a file of disallowed anonymous e-mail addresses. Apparently
# useful for combatting certain DoS attacks.
#deny_email_enable=YES
# (default follows)
#banned_email_file=/etc/vsftpd.banned_emails
#
# You may restrict local users to their home directories.  See the FAQ for
# the possible risks in this before using chroot_local_user or
# chroot_list_enable below.
chroot_local_user=YES
#
# You may specify an explicit list of local users to chroot() to their home
# directory. If chroot_local_user is YES, then this list becomes a list of
# users to NOT chroot().
# (Warning! chroot'ing can be very dangerous. If using chroot, make sure that
# the user does not have write access to the top level directory within the
# chroot)
#chroot_local_user=YES
#chroot_list_enable=YES
# (default follows)
#chroot_list_file=/etc/vsftpd.chroot_list
#
# You may activate the "-R" option to the builtin ls. This is disabled by
# default to avoid remote users being able to cause excessive I/O on large
# sites. However, some broken FTP clients such as "ncftp" and "mirror" assume
# the presence of the "-R" option, so there is a strong case for enabling it.
#ls_recurse_enable=YES
#
# Customization
#
# Some of vsftpd's settings don't fit the filesystem layout by
# default.
#
# This option should be the name of a directory which is empty.  Also, the
# directory should not be writable by the ftp user. This directory is used
# as a secure chroot() jail at times vsftpd does not require filesystem
# access.
secure_chroot_dir=/var/run/vsftpd/empty
#
# This string is the name of the PAM service vsftpd will use.
pam_service_name=vsftpd
#
# This option specifies the location of the RSA certificate to use for SSL
# encrypted connections.
rsa_cert_file=/etc/ssl/certs/ssl-cert-snakeoil.pem
rsa_private_key_file=/etc/ssl/private/ssl-cert-snakeoil.key
ssl_enable=NO

#
# Uncomment this to indicate that vsftpd use a utf8 filesystem.
#utf8_filesystem=YES

user_sub_token=$USER
local_root=/home/$USER/ftp
```

```
sudo nano /etc/systemd/system.conf
	RuntimeWatchdogSec=15
	RebootWatchdogSec=2min
```

```
sudo su
```
```
echo 'dtparam=watchdog=on' >> /boot/config.txt # echo 'dtparam=watchdog=on' >> /boot/firmware/config.txt
echo 'watchdog-device = /dev/watchdog' >> /etc/watchdog.conf
echo 'watchdog-timeout = 15' >> /etc/watchdog.conf
echo 'max-load-1 = 24' >> /etc/watchdog.conf
```
```
exit
```

### edit files for camera IPs, passwords, discord token, telegram token, optionally websocket server info
##### my setup as an example:
```
cd ~/Downloads/bot

sed -i 's/<iv>/xxx/' rtsp.js
sed -i 's/<key>/xxx/' rtsp.js
sed -i 's/<ws_server>/wss:\/\/xxx.onrender.com/' rtsp.js
sed -i 's/<secret>/xxx/' rtsp.js
sed -i 's/<cam1>/http:\/\/192.168.1.xx:88\/cgi-bin\/CGIProxy.fcgi?cmd=snapPicture2\&usr=xxx\&pwd=xxx/' rtsp.js
sed -i 's/<cam2>/http:\/\/192.168.1.xx:88\/cgi-bin\/CGIProxy.fcgi?cmd=snapPicture2\&usr=xxx\&pwd=xxx/' rtsp.js
sed -i 's/<cam3>/http:\/\/xxx:xxx@192.168.1.xx\/snap.jpg/' rtsp.js
sed -i 's/<cam4>/http:\/\/xxx:xxx@192.168.1.xx\/snap.jpg/' rtsp.js
sed -i 's/<cam5>/rtsp:\/\/xxx:xxx@192.168.1.xx\/22/' rtsp.js

sed -i 's/<s1>/rtsp:\/\/xxx:xxx@192.168.1.xx:88\/videoMain/' omx.sh
sed -i 's/<s2>/rtsp:\/\/xxx:xxx@192.168.1.xx:88\/videoMain/' omx.sh
sed -i 's/<s3>/rtsp:\/\/xxx:xxx@192.168.1.xx\/22/' omx.sh
sed -i 's/<s4>/rtsp:\/\/xxx:xxx@192.168.1.xx\/22/' omx.sh
sed -i 's/<s5>/rtsp:\/\/xxx:xxx@192.168.1.xx\/22/' omx.sh

sed -i 's/<telegram_bot>/xxx/' bot.js
sed -i 's/<telegram_token>/xxx/' bot.js
sed -i 's/<telegram_chat>/xxx/' bot.js
sed -i 's/<discord_channel>/xxx/' bot.js
sed -i 's/<cam_username1>/xxx/' bot.js
sed -i 's/<cam_password1>/xxx/' bot.js
sed -i 's/<cam_username2>/xxx/' bot.js
sed -i 's/<cam_password2>/xxx/' bot.js
sed -i 's/<cam1_name>/FI9804W_xxx/' bot.js
sed -i 's/<cam2_name>/FI9821W_xxx/' bot.js
sed -i 's/<cam3_name>/ipcam1/' bot.js
sed -i 's/<cam4_name>/ipcam2/' bot.js
sed -i 's/<cam5_name>/ipcam3/' bot.js
sed -i 's/<cam6_name>/ipcam4/' bot.js
sed -i 's/<cam3_name2>/cam1/' bot.js
sed -i 's/<cam4_name2>/cam2/' bot.js
sed -i 's/<cam5_name2>/cam3/' bot.js
sed -i 's/<cam6_name2>/cam4/' bot.js
sed -i 's/<cam1_ip>/192.168.1.xx:88/' bot.js
sed -i 's/<cam2_ip>/192.168.1.xx:88/' bot.js
sed -i 's/<cam3_ip>/192.168.1.xx/' bot.js
sed -i 's/<cam4_ip>/192.168.1.xx/' bot.js
sed -i 's/<cam5_ip>/192.168.1.xx/' bot.js
sed -i 's/<cam6_ip>/192.168.1.xx/' bot.js
sed -i 's/<discord_token>/xxx/' bot.js

sed -i 's/<cam1_name>/FI9804W_xxx/' clear.sh
sed -i 's/<cam2_name>/FI9821W_xxx/' clear.sh
sed -i 's/<cam3_name>/ipcam1/' clear.sh
sed -i 's/<cam4_name>/ipcam2/' clear.sh
sed -i 's/<cam5_name>/ipcam3/' clear.sh
sed -i 's/<cam6_name>/ipcam4/' clear.sh

sed -i 's/<cam1_name>/FI9804W_xxx/' clear_now.sh
sed -i 's/<cam2_name>/FI9821W_xxx/' clear_now.sh
sed -i 's/<cam3_name>/ipcam1/' clear_now.sh
sed -i 's/<cam4_name>/ipcam2/' clear_now.sh
sed -i 's/<cam5_name>/ipcam3/' clear_now.sh
sed -i 's/<cam6_name>/ipcam4/' clear_now.sh

sed -i 's/<rasp_secret>/xxx/' ws_server/index.js
sed -i 's/<phone_secret>/xxx/' ws_server/index.js

sed -i 's/<ws_server>/wss:\/\/xxx.onrender.com/' ws_server/phone.html
sed -i 's/<secret>/xxx/' ws_server/phone.html
sed -i 's/<key>/xxx/' ws_server/phone.html
sed -i 's/<iv>/xxx/' ws_server/phone.html
```

```
sudo systemctl daemon-reload
sudo systemctl restart vsftpd
sudo systemctl enable watchdog
sudo systemctl start watchdog

sudo systemctl enable picambot
sudo systemctl start picambot
sudo systemctl daemon-reload
sudo service picambot restart
sudo service picambot start

sudo systemctl enable picambotrtsp # optional
sudo systemctl start picambotrtsp # optional
sudo systemctl daemon-reload # optional
sudo service picambotrtsp restart # optional
sudo service picambotrtsp start # optional

sudo reboot
```

```
# to test watchdog, fork bomb
sudo bash -c ':(){ :|:& };:'
```

```
cat ~/Downloads/bot/log.txt
tail -f ~/Downloads/bot/log.txt
```

#### fix raspberry ip on router and enter raspberry ip, username, password for ftp authentication in camera setup
