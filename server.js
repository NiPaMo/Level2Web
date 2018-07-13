var express = require('express');
var http = require('http');
var app = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server);
var ping = require('ping');

app.use(express.static('public'));

app.get('/', function (req, res) {
    res.redirect('html/Index.htm');
});

var hostNames = ['MSODT2', 'MSODT3', 'MSOHSM', 'MSOHSA', 'MSOCC1', 'MSOAOD', 'MSOEAF'];
var frequency = 30000; //30 seconds
var nspIndex = io.of('/index');
var nspChat = io.of('/chat');

hostNames.forEach(function(host){
    setInterval(function() {
        ping.sys.probe(host, function(active){
            var info = active ? 'Online' : 'Offline';
            nspIndex.sockets.emit('update-msg', info);
        });
    }, frequency);
});

users = [];
nspChat.on('connection', function(socket)  {
    // Get client IP Address
    var ip = socket.request.connection.remoteAddress;
    if (ip.substr(0,7) == "::ffff:"){
        ip = ip.replace("::ffff:", "");
    }

    var date = new Date();
    // For todays date;
    Date.prototype.today = function () { 
        return (((this.getMonth()+1) < 10)?"0":"") + (this.getMonth()+1) +"/"+ ((this.getDate() < 10)?"0":"") + this.getDate() +"/"+ this.getFullYear();
    };

    // For the time now
    Date.prototype.timeNow = function () {
        return ((this.getHours() < 10)?"0":"") + this.getHours() +":"+ ((this.getMinutes() < 10)?"0":"") + this.getMinutes() +":"+ ((this.getSeconds() < 10)?"0":"") + this.getSeconds();
    };

    console.log(date.today() + " " + date.timeNow() + " " + 'New connection from ' + ip);

    socket.on('setUsername', function(data) {    
        if(users.indexOf(data) > -1) {
            socket.emit('userExists', data + ' username is taken! Try some other username.');
        } else {
            users.push(data);
            socket.emit('userSet', {username: data});
            console.log(ip + " set as " + data);
        }
    });
    
    socket.on('msg', function(data) {
        //Send message to everyone
        io.sockets.emit('newmsg', data);
        console.log(data.user + ": " + data.message);
    });

    socket.on('disconnect', function(data) {
        console.log(data + ' disconnected');
    });
});

server.listen(80, function () {

    var host = server.address().address;
    var port = server.address().port;

    console.log('Express app listening at http://%s:%s', host, port);
});