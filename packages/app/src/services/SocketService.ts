import SocketIOClient, { Socket } from "socket.io-client";

const DEBUG_LOG = false;


let instance: SocketService;

export default class SocketService {
  socket!: Socket;

  socketState: boolean = false;

  constructor() {
    if (instance) {
      return instance;
    }
    instance = this;
    this.initSocket();
  }

  static instance(): SocketService {
    return new SocketService();
  }

  private initSocket = () => {
    this.socket = SocketIOClient('http://localhost:8080', {
      transports: ["websocket"]
    });

    this.socket.on("connect", () => {
      if (DEBUG_LOG) console.log("Sockets: connected");
    });

    this.socket.on("disconnect", (reason: string) => {
      if (DEBUG_LOG) console.log("Sockets: disconnected");
      if (reason === "io server disconnect") {
        setTimeout(() => {
          this.socket.connect();
        }, 2000);
      }
    });

    this.socket.on("reconnect", () => {
      if (DEBUG_LOG) console.log("Sockets: reconnect");
    });

    this.socket.on("error", (error: Error) => {
      if (DEBUG_LOG) console.log("Sockets: error", error);
    });
  };

  public on = (ev: string, fn: any): void => {
    this.socket.on(ev, fn);
  };

  public off = (ev: string, fn?: any): void => {
    this.socket.off(ev, fn);
  };
}
