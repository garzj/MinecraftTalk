import { is } from 'typescript-is';
import { Socket } from 'socket.io';
import { Token } from '../../bin/Token';
import { validateToken } from '../../bin/validate-token';
import { APIConn } from '../APIConn';
import { APIManager } from '../APIManager';
import { clientAPIAuthenticator } from './authenticator';

export class ClientConn extends APIConn {
  token: Token | null;

  constructor(mgr: APIManager, socket: Socket) {
    super(mgr, socket);

    this.token = clientAPIAuthenticator(this.socket);
    this.auth();

    this.api();
  }

  api() {
    // Validation errors
    let message: string;
    this.socket.use((e, next) => {
      message = e[0];
      next();
    });
    const vErr = () => this.socket.emit('validation-error', message);

    // API
    this.socket.on('get-player-data', (ack: Function) => {
      if (typeof ack !== 'function') return vErr();

      ack({ uuid: this.token!.uuid, name: this.token!.name });
    });

    this.socket.on('logout', () => {
      this.mgr.clientApi.logoutUser(this.token!.uuid);
    });
  }

  logout() {
    this.socket.emit('logout');
    this.unauth();
  }

  auth() {
    this.socket.use((e, next) => {
      this.token = validateToken(this.token);
      if (this.token) {
        this.socket.emit('logged-in');
        next();
      } else {
        this.socket.emit('token-expired');
        this.unauth();
      }
    });
  }

  unauth() {
    this.token = null;
    this.socket.offAny();
  }
}
