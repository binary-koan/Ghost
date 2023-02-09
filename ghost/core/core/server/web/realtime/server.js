const debug = require('@tryghost/debug')('web:api:default:app');
const {Server} = require('socket.io');
const api = require('../../api').realtime;

module.exports = function setupRealtimeServer(httpServer, subdir = '') {
    debug('Realtime API setup start');

    const io = new Server(httpServer, {
        path: `${subdir}/socket.io/`
    });

    api.commentsMembers.counts.register(io);

    io.on('connection', (socket) => {
        api.commentsMembers.counts.onConnection(socket);
    });

    debug('Realtime API setup end');
    return io;
};
