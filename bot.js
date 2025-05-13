var threshold1 = 0.313;
var threshold2 = 0.260;
var threshold3 = 0.243;
var threshold4 = 0.172;
var threshold5 = 0.415;
var threshold6 = 0.172;

import fs from 'node:fs';
import { exec } from 'node:child_process';
import AsyncLock from 'async-lock';
import chokidar from 'chokidar';
import { Client, GatewayIntentBits, AttachmentBuilder } from 'discord.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.on('error', error => {
  console.error('Client error:', error);
});

client.on('shardError', error => {
  console.error('Websocket connection error:', error);
});

process.on('unhandledRejection', error => {
  console.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', error => {
  console.error('Uncaught exception:', error);
});

var lock = new AsyncLock();
var lock2 = new AsyncLock();

function logg(s) {
	console.log("[" + new Date(new Date().getTime()+3600*1000*3).toISOString() + "] " + s)
}

function msend(channel, m, f=null, i=0) {

	if (f != null) {

		var files = []
		for (var i = 0; i < f.length; i++) {
			files.push(new AttachmentBuilder(f[i]))
		}

		channel.send({content: m, files: files}).catch((e) => {
			logg("\n\n\n----------");
			logg("__[" + i + "]__");
			logg(m);
			logg(f);
			logg(e);
			if (i < 3) {
				setTimeout(function() {
					msend(channel, m, f, ++i)
				}, 1000);
			}
		});

	} else {

		channel.send({content: m}).catch((e) => {
			logg("\n\n\n----------");
			logg("__[" + i + "]__");
			logg(m);
			logg(e);
			if (i < 3) {
				setTimeout(function() {
					msend(channel, m, null, ++i)
				}, 1000);
			}
		});

	}

}

function cam2name(cam) {

	if (cam == "<cam1_name>") {
		return "cam1"
	} else if (cam == "<cam2_name>") {
		return "cam2"
	} else if (cam == "<cam3_name>") {
		return "cam3"
	} else if (cam == "<cam4_name>") {
		return "cam4"
	} else if (cam == "<cam5_name>") {
		return "cam5"
	} else if (cam == "<cam6_name>") {
		return "cam6"
	}

}

function processImg(done, file, cam, tf, thre) {

	var img = '/home/pi/ftp/files/' + cam + '/snap/' + file;
	var path = '/home/pi/ftp/files/' + cam + '/snap/x' + file

	exec("python3 /home/pi/Downloads/bot/tf2/" + tf + " --model /home/pi/Downloads/bot/tf2/efficientdet_lite0.tflite --threads 4 --threshold " + thre + " --img " + img + " --path " + path, (error, stdout, stderr) => {
	
		if (stdout == "" && 1 == 2) { // although tf cannot find object, still send alarm image

			setTimeout(function() {
				fs.unlink('/home/pi/ftp/files/' + cam + '/snap/x' + file, function (err) {});
				fs.rename('/home/pi/ftp/files/' + cam + '/snap/' + file, '/home/pi/ftp/files/' + cam + '/snap/done2/' + file, function (err) {});
			}, 240000);

		} else {

			var a = stdout.split('\n');
			a.pop();

			var mgo = file + '\n' + a.join("\n");

			if (a[0] == "Person detected") {
				
				exec("curl -F photo=@'" + '/home/pi/ftp/files/' + cam + '/snap/x' + file + "' 'https://api.telegram.org/<telegram_bot>:<telegram_token>/sendphoto?chat_id=<telegram_chat>&caption=" + cam2name(cam) + ": " + mgo.split('\n').join(' ') + "'", (error, stdout, stderr) => {})

			}

			var channel = client.channels.cache.get('<discord_channel>');
			msend(channel, cam2name(cam) + ": " + mgo, ['/home/pi/ftp/files/' + cam + '/snap/x' + file]);

			setTimeout(function() {
				fs.unlink('/home/pi/ftp/files/' + cam + '/snap/x' + file, function (err) {});
				fs.rename('/home/pi/ftp/files/' + cam + '/snap/' + file, '/home/pi/ftp/files/' + cam + '/snap/done/' + file, function (err) {});
			}, 240000);

		}

		done();

	});

}

function listv(msg, cam, gr) {
	var ex = "ls /home/pi/ftp/files/" + cam + "/record | grep '^alarm.*mkv$' | sed 's/alarm_202[0-9]//' | sed 's/\.mkv//' | awk '{print NR\") \"$0}'";
	if (gr != "-1") {
		ex += " | grep '" + gr + "_'";
	}
	exec(ex, (error, stdout, stderr) => {
		if (stdout == "") {
			msend(msg.channel, 'no record');
		} else {
			var a = stdout.split("\n");
			for (var i = 0; i < a.length; i = i + 100) {
				msend(msg.channel, a.slice(i, i + 100));
			}
			msend(msg.channel, '---');
		}
	});
}

function video(msg, cam) {
	var v = msg.content.split(" ")[1];
	exec("ls /home/pi/ftp/files/" + cam + "/record | grep '^alarm.*mkv$' | head -n " + v + " | tail -n 1", (error, stdout, stderr) => {
		var stdo = stdout.split("\n")[0];
		if (stdo != "") {
			exec("ps aux | grep ffmpeg | grep -v rtsp | grep -v ' grep ' | wc -l", (error, stdout, stderr) => {
				var stdo1 = stdout.split("\n")[0];
				if (stdo1 == "0") {
					msend(msg.channel, "processing " + stdo);
					exec("rm -f /home/pi/Downloads/bot/t.mp4; ffmpeg -i /home/pi/ftp/files/" + cam + "/record/" + stdo + " -c:v h264_omx -r 30 -b:v 500k /home/pi/Downloads/bot/t.mp4", (error, stdout, stderr) => {
						msend(msg.channel, stdo, ["/home/pi/Downloads/bot/t.mp4"]);
					});
				} else {
					msend(msg.channel, "already running ffmpeg");
				}
			});
		}
	});
}

function watchAlarm(cam, tf, thre) {
	fs.watch('/home/pi/ftp/files/' + cam + '/snap', (eventType, file) => {
		if (eventType == 'rename' && file.startsWith('MDAlarm') && file.endsWith('.jpg')) {
			setTimeout(function() {
				if (fs.existsSync('/home/pi/ftp/files/' + cam + '/snap/' + file) && client.ws.status == 0) {
					lock.acquire('key', function(done) {
						processImg(done, file, cam, tf, thre);
					}, function(err, ret) {});
				}
			}, 3000);
		}
	});
}

function checkAlarm(cam, tf, thre) {
	fs.readdir('/home/pi/ftp/files/' + cam + '/snap', function (err, files) {
		files.forEach(function (file) {
			if (file.startsWith('MDAlarm') && file.endsWith('.jpg') && client.ws.status == 0) {
				lock.acquire('key', function(done) {
					processImg(done, file, cam, tf, thre);
				}, function(err, ret) {});
			}
		});
	});
}

function chokidarwatch(cam, ip) {
	
	chokidar.watch('/home/pi/ftp/files/' + cam).on('add', path => {

		setTimeout(function() {
			var a = path.split("/");
			fs.rename(path, '/home/pi/ftp/files/ip' + cam + '/snap/MDAlarm' + a[a.length - 1], function (err) {});
		}, 500);

		exec("ps aux | grep 'ffmpeg -i rtsp://<cam_username1>:<cam_password1>@" + ip + "/22 -vcodec copy -r 25 -t 30 -y /home/pi/ftp/files/ip" + cam + "/record/alarm_' | grep -v ' grep ' | wc -l", (error, stdout, stderr) => {
			if (stdout.split("\n")[0] == "0") {
				exec("ffmpeg -i rtsp://<cam_username1>:<cam_password1>@" + ip + "/22 -vcodec copy -r 25 -t 30 -y /home/pi/ftp/files/ip" + cam + "/record/alarm_$(date +\%Y\%m\%d_\%H\%M\%S).mkv", (error, stdout, stderr) => {});
			}
		});

	});

}

client.once('ready', () => {

	watchAlarm("<cam1_name>", "detect2.py", threshold1);
	watchAlarm("<cam2_name>", "detect2.py", threshold2);
	watchAlarm("<cam3_name>", "detect2.py", threshold3);
	watchAlarm("<cam4_name>", "detect2.py", threshold4);
	watchAlarm("<cam5_name>", "detect2.py", threshold5);
	watchAlarm("<cam6_name>", "detect2.py", threshold6);

	chokidarwatch("<cam3_name2>", "<cam3_ip>");
	chokidarwatch("<cam4_name2>", "<cam4_ip>");
	chokidarwatch("<cam5_name2>", "<cam5_ip>");
	chokidarwatch("<cam6_name2>", "<cam6_ip>");

});

client.on('ready', () => {

	logg(`Logged in as ${client.user.tag}!`);
	var channel = client.channels.cache.get('<discord_channel>');
	msend(channel, 'raspberry online');

	checkAlarm("<cam1_name>", "detect2.py", threshold1);
	checkAlarm("<cam2_name>", "detect2.py", threshold2);
	checkAlarm("<cam3_name>", "detect2.py", threshold3);
	checkAlarm("<cam4_name>", "detect2.py", threshold4);
	checkAlarm("<cam5_name>", "detect2.py", threshold5);
	checkAlarm("<cam6_name>", "detect2.py", threshold6);

});

var lcou = 0;
var snapimg = false;
function afterimage(msg) {
	lock2.acquire('key', function(done) {
		lcou++;
		if (lcou == 5) {
			lcou = 0;
			snapimg = false;

			exec("bash -c 'if [ ! -e t1.jpg ]; then touch t1.jpg; fi; if [ ! -e t2.jpg ]; then touch t2.jpg; fi; if [ ! -e t3.jpg ]; then touch t3.jpg; fi; if [ ! -e t4.jpg ]; then touch t4.jpg; fi; if [ ! -e t5.jpg ]; then touch t5.jpg; fi; if [ ! -e t6.jpg ]; then touch t6.jpg; fi'", (error, stdout, stderr) => {
				msend(msg.channel, '', ['./t1.jpg', './t2.jpg', './t3.jpg', './t4.jpg', './t5.jpg', './t6.jpg']);
			})
		
		}
		done();
	}, function(err, ret) {});
}

client.on('messageCreate', msg => {

	if (msg.content.startsWith("clear ") && /^[0-9]+$/.test(msg.content.split(" ")[1]) && msg.content.split(" ")[1] > 0 && msg.content.split(" ")[1] < 101) {
		msg.channel.bulkDelete(msg.content.split(" ")[1]);
	}

	else if (msg.content === 'reboot cams') {

		exec("timeout 10 curl -s 'http://<cam1_ip>/cgi-bin/CGIProxy.fcgi?cmd=rebootSystem&usr=<cam_username2>&pwd=<cam_password2>' | grep -o 0", (error, stdout, stderr) => {
			if (stdout.split("\n")[0] == 0) {
				msend(msg.channel, "rebooting cam1");
			}
		})

		exec("timeout 10 curl -s 'http://<cam2_ip>/cgi-bin/CGIProxy.fcgi?cmd=rebootSystem&usr=<cam_username2>&pwd=<cam_password2>' | grep -o 0", (error, stdout, stderr) => {
			if (stdout.split("\n")[0] == 0) {
				msend(msg.channel, "rebooting cam2");
			}
		})

		exec("timeout 10 curl -s -X POST http://<cam3_ip>/web/cgi-bin/hi3510/param.cgi -H 'Content-Type: application/x-www-form-urlencoded' -H 'Authorization: Basic <auth>' -d 'cmd=sysreboot'", (error, stdout, stderr) => {
			if (stdout.split("\n")[0] == "reboot...") {
				msend(msg.channel, "rebooting cam3");
			}
		})

		exec("timeout 10 curl -s -X POST http://<cam4_ip>/web/cgi-bin/hi3510/param.cgi -H 'Content-Type: application/x-www-form-urlencoded' -H 'Authorization: Basic <auth>' -d 'cmd=sysreboot'", (error, stdout, stderr) => {
			if (stdout.split("\n")[0] == "reboot...") {
				msend(msg.channel, "rebooting cam4");
			}
		})

		exec("timeout 10 curl -s -X POST http://<cam5_ip>/web/cgi-bin/hi3510/param.cgi -H 'Content-Type: application/x-www-form-urlencoded' -H 'Authorization: Basic <auth>' -d 'cmd=sysreboot'", (error, stdout, stderr) => {
			if (stdout.split("\n")[0] == "reboot...") {
				msend(msg.channel, "rebooting cam5");
			}
		})

		exec("timeout 10 curl -s -X POST http://<cam6_ip>/web/cgi-bin/hi3510/param.cgi -H 'Content-Type: application/x-www-form-urlencoded' -H 'Authorization: Basic <auth>' -d 'cmd=sysreboot'", (error, stdout, stderr) => {
			if (stdout.split("\n")[0] == "reboot...") {
				msend(msg.channel, "rebooting cam6");
			}
		})

	}

	else if (msg.content === 'cams') {

		if (snapimg == false) {
			snapimg = true;
			lcou = 0

			msend(msg.channel, "please wait max 10 seconds");

			exec("rm -f /home/pi/Downloads/bot/t1.jpg; rm -f /home/pi/Downloads/bot/t2.jpg; rm -f /home/pi/Downloads/bot/t3.jpg; rm -f /home/pi/Downloads/bot/t4.jpg; rm -f /home/pi/Downloads/bot/t5.jpg; rm -f /home/pi/Downloads/bot/t6.jpg", (error, stdout, stderr) => {

				exec("timeout 10 curl -s 'http://<cam1_ip>/cgi-bin/CGIProxy.fcgi?cmd=snapPicture2&usr=<cam_username2>&pwd=<cam_password2>' > /home/pi/Downloads/bot/t1.jpg", (error, stdout, stderr) => {afterimage(msg);});
				exec("timeout 10 curl -s 'http://<cam2_ip>/cgi-bin/CGIProxy.fcgi?cmd=snapPicture2&usr=<cam_username2>&pwd=<cam_password2>' > /home/pi/Downloads/bot/t2.jpg", (error, stdout, stderr) => {afterimage(msg);});
				
				exec("timeout 10 ffmpeg -y -i rtsp://<cam_username1>:<cam_password1>@<cam5_ip>/22 -f image2 -vframes 1 /home/pi/Downloads/bot/t5.jpg", (error, stdout, stderr) => {afterimage(msg);});

				exec("timeout 10 ffmpeg -y -i rtsp://<cam_username1>:<cam_password1>@<cam6_ip>/22 -f image2 -vframes 1 /home/pi/Downloads/bot/t6.jpg", (error, stdout, stderr) => {afterimage(msg);});
				
				exec("timeout 10 curl -s 'http://<cam_username1>:<cam_password1>@<cam3_ip>/snap.jpg' > /home/pi/Downloads/bot/t3.jpg", (error, stdout, stderr) => {afterimage(msg);});
				exec("timeout 10 curl -s 'http://<cam_username1>:<cam_password1>@<cam4_ip>/snap.jpg' > /home/pi/Downloads/bot/t4.jpg", (error, stdout, stderr) => {afterimage(msg);});

			});

		}

	}

	else if (msg.content === 'list') {
		listv(msg, "<cam1_name>", "-1");
	}

	else if (msg.content === 'list2') {
		listv(msg, "<cam2_name>", "-1");
	}

	else if (msg.content === 'list3') {
		listv(msg, "<cam3_name>", "-1");
	}
	
	else if (msg.content === 'list4') {
		listv(msg, "<cam4_name>", "-1");
	}

	else if (msg.content === 'list5') {
		listv(msg, "<cam5_name>", "-1");
	}

	else if (msg.content === 'list6') {
		listv(msg, "<cam6_name>", "-1");
	}

	else if (msg.content.startsWith("list ") && /^[0-9]+$/.test(msg.content.split(" ")[1])) {
		listv(msg, "<cam1_name>", msg.content.split(" ")[1]);
	}

	else if (msg.content.startsWith("list2 ") && /^[0-9]+$/.test(msg.content.split(" ")[1])) {
		listv(msg, "<cam2_name>", msg.content.split(" ")[1]);
	}

	else if (msg.content.startsWith("list3 ") && /^[0-9]+$/.test(msg.content.split(" ")[1])) {
		listv(msg, "<cam3_name>", msg.content.split(" ")[1]);
	}

	else if (msg.content.startsWith("list4 ") && /^[0-9]+$/.test(msg.content.split(" ")[1])) {
		listv(msg, "<cam4_name>", msg.content.split(" ")[1]);
	}

	else if (msg.content.startsWith("list5 ") && /^[0-9]+$/.test(msg.content.split(" ")[1])) {
		listv(msg, "<cam5_name>", msg.content.split(" ")[1]);
	}

	else if (msg.content.startsWith("list6 ") && /^[0-9]+$/.test(msg.content.split(" ")[1])) {
		listv(msg, "<cam6_name>", msg.content.split(" ")[1]);
	}

	else if (msg.content.startsWith("video ") && /^[0-9]+$/.test(msg.content.split(" ")[1]) && msg.content.split(" ")[1] > 0) {
		video(msg, "<cam1_name>")
	}

	else if (msg.content.startsWith("video2 ") && /^[0-9]+$/.test(msg.content.split(" ")[1]) && msg.content.split(" ")[1] > 0) {
		video(msg, "<cam2_name>")
	}

	else if (msg.content.startsWith("video3 ") && /^[0-9]+$/.test(msg.content.split(" ")[1]) && msg.content.split(" ")[1] > 0) {
		video(msg, "<cam3_name>")
	}

	else if (msg.content.startsWith("video4 ") && /^[0-9]+$/.test(msg.content.split(" ")[1]) && msg.content.split(" ")[1] > 0) {
		video(msg, "<cam4_name>")
	}

	else if (msg.content.startsWith("video5 ") && /^[0-9]+$/.test(msg.content.split(" ")[1]) && msg.content.split(" ")[1] > 0) {
		video(msg, "<cam5_name>")
	}

	else if (msg.content.startsWith("video6 ") && /^[0-9]+$/.test(msg.content.split(" ")[1]) && msg.content.split(" ")[1] > 0) {
		video(msg, "<cam6_name>")
	}

	else if (msg.content === 'monitor1') {
		exec("bash /home/pi/Downloads/bot/omx.sh 1", (error, stdout, stderr) => {});
		msend(msg.channel, "auto exit in an hour");
	}

	else if (msg.content === 'monitor2') {
		exec("bash /home/pi/Downloads/bot/omx.sh 2", (error, stdout, stderr) => {});
		msend(msg.channel, "auto exit in an hour");
	}

	else if (msg.content === 'monitorc') {
		exec("ps aux | grep 'omx.sh cycle' | grep -v ' grep ' | wc -l", (error, stdout, stderr) => {
			var stdo1 = stdout.split("\n")[0];
			if (stdo1 == "0") {
				exec("bash -c 'bash /home/pi/Downloads/bot/omx.sh cycle &'", (error, stdout, stderr) => {});
				msend(msg.channel, "auto exit in an hour");
			} else {
				msend(msg.channel, "already running monitor in cycle mode");
			}
		});
	}

	else if (msg.content === 'free') {
		exec("df -h", (error, stdout, stderr) => {msend(msg.channel, stdout);});
	}

	else if (msg.content === 'clean') {
		exec("bash /home/pi/Downloads/bot/clear_now.sh", (error, stdout, stderr) => {msend(msg.channel, stdout);});
	}

	else if (msg.content === 'exit') {
		exec("bash /home/pi/Downloads/bot/omx.sh e", (error, stdout, stderr) => {});
	}

	else if (msg.content === 'reboot') {
		exec("sudo reboot", (error, stdout, stderr) => {});
	}

	else if (msg.content === 'restart') {
		exec("sudo service picambot restart", (error, stdout, stderr) => {});
	}		

	else if (msg.content === 'restart rtsp') {
		exec("sudo service picambotrtsp restart", (error, stdout, stderr) => {});
	}

	else if (msg.content === 'help') {
		msend(msg.channel, "Help: TO DO");
	}	

});

client.login('<discord_token>');
