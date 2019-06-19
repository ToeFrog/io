import express = require('express');
import { Server } from 'http';
import io from 'socket.io';

import { log } from './common';

import {
  ICandle,
  ICandleVote,
  ICandleVoteResult
} from './models';

export class IOHub {
  public app: express.Application;
  public io!: SocketIO.Server;
  private http!: Server;

  constructor() {
    this.app = express();
    this.http = new Server(this.app);
    this.io = io(this.http);

    this.bindIOEvents();
  }

  public start() {
    this.listen();
  }

  /**
   * Bind events to Socket.IO hub
   */
  private bindIOEvents() {
    this.io.on('connection', (socket: io.Socket) => {

      /**
       * Chat related events
       */
      socket.on('chatMessage', (userWithMessage: any) => this.onChatMessage(userWithMessage));
      socket.on('emote', (emoteUrl: string) => this.onEmote(emoteUrl));
      socket.on('userLeft', (username: string) => this.onUserLeftChannel(username));
      socket.on('userJoined', (username: string) => this.onUserJoinedChannel(username));

      /**
       * Chron related events
       */
      socket.on('followerCount', (followerCount: number) => this.onFollowerCount(followerCount));
      socket.on('viewerCount', (viewerCount: number) => this.onViewerCount(viewerCount));
      socket.on('lastFollower', (lastFollower: any) => this.onLastFollower(lastFollower[0]));
      socket.on('lastSubscriber', (lastSubscriber: any) => this.onLastSubscriber(lastSubscriber[0]));

      /**
       * Stream start/stop events
       */
      socket.on('streamStart', (activeStream: any) => this.onStreamStart(activeStream));
      socket.on('streamUpdate', (activeStream: any) => this.onStreamUpdate(activeStream));
      socket.on('streamEnd', () => this.onStreamEnd());

      /**
       * Alert related events
       */
      socket.on('newFollow', (follower: any, userInfo: any) => this.onNewFollow(follower, userInfo));
      socket.on('newSubscription', (user: any, userInfo: any, isRenewal: boolean, wasGift: boolean, message: string) => this.onNewSubscription(user, userInfo, isRenewal, wasGift, message));
      socket.on('newRaid', (username: string, userInfo: any, viewers:number) => this.onNewRaid(username, userInfo, viewers));
      socket.on('newCheer', (user: any, userInfo: any, message: string) => this.onNewCheer(user, userInfo, message));

      /**
       * User generated events
       */
      socket.on('playAudio', (soundClipName: string) => this.onPlayAudio(soundClipName));
      socket.on('stopAudio', () => this.onStopAudio());

      /**
       * Candle related events
       */
      socket.on('candleReset', this.onCandleReset);
      socket.on('candleStop', this.onCandleStop);
      socket.on('candleVote', this.onCandleVote);
      socket.on('candleWinner', this.onCandleWinner);
      socket.on('candleVoteUpdate', this.onCandleVoteUpdate);

    });
  }

  private onChatMessage(userWithMessage: any) {
    const chatMessage = userWithMessage[0];
    log('info', `onChatMessage: ${chatMessage.message}`);
    this.io.emit('chatMessage', chatMessage);
  }

  private onEmote(emoteUrl: string) {
    log('info', `onEmote: ${emoteUrl}`);
    this.io.emit('emote', emoteUrl);
  }

  private onUserJoinedChannel(username: string) {
    log('info', `onUserJoinedChannel: ${username}`);
    this.io.emit('userJoined', username);
  }

  private onUserLeftChannel(username: string) {
    log('info', `onUserLeftChannel: ${username}`);
    this.io.emit('userLeft', username);
  }

  private onNewFollow(follower: any, userInfo: any) {
    log('info', `onNewFollow: ${follower.user}`);
    this.io.emit('newFollow', userInfo);
  }

  private onNewSubscription(user: any, userInfo: any, isRenewal: boolean, wasGift: boolean, message: string) {
    log('info', `onNewSubscription: ${user.username}`);
    this.io.emit('newSubscription', user, userInfo, isRenewal, wasGift, message);
  }

  private onNewRaid(username: string, userInfo: any, viewers:number) {
    log('info', `onNewRaid: ${username}: ${viewers}`);
    this.io.emit('newRaid', username, userInfo, viewers);
  }

  private onNewCheer(user: any, userInfo: any, message: string) {
    log('info', `onNewCheer: ${user.username}`);
    this.io.emit('newCheer', user, userInfo, message);
  }

  private onFollowerCount(followerCount: number) {
    log('info', `onFollowerCount: ${followerCount}`);
    this.io.emit('followerCount', followerCount);
  }

  private onViewerCount(viewerCount: number) {
    log('info', `onViewerCount: ${viewerCount}`);
    this.io.emit('viewerCount', viewerCount);
  }

  private onLastFollower(lastFollower: any) {
    log('info', `onLastFollower: ${lastFollower.login}`);
    this.io.emit('lastFollower', lastFollower);
  }

  private onLastSubscriber(lastSubscriber: any) {
    log('info', `onLastSubscriber: ${lastSubscriber.login}`);
    this.io.emit('lastSubscriber', lastSubscriber);
  }

  private onPlayAudio(soundClipName: string) {
    log('info', `onPlayAudio: ${soundClipName}`);
    this.io.emit('playAudio', soundClipName);
  }

  private onStopAudio() {
    log('info', `onStopAudio`);
    this.io.emit('stopAudio');
  }

  private onStreamStart(activeStream: any) {
    activeStream = activeStream[0];
    log('info', `onStreamStart: ${activeStream.id}`);
    this.io.emit('streamStart', activeStream);
  }

  private onStreamUpdate(activeStream: any) {
    activeStream = activeStream[0];
    log('info', `onStreamUpdate: ${activeStream.id}`);
    this.io.emit('streamUpdate', activeStream);
  }

  private onStreamEnd() {
    log('info', `onStreamEnd`);
    this.io.emit('streamEnd');
  }

  private onCandleWinner(streamCandle: ICandle) {
    log('info', 'onCandleWinner');
    this.io.emit('candleWinner', streamCandle);
  }

  private onCandleStop(streamId: string) {
    log('info', 'onCandleStop');
    this.io.emit('candleStop', streamId);
  }

  private onCandleVote(streamId: string, candleVote: ICandleVote) {
    log('info', 'onCandleVote');
    this.io.emit('candleVote', streamId, candleVote);
  }

  private onCandleReset(streamId: string) {
    log('info', 'onCandleReset');
    this.io.emit('candleReset', streamId);
  }

  private onCandleVoteUpdate(results: ICandleVoteResult[]) {
    log('info', 'onCandleVoteUpdate');
    this.io.emit('candleVoteUpdate', results);
  }

  /**
   * Start the Node.js server
   */
  private listen = (): void => {
    this.http.listen(80, () => {
      log('info', 'listening on *:80');
    });
  };
}