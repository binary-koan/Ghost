const assert = require('assert');
const {agentProvider, mockManager, fixtureManager, configUtils} = require('../../utils/e2e-framework');
const settingsCache = require('../../../core/shared/settings-cache');
const sinon = require('sinon');
const models = require('../../../core/server/models');
const {io: ioClient} = require('socket.io-client');

let membersAgent, membersAgent2, ghostServer, postId, socketClient;

async function commentOnPost() {
    await membersAgent
        .post(`/api/comments/`)
        .body({comments: [{
            post_id: postId,
            html: 'This is a comment'
        }]})
        .expectStatus(201);
}

async function replyToComment() {
    await membersAgent
        .post(`/api/comments/`)
        .body({comments: [{
            post_id: postId,
            parent_id: fixtureManager.get('comments', 0).id,
            html: 'This is a reply'
        }]})
        .expectStatus(201);
}

describe('Comments real-time API', function () {
    before(async function () {
        const agents = await agentProvider.getAgentsWithFrontend();
        membersAgent = agents.membersAgent;
        membersAgent2 = membersAgent.duplicate();
        ghostServer = agents.ghostServer;

        await fixtureManager.init('posts', 'members', 'comments');

        postId = fixtureManager.get('posts', 0).id;

        socketClient = ioClient(`http://localhost:${agents.ghostServer.httpServer.address().port}`);
    });

    after(async function () {
        socketClient.disconnect();
        await ghostServer.stop();
    });

    beforeEach(function () {
        mockManager.mockMail();
    });

    afterEach(async function () {
        await configUtils.restore();
        mockManager.restore();

        socketClient.removeAllListeners();
    });

    describe('when listening to the comment count', function () {
        let getStub, originalCount;

        before(async function () {
            await membersAgent.loginAs('member@example.com');

            socketClient.emit('listen:members/comments/counts', {
                ids: [postId]
            });
        });

        beforeEach(async function () {
            getStub = sinon.stub(settingsCache, 'get');
            getStub.callsFake((key, options) => {
                if (key === 'comments_enabled') {
                    return 'all';
                }
                return getStub.wrappedMethod.call(settingsCache, key, options);
            });

            originalCount = await models.Comment.where({post_id: postId}).count();
        });

        afterEach(async function () {
            sinon.restore();
        });

        it('triggers a comment count update after commenting on a post', function (done) {
            socketClient.on('members/comments/counts/update', (data) => {
                assert.deepStrictEqual(data, {
                    counts: {
                        [postId]: originalCount + 1
                    }
                });
                done();
            });

            commentOnPost();
        });

        it('triggers a comment count update after replying to a comment', function (done) {
            socketClient.on('members/comments/counts/update', (data) => {
                assert.deepStrictEqual(data, {
                    counts: {
                        [postId]: originalCount + 1
                    }
                });
                done();
            });

            replyToComment();
        });

        describe('when another user comments', function () {
            beforeEach(async function () {
                await membersAgent2.loginAs('member2@example.com');
            });

            it('triggers a comment count update', function (done) {
                socketClient.on('members/comments/counts/update', (data) => {
                    assert.deepStrictEqual(data, {
                        counts: {
                            [postId]: originalCount + 1
                        }
                    });
                    done();
                });

                replyToComment();
            });
        });
    });
});
