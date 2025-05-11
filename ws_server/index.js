var app = require('express')()
var server = require('http').createServer(app).listen(process.env.PORT || 3001)

const websocket = require('ws')
const wss = new websocket.Server({server, perMessageDeflate: true})

function heartbeat(ws) {
	ws.isAlive = true;
}

const interval = setInterval(function ping() {

	wss.clients.forEach(function each(ws) {
		
		if (ws.isAlive === false) {
			return ws.terminate();
		}

		ws.isAlive = false;

		ws.ping();

	});

}, 30000);

wss.on('close', function close() {
	clearInterval(interval);
});

wss.on('connection', (ws, req) => {

	ws.isAlive = true;

	ws.on('error', console.error);
	
	ws.on('pong', heartbeat);

	ws.on('message', (mes) => {
	
		if (mes.slice(0, 8) == '<rasp_secret>') {

			ws.authed = true
			ws.rasp = true

		} else if (mes.slice(0, 8) == '<phone_secret>') {

			ws.authed = true
			ws.phone = true
			
			ws.send("welcome")

		} else if (ws.authed = true && ws.rasp) {

			wss.clients.forEach(function each(client) {
      			if (client !== ws && client.readyState === websocket.OPEN) {
        			client.send(mes.toString());
      			}
    		});

		} else if (ws.authed = true && ws.phone) {

			wss.clients.forEach(function each(client) {
      			if (client !== ws && client.readyState === websocket.OPEN) {
        			client.send(mes.toString());
      			}
    		});

		} else {

			ws.terminate()

		}
	
	})

})
