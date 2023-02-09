const DomainEvents = require('@tryghost/domain-events');
const {MemberCommentEvent} = require('@tryghost/member-events');
const commentsService = require('../../services/comments');

const clientToServerMessages = {
    listen: 'members/comments/counts:listen'
};

const serverToClientMessages = {
    update: 'members/comments/counts:update'
};

const roomName = postId => `members/comments/counts/${postId}`;

module.exports = {
    counts: {
        clientToServerMessages,
        serverToClientMessages,
        roomName,

        register(io) {
            DomainEvents.subscribe(MemberCommentEvent, async (event) => {
                io.to(roomName(event.data.postId)).emit(serverToClientMessages.update, {
                    counts: await commentsService.controller.stats.getCountsByPost([event.data.postId])
                });
            });
        },

        onConnection(socket) {
            socket.on(clientToServerMessages.listen, (data) => {
                data.ids.forEach(id => socket.join(roomName(id)));
            });
        }
    }
};
