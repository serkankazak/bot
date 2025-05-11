import WebSocket from 'ws';
import { exec } from 'node:child_process';
import sharp from 'sharp';

var ws = null;

var width = 640;
var height = 360;
var quality = 70;
var timeout = 10;

var enc = " | openssl enc -aes-256-cbc -iv '<iv>' -K '<key>' -base64 | tr -d '\n'"

function connect(ws) {

  function heartbeat() {

    clearTimeout(ws.pingTimeout);
    
    ws.pingTimeout = setTimeout(() => {
      ws.terminate();
    }, 30000 + 3000);

  }

  ws = new WebSocket('<ws_server>');

  ws.on('ping', heartbeat);

  ws.on('close', function clear() {
    clearTimeout(this.pingTimeout);
  });

  ws.on('open', function open() {
    
    heartbeat()

    ws.send('<secret>');
  
  });

  ws.on('message', function message(data) {

    if (data.slice(0, 4) == "cam1") {

      exec("timeout " + timeout + " curl -s '<cam1>' | base64 -w 0" + enc, (error, stdout, stderr) => {

        ws.send('cam1\t' + stdout.split("\n")[0])

      });

    } else if (data.slice(0, 4) == "cam2") {

      exec("timeout " + timeout + " curl -s '<cam2>' | base64 -w 0" + enc, (error, stdout, stderr) => {

        ws.send('cam2\t' + stdout.split("\n")[0])
      
      });

    } else if (data.slice(0, 4) == "cam3") {

      exec("timeout " + timeout + " curl -s '<cam3>' | base64 -w 0", (error, stdout, stderr) => {

        var stdo = stdout.split("\n")[0];

        try {

          sharp(Buffer.from(stdo, 'base64'))
            .resize(width, height).jpeg({quality: quality})
            .toBuffer()
            .then(resizedImageBuffer => {
              let resizedImageData = resizedImageBuffer.toString('base64');
              
              exec("echo -n '" + resizedImageData + "'" + enc, (error, stdout, stderr) => {

                var stdo = stdout.split("\n")[0];
                ws.send('cam3\t' + stdo)

              });
                
            })
            .catch(error => {})

        } catch(e) {

          ws.send("info\tcam3: input buffer is empty")

        }

      });

    } else if (data.slice(0, 4) == "cam4") {

      exec("timeout " + timeout + " curl -s '<cam4>' | base64 -w 0", (error, stdout, stderr) => {

        var stdo = stdout.split("\n")[0];

        try {

          sharp(Buffer.from(stdo, 'base64'))
            .resize(width, height).jpeg({quality: quality})
            .toBuffer()
            .then(resizedImageBuffer => {
              let resizedImageData = resizedImageBuffer.toString('base64');
          
              exec("echo -n '" + resizedImageData + "'" + enc, (error, stdout, stderr) => {

                var stdo = stdout.split("\n")[0];
                ws.send('cam4\t' + stdo)

              });
                
            })
            .catch(error => {})
        
        } catch(e) {

          ws.send("info\tcam4: input buffer is empty")

        }
      
      });

    } else if (data.slice(0, 4) == "cam5") {

      exec("rm -f temp.jpg; timeout " + timeout + " ffmpeg -y -i <cam5> -f image2 -vframes 1 temp.jpg; cat temp.jpg | base64 -w 0", (error, stdout, stderr) => {

        var stdo = stdout.split("\n")[0];

        try {

          sharp(Buffer.from(stdo, 'base64'))
            .resize(width, height).jpeg({quality: quality})
            .toBuffer()
            .then(resizedImageBuffer => {
              let resizedImageData = resizedImageBuffer.toString('base64');
              
              exec("echo -n '" + resizedImageData + "'" + enc, (error, stdout, stderr) => {

                var stdo = stdout.split("\n")[0];
                ws.send('cam5\t' + stdo)

              });
                
            })
            .catch(error => {})

        } catch(e) {

          ws.send("info\tcam5: input buffer is empty")

        }

      });

    }

  });

  ws.onclose = function(e) {
    setTimeout(function() {
      connect()
    }, 3000)
  }

  ws.onerror = function(err) {
    console.error('error', err.message)
    ws.close()
  }

}

connect()
